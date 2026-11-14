"""Zincir testi: bir track'teki tüm provisional GUNW çiftlerinden Mexico City kesitini okur,
iyonosferi çıkarır, sabit kaya bölgesine (Santa Fe) göre referanslar ve birikmiş hareketi toplar.
Tek çiftte atmosfer gürültüsü ±3 cm; ardışık zincirde bu gürültü birikmez, çökme birikir.

Çalıştır:  backend\\.venv\\Scripts\\python backend\\chain_test.py --track 113
Çıktı:     backend/out/cache/<track>/*.npz  (çift başına kesit, tekrar okumaz)
           backend/out/chain_<track>.png, chain_<track>.json
"""
import argparse, json, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from probe_gunw import CDMX, LAMBDA_L_CM, latlon_to_utm, search, signed_url  # noqa: E402

OUT = Path(__file__).parent / "out"
GRP = "science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/"
REF = (19.36, -99.26)  # Santa Fe: havza dışı kaya zemin


def get_token():
    import os
    t = os.environ.get("EARTHDATA_TOKEN")
    if not t and sys.platform == "win32":
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
            t = winreg.QueryValueEx(k, "EARTHDATA_TOKEN")[0]
    return t


def pair_dates(name):
    n = name.split("_")
    i = n.index("SH")
    return n[i + 1][:8], n[i + 3][:8]


def read_pair(g, token, cache, tries=4):
    for k in range(tries):
        try:
            return _read_pair(g, token, cache)
        except Exception as e:  # ağ zaman aşımı: yeni imzalı adresle tekrar dene
            print(f"  tekrar {k + 1}/{tries}: {g['name'][36:80]} ({type(e).__name__})", flush=True)
            time.sleep(5 * (k + 1))
    return None


RG = "science/LSAR/GUNW/metadata/radarGrid/"
CITY_H = 2240.0  # havza yüksekliği (m, elipsoit üstü yaklaşık)
CORR = {"wet": "wetTroposphericPhaseScreen", "hydro": "hydrostaticTroposphericPhaseScreen", "set": "slantRangeSolidEarthTidesPhase"}


def _corrections(h, xs, ys):
    """Hava modeli troposfer gecikmesi ve katı yer gelgiti: kaba 3B küpten şehir yüksekliğindeki katman (doğrusal ara değer)."""
    x, y = h[RG + "xCoordinates"][:], h[RG + "yCoordinates"][:]
    hs = h[RG + "heightAboveEllipsoid"][:]
    k1 = int(np.searchsorted(hs, CITY_H)); k0 = max(0, k1 - 1); k1 = min(k1, len(hs) - 1)
    w = 0.0 if k1 == k0 else (CITY_H - hs[k0]) / (hs[k1] - hs[k0])
    pad = 2000
    ix = np.where((x >= min(xs) - pad) & (x <= max(xs) + pad))[0]
    iy = np.where((y >= min(ys) - pad) & (y <= max(ys) + pad))[0]
    out = dict(cx=x[ix], cy=y[iy])
    for key, name in CORR.items():
        cube = h[RG + name][k0:k1 + 1, iy.min():iy.max() + 1, ix.min():ix.max() + 1].astype("float64")
        out[key] = ((1 - w) * cube[0] + w * cube[-1]).astype("float32")
        out[key + "_units"] = str(h[RG + name].attrs.get("units", b""))
    return out


