"""GCOV arka planı: bir NISAR L2 GCOV dosyasından Mexico City kesitini İNDİRMEDEN okur ve arayüzün beklediği
hh.png, hv.png, rgb.png dosyalarını yazar (README şeması: kutuyu tam kaplar, kuzey yukarı, EPSG:4326).

Gerekli: EARTHDATA_TOKEN (chain_test.py ile aynı). Dosya ~7 GB ama yalnızca kesit okunur.
Çalıştır:  backend\\.venv\\Scripts\\python backend\\gcov_subset.py --out web\\public\\data
           --track 19|113        hangi geçiş (varsayılan 19)
           --date 20261013       belirli tarih (yoksa en son)
           --list                sadece ASF'deki GCOV dosyalarını listele, okuma yapma
           --local dosya.h5      indirilmiş bir GCOV dosyasından oku (ağ ve token gerekmez)
Çıktı:     <out>/cdmx/hh.png, hv.png, rgb.png  ve  backend/out/gcov_cdmx.npz (dB ızgaraları), gcov_cdmx.json

Katman yolu (ASF NISAR belgeleri): science/LSAR/GCOV/grids/frequencyA/{HHHH, HVHV, xCoordinates, yCoordinates, projection}
Değerler doğrusal güç (gamma0); önce güç olarak ortalanır (benek azaltma), sonra dB'ye çevrilir.

NOT: Bu script gerçek bir GCOV dosyasıyla henüz denenmedi (yazıldığı ortamdan ASF'ye erişim yoktu).
Sentetik bir dosyayla uçtan uca sınandı. Katman adı farklı çıkarsa script gruptaki adları yazdırıp durur.
"""
import argparse, json, re, struct, sys, time, zlib
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from export_web import BOX, Sampler, latlon_to_utm, write_png  # noqa: E402

OUT = Path(__file__).parent / "out"
SEARCH = "https://api.daac.asf.alaska.edu/services/search/param"
GRP = "science/LSAR/GCOV/grids/frequencyA/"
GRAY_DB = (-30.0, -2.0)      # hh.png, hv.png (README)
RGB_DB = dict(r=(-13.0, 6.0), g=(-20.0, -5.0), b=(2.0, 16.0))  # 13 Eki 2026 GCOV'un %2–%98 aralığı  # R: HH, G: HV, B: HH/HV oranı (dB)
TARGET_M = 40.0              # çıktı çözünürlüğü (m); kaynak 10-20 m ise güçte ortalanarak buna indirilir


def search(track=None, point="POINT(-99.07 19.40)"):
    import requests
    p = dict(dataset="NISAR", processingLevel="GCOV", intersectsWith=point, output="geojson", maxResults=2000)
    feats = requests.get(SEARCH, params=p, timeout=120).json()["features"]
    out = []
    for f in feats:
        pr = f["properties"]
        if track and pr.get("pathNumber") != track:
            continue
        m = re.search(r"_(\d{8})T\d{6}_", pr["fileName"])
        b = pr.get("bytes")
        out.append(dict(url=pr["url"], name=pr["fileName"], track=pr.get("pathNumber"), frame=pr.get("frameNumber"),
                        dir=pr.get("flightDirection"), date=m.group(1) if m else "", collection=pr.get("collectionName") or "",
                        bytes=sum(v["bytes"] for v in b.values()) if isinstance(b, dict) else int(b or 0)))
    out = [g for g in out if g["name"].endswith(".h5")] or out
    return sorted(out, key=lambda r: (r["date"], r["name"]))


