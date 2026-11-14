"""Tek dosya testi: bir NISAR L2 GUNW dosyasını İNDİRMEDEN buluttan açar, içini listeler,
Mexico City kutusunu keser ve PNG olarak kaydeder.

Gerekli: EARTHDATA_TOKEN ortam değişkeni (urs.earthdata.nasa.gov > Generate Token).
Çalıştır:  backend\\.venv\\Scripts\\python backend\\probe_gunw.py [--track 113]
Çıktı:     backend/out/probe/  (layers.txt, *.png, summary.json)

Token sadece ASF'nin kendi indirme adresine, Authorization başlığıyla gönderilir; yazdırılmaz.
"""
import argparse, json, math, os, sys, time, urllib.parse
from pathlib import Path

import numpy as np
import requests

OUT = Path(__file__).parent / "out" / "probe"
SEARCH = "https://api.daac.asf.alaska.edu/services/search/param"
CDMX = dict(south=19.15, north=19.60, west=-99.30, east=-98.85)
LAMBDA_L_CM = 23.84  # NISAR L-band dalga boyu (yaklaşık)


def search(track=None, point="POINT(-99.07 19.40)"):
    p = dict(dataset="NISAR", processingLevel="GUNW", intersectsWith=point, output="geojson", maxResults=2000)
    feats = requests.get(SEARCH, params=p, timeout=120).json()["features"]
    out = []
    for f in feats:
        pr = f["properties"]
        if "PROVISIONAL" not in (pr.get("collectionName") or ""):
            continue
        if track and pr.get("pathNumber") != track:
            continue
        out.append(dict(url=pr["url"], name=pr["fileName"], track=pr["pathNumber"], frame=pr["frameNumber"],
                        dir=pr["flightDirection"], bytes=sum(v["bytes"] for v in pr["bytes"].values())))
    return sorted(out, key=lambda r: r["name"])


def signed_url(url, token):
    """ASF adresinden S3 imzalı adrese kadar yönlendirmeleri elle izler; token yalnızca ASF alan adına gider."""
    host0 = urllib.parse.urlparse(url).hostname
    for _ in range(6):
        h = {"Authorization": f"Bearer {token}"} if urllib.parse.urlparse(url).hostname == host0 else {}
        r = requests.get(url, headers=h, allow_redirects=False, stream=True, timeout=60)
        r.close()
        if r.status_code in (301, 302, 303, 307, 308):
            url = urllib.parse.urljoin(url, r.headers["Location"])
            continue
        if r.status_code == 200:
            return url
        raise SystemExit(f"Erişim reddedildi: HTTP {r.status_code}. Token geçerli mi, ASF uygulaması Earthdata profilinde onaylı mı?")
    raise SystemExit("Çok fazla yönlendirme.")


