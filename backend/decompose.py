"""İki bakış yönünü (descending 113 + ascending 19) birleştirip gerçek DİKEY ve DOĞU-BATI hıza ayırır.

Her track yalnızca uyduya doğru (LOS) hareketi görür:
    v_los = e*vE + n*vN + u*vU      (e, n, u: yerden uyduya birim vektör)
NISAR kutup yörüngesinde olduğundan kuzey-güney hareketine çok az duyarlı; vN = 0 kabul edilir.
İki track = her pikselde 2 denklem, 2 bilinmeyen (vE, vU).

Önce:  chain_test.py --track 113  ve  --track 19  (rate_<track>.npz üretir)
Çalıştır:  backend\\.venv\\Scripts\\python backend\\decompose.py
Çıktı:     out/geom_<track>.npz, out/vertical.npz, out/vertical.png, out/vertical.json
"""
import json, sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from probe_gunw import CDMX, latlon_to_utm, search, signed_url  # noqa: E402
from chain_test import get_token  # noqa: E402

OUT = Path(__file__).parent / "out"
RG = "science/LSAR/GUNW/metadata/radarGrid/"
CITY_H = 2240.0  # Mexico City havzası, elipsoit yüksekliğine yakın (m); geometri bununla çok az değişir
TRACKS = (113, 19)


def geometry(track):
    """LOS birim vektör küpünden şehir yüksekliğindeki katmanı keser (tek dosya yeter, geometri sabit)."""
    path = OUT / f"geom_{track}.npz"
    if path.exists():
        return np.load(path)
    import fsspec, h5py, aiohttp
    g = search(track)[-1]
    url = signed_url(g["url"], get_token())
    fs = fsspec.filesystem("http", skip_instance_cache=True, client_kwargs={"timeout": aiohttp.ClientTimeout(total=900)})
    with h5py.File(fs.open(url, "rb", block_size=2**20, cache_type="blockcache", size=g["bytes"]), "r") as h:
        x, y = h[RG + "xCoordinates"][:], h[RG + "yCoordinates"][:]
        hs = h[RG + "heightAboveEllipsoid"][:]
        k = int(np.abs(hs - CITY_H).argmin())
        zone = int(h[RG + "projection"][()]) - 32600
        xs, ys = zip(*[latlon_to_utm(la, lo, zone) for la in (CDMX["south"], CDMX["north"]) for lo in (CDMX["west"], CDMX["east"])])
        pad = 2000
        ix = np.where((x >= min(xs) - pad) & (x <= max(xs) + pad))[0]
        iy = np.where((y >= min(ys) - pad) & (y <= max(ys) + pad))[0]
        sl = (k, slice(iy.min(), iy.max() + 1), slice(ix.min(), ix.max() + 1))
        np.savez_compressed(path, e=h[RG + "losUnitVectorX"][sl], n=h[RG + "losUnitVectorY"][sl],
                            inc=h[RG + "incidenceAngle"][sl], x=x[ix], y=y[iy], height=hs[k])
    print(f"Geometri track {track}: yükseklik katmanı {hs[k]:.0f} m")
    return np.load(path)


def resample(arr, ax, ay, bx, by):
    """En yakın komşu: (ay, ax) ızgarasındaki arr'ı (by, bx) ızgarasına taşır."""
    ix = np.clip(np.searchsorted(ax, bx) if ax[1] > ax[0] else len(ax) - 1 - np.searchsorted(ax[::-1], bx), 0, len(ax) - 1)
    iy = np.clip(np.searchsorted(ay, by) if ay[1] > ay[0] else len(ay) - 1 - np.searchsorted(ay[::-1], by), 0, len(ay) - 1)
    return arr[np.ix_(iy, ix)]


def smooth_resample(arr, ax, ay, bx, by):
    """Geometri küpü kaba (yüzlerce m); bilineer ara değerleme ile hedef ızgaraya taşır."""
    from numpy import interp
    rows = np.array([interp(bx, ax if ax[1] > ax[0] else ax[::-1], r if ax[1] > ax[0] else r[::-1]) for r in arr])
    ay_inc = ay[1] > ay[0]
    a2 = ay if ay_inc else ay[::-1]
    r2 = rows if ay_inc else rows[::-1]
    return np.array([interp(by, a2, r2[:, j]) for j in range(r2.shape[1])]).T


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    R = {t: np.load(OUT / f"rate_{t}.npz") for t in TRACKS}
    G = {t: geometry(t) for t in TRACKS}
    ref = R[TRACKS[0]]
    bx, by = ref["x"], ref["y"]

    rows = []
    for t in TRACKS:
        v = resample(R[t]["rate"], R[t]["x"], R[t]["y"], bx, by)
        e = smooth_resample(G[t]["e"], G[t]["x"], G[t]["y"], bx, by)
        n = smooth_resample(G[t]["n"], G[t]["x"], G[t]["y"], bx, by)
        u = np.sqrt(np.clip(1 - e**2 - n**2, 0, 1))
        rows.append((v, e, u))
        print(f"Track {t}: ortalama LOS vektörü e={np.nanmean(e):+.3f} n={np.nanmean(n):+.3f} u={np.nanmean(u):.3f}")

    (v1, e1, u1), (v2, e2, u2) = rows
    det = e1 * u2 - e2 * u1
    vE = (v1 * u2 - v2 * u1) / det
    vU = (e1 * v2 - e2 * v1) / det
    ok = np.isfinite(v1) & np.isfinite(v2) & (np.abs(det) > 0.2)
    vE[~ok] = np.nan
    vU[~ok] = np.nan
    np.savez_compressed(OUT / "vertical.npz", vU=vU.astype("float32"), vE=vE.astype("float32"), x=bx, y=by)

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(12, 5.5))
    a0 = ax[0].imshow(vU, cmap="RdBu", vmin=-40, vmax=40)
    ax[0].set_title("Dikey hız (cm/yıl), eksi = çöküyor", fontsize=10)
    plt.colorbar(a0, ax=ax[0], shrink=0.8)
    a1 = ax[1].imshow(vE, cmap="PuOr", vmin=-10, vmax=10)
    ax[1].set_title("Doğu-batı hız (cm/yıl), artı = doğuya", fontsize=10)
    plt.colorbar(a1, ax=ax[1], shrink=0.8)
    plt.savefig(OUT / "vertical.png", dpi=110, bbox_inches="tight")
    plt.close()

    def at(lat, lon, arr):
        x, y = latlon_to_utm(lat, lon, 14)
        jx, jy = np.abs(bx - x).argmin(), np.abs(by - y).argmin()
        return round(float(np.nanmedian(arr[max(0, jy - 3):jy + 4, max(0, jx - 3):jx + 4])), 1)
    pts = {"Nezahualcoyotl": (19.40, -99.015), "AICM": (19.436, -99.072), "Iztapalapa": (19.357, -99.058), "Chalco": (19.265, -98.93),
           "Xochimilco": (19.262, -99.10), "Zocalo": (19.433, -99.133), "Angel": (19.427, -99.168), "SantaFe": (19.36, -99.26)}
    res = {k: dict(vertical_cm_yr=at(*v, vU), east_cm_yr=at(*v, vE),
                   los113=at(*v, rows[0][0]), los19=at(*v, rows[1][0])) for k, v in pts.items()}
    res["_valid_frac"] = float(ok.mean())
    res["_vertical_p1_p99"] = [float(np.nanpercentile(vU, q)) for q in (1, 99)]
    (OUT / "vertical.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