def write_rgba(path, rgba):
    h, w, _ = rgba.shape
    raw = np.concatenate([np.zeros((h, 1), np.uint8), rgba.reshape(h, w * 4)], axis=1).tobytes()

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    Path(path).write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def multilook(p, n):
    """Güçte n x n ortalama (NaN'leri atlar)."""
    if n <= 1:
        return p
    h, w = (p.shape[0] // n) * n, (p.shape[1] // n) * n
    b = p[:h, :w].reshape(h // n, n, w // n, n)
    with np.errstate(invalid="ignore"):
        return np.nanmean(np.nanmean(b, axis=3), axis=1)


def read_window(h):
    if GRP.rstrip("/") not in h:
        raise SystemExit(f"{GRP} yok. Dosyadaki gruplar: {list(h['science/LSAR'].keys()) if 'science/LSAR' in h else list(h.keys())}")
    g = h[GRP]
    names = list(g.keys())
    if "HHHH" not in names or "HVHV" not in names:
        raise SystemExit(f"HHHH/HVHV bulunamadı. frequencyA içindekiler: {names}")
    x, y = g["xCoordinates"][:], g["yCoordinates"][:]
    proj = g["projection"]
    epsg = int(proj[()]) if proj.shape == () else int(proj.attrs.get("epsg_code", 0))
    zone = epsg - 32600
    if not 1 <= zone <= 60:
        raise SystemExit(f"Beklenmeyen projeksiyon EPSG:{epsg} (UTM kuzey bekleniyordu)")
    cx, cy = zip(*[latlon_to_utm(la, lo, zone) for la in (BOX["south"], BOX["north"]) for lo in (BOX["west"], BOX["east"])])
    pad = 200
    ix = np.where((x >= min(cx) - pad) & (x <= max(cx) + pad))[0]
    iy = np.where((y >= min(cy) - pad) & (y <= max(cy) + pad))[0]
    if not len(ix) or not len(iy):
        raise SystemExit("Mexico City kutusu bu çerçevenin dışında; başka track/çerçeve deneyin (--list).")
    sl = (slice(iy.min(), iy.max() + 1), slice(ix.min(), ix.max() + 1))
    out = {}
    for k in ("HHHH", "HVHV"):
        t0 = time.time()
        a = g[k][sl].astype("float32")
        a[~np.isfinite(a) | (a <= 0)] = np.nan
        out[k] = a
        print(f"  {k}: {a.shape} okundu, {time.time() - t0:.0f} sn, geçerli %{100 * np.isfinite(a).mean():.0f}", flush=True)
    return out, x[sl[1]], y[sl[0]], zone, abs(float(x[1] - x[0]))


def to_byte(db, lo, hi):
    return np.clip((np.nan_to_num(db, nan=lo) - lo) / (hi - lo) * 254, 0, 254).round().astype(np.uint8) + 1  # 1..255; 0 = saydam


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--track", type=int, default=19)
    ap.add_argument("--date", default=None, help="YYYYMMDD; verilmezse en son tarih")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--local", default=None)
    ap.add_argument("--out", default=str(Path(__file__).parent.parent / "web" / "public" / "data"))
    ap.add_argument("--step", type=float, default=0.000375, help="çıktı ızgara adımı (derece); 0.000375 ~ 40 m -> 1200x1200")
    a = ap.parse_args()

    import h5py
    meta = dict(source="local", file=a.local)
    if a.local:
        f = open(a.local, "rb")
    else:
        files = search(a.track)
        cols = sorted({g["collection"] for g in files})
        print(f"ASF: track {a.track} için {len(files)} GCOV; koleksiyonlar: {cols}")
        if a.list or not files:
            for g in files:
                print(f"  {g['date']}  frame {g['frame']}  {g['bytes'] / 1e9:5.2f} GB  {g['collection']}  {g['name']}")
            sys.exit(0 if files else 1)
        prov = [g for g in files if "PROVISIONAL" in g["collection"]]
        cand = prov or files  # GUNW ile aynı olgunluk tercih edilir; yoksa ne varsa
        if a.date:
            cand = [g for g in cand if g["date"] == a.date] or sys.exit(f"{a.date} için GCOV yok; --list ile bakın.")
        g = cand[-1]
        print(f"Seçilen: {g['name']} ({g['bytes'] / 1e9:.2f} GB, indirilmeyecek) [{g['collection']}]")
        from probe_gunw import signed_url
        from chain_test import get_token
        token = get_token()
        if not token:
            sys.exit("EARTHDATA_TOKEN yok.")
        import fsspec, aiohttp, time as _t
        meta = dict(source="ASF", file=g["name"], date=g["date"], track=g["track"], frame=g["frame"], direction=g["dir"], collection=g["collection"])
        # Ağ kopmalarına karşı: her denemede yeni imzalı adres (S3 imzası süreli), en fazla 4 deneme
        for k in range(4):
            try:
                fs = fsspec.filesystem("http", skip_instance_cache=True, client_kwargs={"timeout": aiohttp.ClientTimeout(total=3600, sock_read=600)})
                f = fs.open(signed_url(g["url"], token), "rb", block_size=2 * 2**20, cache_type="blockcache", size=g["bytes"])
                with h5py.File(f, "r") as h:
                    P, x, y, zone, spacing = read_window(h)
                break
            except Exception as e:
                print(f"  tekrar {k + 1}/4 ({type(e).__name__})", flush=True)
                _t.sleep(10 * (k + 1))
        else:
            sys.exit("GCOV okunamadı: ağ zaman aşımı. Daha sonra tekrar çalıştırın.")
        f = None
    if f is not None:
        with h5py.File(f, "r") as h:
            P, x, y, zone, spacing = read_window(h)
    n = max(1, int(round(TARGET_M / spacing)))
    hh, hv = multilook(P["HHHH"], n), multilook(P["HVHV"], n)
    xm = x[: (len(x) // n) * n].reshape(-1, n).mean(1); ym = y[: (len(y) // n) * n].reshape(-1, n).mean(1)
    print(f"Kaynak adım {spacing:.0f} m, {n}x{n} ortalama -> {hh.shape}")

    nlat = int(round((BOX["north"] - BOX["south"]) / a.step)); nlon = int(round((BOX["east"] - BOX["west"]) / a.step))
    lat = BOX["north"] - (np.arange(nlat) + 0.5) * (BOX["north"] - BOX["south"]) / nlat
    lon = BOX["west"] + (np.arange(nlon) + 0.5) * (BOX["east"] - BOX["west"]) / nlon
    samp = Sampler(xm, ym, lat, lon) if zone == 14 else sys.exit("Sampler UTM 14N varsayıyor; export_web.ZONE'u güncelleyin.")
    with np.errstate(divide="ignore", invalid="ignore"):
        hh_db = 10 * np.log10(samp(hh)); hv_db = 10 * np.log10(samp(hv))
    ok = np.isfinite(hh_db) & np.isfinite(hv_db)
    ratio = hh_db - hv_db

    d = Path(a.out) / "cdmx"
    d.mkdir(parents=True, exist_ok=True)
    gray = np.vstack([[[0, 0, 0]], np.repeat(np.linspace(0, 255, 255).round()[:, None], 3, axis=1)]).astype(np.uint8)
    write_png(d / "hh.png", np.where(np.isfinite(hh_db), to_byte(hh_db, *RGB_DB["r"]), 0).astype(np.uint8), gray)
    write_png(d / "hv.png", np.where(np.isfinite(hv_db), to_byte(hv_db, *RGB_DB["g"]), 0).astype(np.uint8), gray)
    ch = [np.clip((np.nan_to_num(v, nan=lo) - lo) / (hi - lo) * 255, 0, 255).round().astype(np.uint8)
          for v, (lo, hi) in ((hh_db, RGB_DB["r"]), (hv_db, RGB_DB["g"]), (ratio, RGB_DB["b"]))]
    write_rgba(d / "rgb.png", np.dstack(ch + [np.where(ok, 255, 0).astype(np.uint8)]))

    OUT.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(OUT / "gcov_cdmx.npz", hh_db=hh_db.astype("float32"), hv_db=hv_db.astype("float32"), lat=lat, lon=lon)
    meta.update(grid=[nlat, nlon], source_spacing_m=spacing, multilook=n, gray_db=GRAY_DB, rgb_db=RGB_DB, valid_frac=float(ok.mean()),
                hh_db_p5_p50_p95=[float(np.nanpercentile(hh_db, q)) for q in (5, 50, 95)],
                hv_db_p5_p50_p95=[float(np.nanpercentile(hv_db, q)) for q in (5, 50, 95)])
    (OUT / "gcov_cdmx.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(meta, indent=1, ensure_ascii=False))
    print(f"Yazıldı: {d / 'hh.png'}, hv.png, rgb.png")


if __name__ == "__main__":
    main()