def _read_pair(g, token, cache):
    ref, sec = pair_dates(g["name"])
    path = cache / f"{ref}_{sec}.npz"
    old = dict(np.load(path)) if path.exists() else None
    if old is not None and "wet" in old:
        return path
    import fsspec, h5py
    url = signed_url(g["url"], token)
    import aiohttp
    fs = fsspec.filesystem("http", skip_instance_cache=True, client_kwargs={"timeout": aiohttp.ClientTimeout(total=900, sock_read=300)})
    f = fs.open(url, "rb", block_size=2 * 2**20, cache_type="blockcache", size=g["bytes"])
    with h5py.File(f, "r") as h:
        x = h[GRP + "xCoordinates"][:]
        y = h[GRP + "yCoordinates"][:]
        zone = int(h[GRP + "projection"][()]) - 32600
        xs, ys = zip(*[latlon_to_utm(la, lo, zone) for la in (CDMX["south"], CDMX["north"]) for lo in (CDMX["west"], CDMX["east"])])
        corr = _corrections(h, xs, ys)
        if old is None:
            ix = np.where((x >= min(xs)) & (x <= max(xs)))[0]
            iy = np.where((y >= min(ys)) & (y <= max(ys)))[0]
            sl = (slice(iy.min(), iy.max() + 1), slice(ix.min(), ix.max() + 1))
            rx, ry = latlon_to_utm(*REF, zone)
            old = dict(
                unw=h[GRP + "unwrappedPhase"][sl].astype("float32"),
                iono=h[GRP + "ionospherePhaseScreen"][sl].astype("float32"),
                cc=h[GRP + "connectedComponents"][sl].astype("int16"),
                coh=h[GRP + "coherenceMagnitude"][sl].astype("float16"),
                x=x[sl[1]], y=y[sl[0]], ref_xy=np.array([rx, ry]),
            )
    tmp = path.with_suffix(".tmp.npz")
    np.savez_compressed(tmp, **old, **corr)
    tmp.replace(path)
    print(f"  ok {ref}_{sec}", flush=True)
    return path


def to_grid(arr, ax, ay, bx, by):
    """Kaba düzeltme ızgarasını veri ızgarasına bilineer taşır."""
    if ax[0] > ax[-1]:
        ax, arr = ax[::-1], arr[:, ::-1]
    if ay[0] > ay[-1]:
        ay, arr = ay[::-1], arr[::-1]
    rows = np.array([np.interp(bx, ax, r) for r in arr])
    return np.array([np.interp(by, ay, rows[:, j]) for j in range(rows.shape[1])]).T