def latlon_to_utm(lat, lon, zone):
    """WGS84 -> UTM (kuzey yarımküre), pyproj'suz standart formül; metre altı doğruluk yeter."""
    a, f = 6378137.0, 1 / 298.257223563
    e2 = f * (2 - f); ep2 = e2 / (1 - e2); k0 = 0.9996
    lon0 = math.radians((zone - 1) * 6 - 180 + 3)
    phi, lam = math.radians(lat), math.radians(lon)
    N = a / math.sqrt(1 - e2 * math.sin(phi) ** 2)
    T, C = math.tan(phi) ** 2, ep2 * math.cos(phi) ** 2
    A = math.cos(phi) * (lam - lon0)
    M = a * ((1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * math.sin(2 * phi)
             + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * math.sin(4 * phi) - (35 * e2**3 / 3072) * math.sin(6 * phi))
    x = k0 * N * (A + (1 - T + C) * A**3 / 6 + (5 - 18 * T + T**2 + 72 * C - 58 * ep2) * A**5 / 120) + 500000
    y = k0 * (M + N * math.tan(phi) * (A**2 / 2 + (5 - T + 9 * C + 4 * C**2) * A**4 / 24 + (61 - 58 * T + T**2 + 600 * C - 330 * ep2) * A**6 / 720))
    return x, y


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", type=int, default=113)
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    files = search(args.track)
    print(f"ASF: track {args.track} için {len(files)} provisional GUNW")
    if not files:
        sys.exit(1)
    g = files[-1]
    print("Test dosyası:", g["name"], f"({g['bytes']/1e9:.2f} GB, indirilmeyecek)")

    token = os.environ.get("EARTHDATA_TOKEN")
    if not token and sys.platform == "win32":
        # Uygulama yeniden başlatılmadıysa değişken bu süreçte yoktur; kullanıcı kaydından oku
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as k:
                token = winreg.QueryValueEx(k, "EARTHDATA_TOKEN")[0]
        except OSError:
            token = None
    if not token:
        sys.exit("EARTHDATA_TOKEN yok. Arama çalıştı; dosyayı açmak için token gerekli.")

    import fsspec, h5py
    url = signed_url(g["url"], token)
    fs = fsspec.filesystem("http")
    t0 = time.time()
    f = fs.open(url, "rb", block_size=4 * 2**20, cache_type="blockcache", size=g["bytes"])
    h = h5py.File(f, "r")

    lines, found = [], {}
    def visit(name, obj):
        if isinstance(obj, h5py.Dataset):
            lines.append(f"{name}  shape={obj.shape} dtype={obj.dtype} chunks={obj.chunks} comp={obj.compression}")
            leaf = name.rsplit("/", 1)[-1]
            if leaf not in found or "/HH/" in name and "unwrapped" in name:
                found.setdefault(leaf, name)
    h.visititems(visit)
    (OUT / "layers.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"{len(lines)} katman listelendi -> out/probe/layers.txt")

    def pick(leaf, must=""):
        c = [l.split("  ")[0] for l in lines if l.split("  ")[0].endswith("/" + leaf) and must in l]
        return c[0] if c else None

    p_unw = pick("unwrappedPhase", "frequencyA")
    p_coh = pick("coherenceMagnitude", "unwrappedInterferogram") or pick("coherenceMagnitude")
    p_cc = pick("connectedComponents")
    p_iono = pick("ionospherePhaseScreen")
    p_wrap = pick("wrappedInterferogram")
    grp = p_unw.rsplit("/", 2)[0]  # .../unwrappedInterferogram
    x = h[grp + "/xCoordinates"][:]
    y = h[grp + "/yCoordinates"][:]
    proj = h[grp + "/projection"]
    epsg = int(proj[()]) if proj.shape == () else int(proj.attrs.get("epsg_code", 0))
    zone = epsg - 32600
    print("Katmanlar:", dict(unw=p_unw, coh=p_coh, cc=p_cc, iono=p_iono, wrap=p_wrap), "EPSG", epsg)

    xs, ys = zip(*[latlon_to_utm(la, lo, zone) for la in (CDMX["south"], CDMX["north"]) for lo in (CDMX["west"], CDMX["east"])])
    ix = np.where((x >= min(xs)) & (x <= max(xs)))[0]
    iy = np.where((y >= min(ys)) & (y <= max(ys)))[0]
    if not len(ix) or not len(iy):
        sys.exit("Mexico City kutusu bu çerçevenin dışında.")
    sl = (slice(iy.min(), iy.max() + 1), slice(ix.min(), ix.max() + 1))

    unw = h[p_unw][sl].astype("float32")
    coh = h[p_coh][sl].astype("float32") if p_coh else None
    cc = h[p_cc][sl] if p_cc else None
    iono = None
    if p_iono:
        ig = p_iono.rsplit("/", 1)[0]
        ix2 = h[ig + "/xCoordinates"][:] if ig + "/xCoordinates" in h else None
        if ix2 is not None and len(ix2) == len(x):
            iono = h[p_iono][sl].astype("float32")
    dt = time.time() - t0
    print(f"Kesit {unw.shape} okundu, {dt:.0f} sn")

    phase = unw - (iono if iono is not None else 0)
    valid = np.isfinite(phase) & (phase != 0)
    if cc is not None:
        valid &= cc > 0
    disp_cm = -phase * LAMBDA_L_CM / (4 * np.pi)  # işaret kuralı kılavuzdan doğrulanmalı
    disp_cm -= np.nanmedian(disp_cm[valid])

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    for name, arr, cmap, rng in [
        ("unwrapped_cm", np.where(valid, disp_cm, np.nan), "RdBu", 4),
        ("wrapped", np.where(valid, np.angle(np.exp(1j * phase)), np.nan), "hsv", None),
        ("coherence", coh, "gray", None),
    ]:
        if arr is None:
            continue
        plt.figure(figsize=(6, 6))
        kw = dict(vmin=-rng, vmax=rng) if rng else {}
        plt.imshow(arr, cmap=cmap, **kw)
        plt.colorbar(shrink=0.7)
        plt.title(f"{name}  {g['name'][36:70]}", fontsize=7)
        plt.savefig(OUT / f"{name}.png", dpi=110, bbox_inches="tight")
        plt.close()

    summary = dict(file=g["name"], layers=dict(unw=p_unw, coh=p_coh, cc=p_cc, iono=p_iono), epsg=epsg, crop=list(unw.shape),
                   seconds=round(dt), valid_frac=float(valid.mean()), coh_median=float(np.nanmedian(coh)) if coh is not None else None,
                   disp_cm_p2_p98=[float(np.nanpercentile(disp_cm[valid], q)) for q in (2, 98)], iono_applied=iono is not None,
                   attrs={k: str(v) for k, v in h[p_unw].attrs.items()})
    (OUT / "summary.json").write_text(json.dumps(summary, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