def correction(d, mode):
    if mode == "none" or "wet" not in d.files:
        return 0.0
    c = d["wet"] + d["hydro"]
    if mode == "tropo_set":
        c = c + d["set"]
    return to_grid(c, d["cx"], d["cy"], d["x"], d["y"])


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", type=int, default=113)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--corr", default="tropo", choices=["none", "tropo", "tropo_set"],
                    help="hava modeli troposfer (ve gelgit) düzeltmesi")
    ap.add_argument("--sign", type=int, default=1, choices=[1, -1], help="düzeltme işareti (ürün kuralı doğrulanınca sabitlenecek)")
    a = ap.parse_args()
    cache = OUT / "cache" / str(a.track)
    cache.mkdir(parents=True, exist_ok=True)

    files = search(a.track)
    # Aynı çiftin birden fazla sürümü varsa sonuncuyu al
    by = {}
    for g in files:
        by[pair_dates(g["name"])] = g
    pairs = sorted(by)
    print(f"Track {a.track}: {len(pairs)} çift, {pairs[0][0]} -> {pairs[-1][1]}")
    gaps = [(p, q) for p, q in zip(pairs, pairs[1:]) if p[1] != q[0]]
    print("Zincirde kopukluk:", gaps or "yok")

    token = get_token()
    t0 = time.time()
    with ThreadPoolExecutor(a.workers) as ex:
        paths = list(ex.map(lambda p: read_pair(by[p], token, cache), pairs))
    print(f"Okuma bitti: {time.time() - t0:.0f} sn")

    cum, dates, series_ref = None, [pairs[0][0]], []
    stack = []
    missing = [p for p, path in zip(pairs, paths) if path is None]
    if missing:
        sys.exit(f"Okunamayan çiftler: {missing}. Tekrar çalıştır; okunanlar önbellekte.")
    for p, path in zip(pairs, paths):
        d = np.load(path)
        ph = d["unw"] - d["iono"] - a.sign * correction(d, a.corr)
        bad = ~np.isfinite(ph) | (d["cc"] == 0)
        cm = -ph * LAMBDA_L_CM / (4 * np.pi)
        jx = np.abs(d["x"] - d["ref_xy"][0]).argmin()
        jy = np.abs(d["y"] - d["ref_xy"][1]).argmin()
        win = cm[max(0, jy - 15):jy + 16, max(0, jx - 15):jx + 16]
        cm = cm - np.nanmedian(win)
        cm[bad] = np.nan
        if cum is None:
            cum = np.zeros_like(cm); nbad = np.zeros(cm.shape, int)
        nbad += np.isnan(cm)
        cum = cum + np.nan_to_num(cm)
        dates.append(p[1])
        stack.append(cum.copy())
    days = (np.datetime64(f"{dates[-1][:4]}-{dates[-1][4:6]}-{dates[-1][6:]}") - np.datetime64(f"{dates[0][:4]}-{dates[0][4:6]}-{dates[0][6:]}")).astype(int)
    cum[nbad > len(pairs) * 0.3] = np.nan
    # Hız: uç noktalar yerine tüm tarihlere doğru uydur (tek tarihin atmosfer gürültüsü baskın olmasın)
    tdays = np.array([(np.datetime64(f"{d[:4]}-{d[4:6]}-{d[6:]}") - np.datetime64(f"{dates[0][:4]}-{dates[0][4:6]}-{dates[0][6:]}")).astype(int) for d in dates], float)
    S = np.stack([np.zeros_like(cum)] + stack)  # (tarih, y, x), ilk tarih 0
    tc = tdays - tdays.mean()
    rate = np.tensordot(tc, S - S.mean(0), axes=1) / (tc @ tc) * 365
    rate[np.isnan(cum)] = np.nan
    np.savez_compressed(OUT / f"rate_{a.track}{"" if a.corr == "tropo" else "_" + a.corr}.npz", rate=rate.astype("float32"), stack=S.astype("float32"),
                        dates=np.array(dates), x=np.load(paths[0])["x"], y=np.load(paths[0])["y"])

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(12, 5.5))
    im = ax[0].imshow(cum, cmap="RdBu", vmin=-40, vmax=40)
    ax[0].set_title(f"Birikmiş LOS hareketi (cm), {dates[0]} - {dates[-1]}, track {a.track}", fontsize=9)
    plt.colorbar(im, ax=ax[0], shrink=0.8)
    wrapped = np.angle(np.exp(1j * (-cum * 4 * np.pi / LAMBDA_L_CM)))
    ax[1].imshow(np.where(np.isnan(cum), np.nan, wrapped), cmap="hsv")
    ax[1].set_title("Aynı hareket, sarılı (bir tur = 11.9 cm)", fontsize=9)
    plt.savefig(OUT / f"chain_{a.track}.png", dpi=110, bbox_inches="tight")
    plt.close()

    d0 = np.load(paths[0])
    def at(lat, lon):
        zone = 14
        x, y = latlon_to_utm(lat, lon, zone)
        jx, jy = np.abs(d0["x"] - x).argmin(), np.abs(d0["y"] - y).argmin()
        w = rate[max(0, jy - 3):jy + 4, max(0, jx - 3):jx + 4]
        return round(float(np.nanmedian(w)), 1)
    pts = {"Nezahualcoyotl": (19.40, -99.015), "AICM": (19.436, -99.072), "Iztapalapa": (19.357, -99.058), "Chalco": (19.265, -98.93),
           "Xochimilco": (19.262, -99.10), "Zocalo": (19.433, -99.133), "Angel": (19.427, -99.168), "SantaFe": (19.36, -99.26)}
    res = dict(track=a.track, pairs=len(pairs), first=dates[0], last=dates[-1], days=int(days),
               rate_los_cm_yr={k: at(*v) for k, v in pts.items()},
               rate_p1_p99=[float(np.nanpercentile(rate, q)) for q in (1, 99)])
    (OUT / f"chain_{a.track}.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
