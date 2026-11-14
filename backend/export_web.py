"""Arayüz verisi üretici: iki track'in önbelleğinden DİKEY birikmiş seriyi çıkarır, EPSG:4326 ızgarasına
örnekler ve README şemasındaki dosyaları yazar.

Girdi  (hepsi backend/out altında, ağ ve token GEREKMEZ):
    cache/113/*.npz, cache/19/*.npz      chain_test.py'nin okuduğu kesitler
    geom_113.npz, geom_19.npz            decompose.py'nin kestiği bakış geometrisi
Çıktı  (--out, varsayılan web/public/data):
    regions.json
    cdmx/points.json
    cdmx/disp_<tarih>.png   o tarihe kadar birikmiş dikey hareket
    cdmx/wrap_<tarih>.png   aynı tarihte sarılı LOS fazı (ana track)
    cdmx/rate.png           dikey hız haritası (cm/yıl), disp ile aynı renk mantığı

Çalıştır:  backend\\.venv\\Scripts\\python backend\\export_web.py --out web\\public\\data
Renk durakları: --stops colormap.json (yoksa bu dosyadaki varsayılanlar). Arayüzdeki DISP_STOPS / WRAP_STOPS
ile AYNI olmalı.

chain_test.py'den iki fark (ikisi de HANDOFF "bilinen sorunlar" maddesinin çözümü):
  1. Bir pikselin bir çiftte verisi yoksa o çift 0 hareket sayılmaz; pikselin kendi ortalama hızıyla
     doldurulur (--fill zero ile eski davranış).
  2. İki track'in tarihleri farklı (6 gün kaymalı). Ana track'in tarihleri kullanılır, diğer track bu
     tarihlere zamanda doğrusal ara değerle taşınır; ilk ortak tarih 0 kabul edilir.
"""
import argparse, glob, json, os, zlib, struct
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
LAMBDA_L_CM = 23.84
HALF_WAVE_CM = LAMBDA_L_CM / 2
BOX = dict(south=19.15, north=19.60, west=-99.30, east=-98.85)
REF = (19.36, -99.26)  # Santa Fe
ZONE = 14
TRACKS = (113, 19)  # (descending, ascending)

DEFAULT_STOPS = {
    # t: 0..1 konum, renk [R,G,B]. disp: en negatif -> 0 cm (beyaz) -> en pozitif.
    "disp_neg": [[0.0, [84, 0, 46]], [0.25, [165, 15, 21]], [0.5, [239, 101, 72]], [0.75, [253, 187, 132]], [1.0, [255, 255, 255]]],
    "disp_pos": [[0.0, [255, 255, 255]], [1.0, [49, 130, 189]]],
    "wrap": [[0.0, [255, 0, 0]], [1 / 6, [255, 255, 0]], [2 / 6, [0, 255, 0]], [3 / 6, [0, 255, 255]],
             [4 / 6, [0, 0, 255]], [5 / 6, [255, 0, 255]], [1.0, [255, 0, 0]]],
}


# ---------- yardımcılar ----------
def latlon_to_utm(lat, lon, zone=ZONE):
    """WGS84 -> UTM kuzey; numpy dizileriyle çalışır (probe_gunw.py ile aynı formül)."""
    lat, lon = np.asarray(lat, float), np.asarray(lon, float)
    a, f = 6378137.0, 1 / 298.257223563
    e2 = f * (2 - f); ep2 = e2 / (1 - e2); k0 = 0.9996
    lon0 = np.radians((zone - 1) * 6 - 180 + 3)
    phi, lam = np.radians(lat), np.radians(lon)
    N = a / np.sqrt(1 - e2 * np.sin(phi) ** 2)
    T, C = np.tan(phi) ** 2, ep2 * np.cos(phi) ** 2
    A = np.cos(phi) * (lam - lon0)
    M = a * ((1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * np.sin(2 * phi)
             + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * np.sin(4 * phi) - (35 * e2**3 / 3072) * np.sin(6 * phi))
    x = k0 * N * (A + (1 - T + C) * A**3 / 6 + (5 - 18 * T + T**2 + 72 * C - 58 * ep2) * A**5 / 120) + 500000
    y = k0 * (M + N * np.tan(phi) * (A**2 / 2 + (5 - T + 9 * C + 4 * C**2) * A**4 / 24 + (61 - 58 * T + T**2 + 600 * C - 330 * ep2) * A**6 / 720))
    return x, y


def d64(s):
    return np.datetime64(f"{s[:4]}-{s[4:6]}-{s[6:]}")


def iso(s):
    return f"{s[:4]}-{s[4:6]}-{s[6:]}"


def bilinear_axes(arr, ax, ay, bx, by):
    """Kaba düzenli ızgaradaki (ay, ax) alanı (by, bx) eksenlerine bilineer taşır (geometri için)."""
    if ax[0] > ax[-1]:
        ax, arr = ax[::-1], arr[:, ::-1]
    if ay[0] > ay[-1]:
        ay, arr = ay[::-1], arr[::-1]
    rows = np.array([np.interp(bx, ax, r) for r in arr])
    return np.array([np.interp(by, ay, rows[:, j]) for j in range(rows.shape[1])]).T


class Sampler:
    """UTM ızgarasından (y azalan, x artan, düzenli) enlem-boylam ızgarasına NaN'e duyarlı bilineer örnekleme."""

    def __init__(self, x, y, lat, lon):
        LON, LAT = np.meshgrid(lon, lat)
        ux, uy = latlon_to_utm(LAT, LON)
        fx = (ux - x[0]) / (x[1] - x[0])
        fy = (uy - y[0]) / (y[1] - y[0])
        self.inside = (fx >= 0) & (fx <= len(x) - 1) & (fy >= 0) & (fy <= len(y) - 1)
        fx = np.clip(fx, 0, len(x) - 1.001); fy = np.clip(fy, 0, len(y) - 1.001)
        self.x0 = fx.astype(int); self.y0 = fy.astype(int)
        self.wx = fx - self.x0; self.wy = fy - self.y0

    def __call__(self, a, min_weight=0.5):
        x0, y0, wx, wy = self.x0, self.y0, self.wx, self.wy
        num = np.zeros(x0.shape); den = np.zeros(x0.shape)
        for dy, dx, w in ((0, 0, (1 - wy) * (1 - wx)), (0, 1, (1 - wy) * wx), (1, 0, wy * (1 - wx)), (1, 1, wy * wx)):
            v = a[y0 + dy, x0 + dx]
            ok = np.isfinite(v)
            num += np.where(ok, v, 0) * w
            den += ok * w
        out = np.where(den >= min_weight, num / np.maximum(den, 1e-9), np.nan)
        out[~self.inside] = np.nan
        return out


def write_png(path, idx, palette):
    """Bağımlılıksız paletli PNG yazıcı (Pillow gerekmez). idx: (h, w) uint8; 0 = saydam; palette: (256, 3) uint8.
    Paletli PNG, RGBA'ya göre ~4 kat küçük; renkler aynı."""
    h, w = idx.shape
    raw = np.concatenate([np.zeros((h, 1), np.uint8), idx.astype(np.uint8)], axis=1).tobytes()

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    Path(path).write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 3, 0, 0, 0))
                           + chunk(b"PLTE", np.asarray(palette, np.uint8).tobytes()) + chunk(b"tRNS", b"\x00")
                           + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def ramp(stops, t):
    """stops: [[konum, [r,g,b]], ...]; t: 0..1 dizi -> (..., 3) uint8. Doğrusal ara değer."""
    pos = np.array([s[0] for s in stops], float)
    col = np.array([s[1] for s in stops], float)
    t = np.clip(t, 0, 1)
    return np.stack([np.interp(t, pos, col[:, k]) for k in range(3)], axis=-1).round().astype(np.uint8)


def disp_rgb(cm, rng, stops):
    """Hareket (cm) -> renk. rng = [min, max]; 0 cm beyaz durak; aralık dışı kırpılır.
    Artı taraf eksi tarafla AYNI cm ölçeğini kullanır (cm başına aynı renk adımı): +3 cm'lik atmosfer gürültüsü
    -30 cm'lik çökmenin yanında soluk kalır, yükselme gibi görünmez."""
    lo, hi = rng
    cm = np.clip(np.asarray(cm, float), lo, hi)
    return np.where((cm < 0)[..., None], ramp(stops["disp_neg"], 1 - cm / lo), ramp(stops["disp_pos"], cm / -lo))


def hexc(c):
    return "#%02x%02x%02x" % tuple(int(v) for v in c)


def legend(rng, stops):
    """Arayüz lejantı için durakları fiziksel birimde verir: [[cm, '#hex'], ...] ve sarılı faz [[tur 0..1, '#hex'], ...]."""
    lo, hi = rng
    cms = sorted({round(lo * (1 - t), 2) for t, _ in stops["disp_neg"]} | {0.0, float(hi)})
    return dict(disp_stops_cm=[[c, hexc(disp_rgb(np.array([c]), rng, stops)[0])] for c in cms],
                wrap_stops=[[round(t, 4), hexc(c)] for t, c in stops["wrap"]])


def color_disp(cm, rng, stops):
    """Birikmiş hareket -> (indeks, palet). 255 renk kademesi (35+5 cm aralıkta ~0,16 cm); NaN -> indeks 0 (saydam)."""
    lo, hi = rng
    levels = lo + np.arange(255) / 254 * (hi - lo)
    levels[np.abs(levels).argmin()] = 0.0  # 0 cm tam beyaz durağa otursun
    pal = np.vstack([[[0, 0, 0]], disp_rgb(levels, rng, stops)])
    idx = 1 + np.abs(np.clip(np.nan_to_num(cm), lo, hi)[..., None] - levels).argmin(-1)
    return np.where(np.isfinite(cm), idx, 0).astype(np.uint8), pal


def color_wrap(los_cm, stops):
    """LOS hareketi -> sarılı faz (indeks, palet). Bir tur = lambda/2 = 11,92 cm."""
    t = np.mod(np.nan_to_num(los_cm) / HALF_WAVE_CM, 1.0)
    pal = np.vstack([[[0, 0, 0]], ramp(stops["wrap"], (np.arange(255) + 0.5) / 255)])
    idx = 1 + np.minimum((t * 255).astype(int), 254)
    return np.where(np.isfinite(los_cm), idx, 0).astype(np.uint8), pal


# ---------- zincir ----------
def build_stack(out, track, fill="rate", max_missing=0.3):
    """Önbellekteki çiftlerden birikmiş LOS serisi. Dönüş: dates (YYYYMMDD), S (tarih, y, x) cm, rate cm/yıl, x, y."""
    files = sorted(glob.glob(str(out / "cache" / str(track) / "*.npz")))
    pairs = [tuple(Path(f).stem.split("_")) for f in files]
    for p, q in zip(pairs, pairs[1:]):
        if p[1] != q[0]:
            raise SystemExit(f"Track {track}: zincirde kopukluk {p} -> {q}")
    inc, days = [], []
    for f, (r, s) in zip(files, pairs):
        d = np.load(f)
        ph = d["unw"].astype("float64") - d["iono"]
        bad = ~np.isfinite(ph) | (d["cc"] == 0)
        cm = -ph * LAMBDA_L_CM / (4 * np.pi)
        jx = np.abs(d["x"] - d["ref_xy"][0]).argmin(); jy = np.abs(d["y"] - d["ref_xy"][1]).argmin()
        cm = cm - np.nanmedian(cm[max(0, jy - 15):jy + 16, max(0, jx - 15):jx + 16])
        cm[bad] = np.nan
        inc.append(cm); days.append(float((d64(s) - d64(r)).astype(int)))
    x, y = d["x"], d["y"]
    inc = np.stack(inc); days = np.array(days)
    miss = np.isnan(inc)
    nbad = miss.sum(0)
    if fill == "rate":
        vdays = (~miss * days[:, None, None]).sum(0)
        per_day = np.nansum(inc, 0) / np.maximum(vdays, 1)
        inc = np.where(miss, per_day[None] * days[:, None, None], inc)
    else:
        inc = np.nan_to_num(inc)
    S = np.concatenate([np.zeros((1,) + inc.shape[1:]), np.cumsum(inc, 0)])
    drop = nbad > len(pairs) * max_missing
    S[:, drop] = np.nan
    dates = [pairs[0][0]] + [p[1] for p in pairs]
    t = np.array([(d64(s) - d64(dates[0])).astype(int) for s in dates], float)
    tc = t - t.mean()
    rate = np.tensordot(tc, S - S.mean(0), axes=1) / (tc @ tc) * 365
    return dict(dates=dates, t=t, S=S, rate=rate, x=x, y=y, nbad=nbad, n=len(pairs))


def los_vectors(out, track, bx, by):
    g = np.load(out / f"geom_{track}.npz")
    e = bilinear_axes(g["e"], g["x"], g["y"], bx, by)
    n = bilinear_axes(g["n"], g["x"], g["y"], bx, by)
    return e, np.sqrt(np.clip(1 - e**2 - n**2, 0, 1))


def decompose(d1, d2, e1, u1, e2, u2):
    """İki LOS -> (dikey, doğu). Kuzey hareketi 0 kabul edilir."""
    det = e1 * u2 - e2 * u1
    vE = (d1 * u2 - d2 * u1) / det
    vU = (e1 * d2 - e2 * d1) / det
    bad = ~(np.isfinite(d1) & np.isfinite(d2) & (np.abs(det) > 0.2))
    return np.where(bad, np.nan, vU), np.where(bad, np.nan, vE)


def interp_time(S, t_src, t_dst):
    """(tarih, y, x) serisini hedef günlere zamanda doğrusal ara değerle taşır."""
    out = np.empty((len(t_dst),) + S.shape[1:], S.dtype)
    for k, t in enumerate(t_dst):
        j = int(np.clip(np.searchsorted(t_src, t, "right") - 1, 0, len(t_src) - 2))
        w = (t - t_src[j]) / (t_src[j + 1] - t_src[j])
        out[k] = (1 - w) * S[j] + w * S[j + 1]
    return out


def compute(out, master=19, fill="rate"):
    A = {t: build_stack(out, t, fill) for t in TRACKS}
    bx, by = A[113]["x"], A[113]["y"]
    assert np.array_equal(bx, A[19]["x"]) and np.array_equal(by, A[19]["y"]), "iki track aynı ızgarada olmalı"
    L = {t: los_vectors(out, t, bx, by) for t in TRACKS}
    (e1, u1), (e2, u2) = L[113], L[19]
    vU, vE = decompose(A[113]["rate"], A[19]["rate"], e1, u1, e2, u2)

    other = 113 if master == 19 else 19
    t0 = max(d64(A[113]["dates"][0]), d64(A[19]["dates"][0])); t1 = min(d64(A[113]["dates"][-1]), d64(A[19]["dates"][-1]))
    dates = [s for s in A[master]["dates"] if t0 <= d64(s) <= t1]
    td = np.array([(d64(s) - d64(dates[0])).astype(int) for s in dates], float)
    Sm = interp_time(A[master]["S"], A[master]["t"] - (d64(dates[0]) - d64(A[master]["dates"][0])).astype(int), td)
    So = interp_time(A[other]["S"], A[other]["t"] - (d64(dates[0]) - d64(A[other]["dates"][0])).astype(int), td)
    Sm = Sm - Sm[0]; So = So - So[0]
    S113, S19 = (So, Sm) if master == 19 else (Sm, So)
    U = np.stack([decompose(a, b, e1, u1, e2, u2)[0] for a, b in zip(S113, S19)])
    return dict(A=A, bx=bx, by=by, vU=vU, vE=vE, dates=dates, td=td, U=U, Smaster=Sm, master=master, other=other,
                u_mean={113: float(np.nanmean(u1)), 19: float(np.nanmean(u2))})


def main():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend-out", default=str(HERE / "out"))
    ap.add_argument("--out", default=str(HERE.parent / "web" / "public" / "data"))
    ap.add_argument("--points", default=str(HERE / "points_cdmx.json"), help="nokta tanımları (id, ad, not, lat, lon)")
    ap.add_argument("--stops", default=None, help="renk durakları JSON (arayüzle aynı olmalı)")
    ap.add_argument("--master", type=int, default=19, choices=TRACKS, help="tarihleri kullanılan track")
    ap.add_argument("--fill", default="rate", choices=["rate", "zero"])
    ap.add_argument("--range", type=float, nargs=2, default=[-35.0, 5.0], metavar=("MIN", "MAX"), help="disp_range_cm")
    ap.add_argument("--grid", default=None, help="isteğe bağlı: sayısal enlem-boylam ızgarasını bu .npz dosyasına da yaz")
    ap.add_argument("--step", type=float, default=0.00075, help="ızgara adımı (derece); 0.00075 ~ 80 m")
    a = ap.parse_args()
    bo, outdir = Path(a.backend_out), Path(a.out)
    stops = json.loads(Path(a.stops).read_text(encoding="utf-8")) if a.stops else DEFAULT_STOPS
    R = compute(bo, a.master, a.fill)

    nlat = int(round((BOX["north"] - BOX["south"]) / a.step)); nlon = int(round((BOX["east"] - BOX["west"]) / a.step))
    lat = BOX["north"] - (np.arange(nlat) + 0.5) * (BOX["north"] - BOX["south"]) / nlat  # kuzey yukarı, piksel merkezleri
    lon = BOX["west"] + (np.arange(nlon) + 0.5) * (BOX["east"] - BOX["west"]) / nlon
    samp = Sampler(R["bx"], R["by"], lat, lon)

    d = outdir / "cdmx"
    d.mkdir(parents=True, exist_ok=True)
    for old in list(d.glob("disp_*.png")) + list(d.glob("wrap_*.png")):
        os.remove(old)
    Ugrid = np.stack([samp(u) for u in R["U"]]).astype("float32")
    Lgrid = np.stack([samp(s) for s in R["Smaster"]]).astype("float32")
    rate_grid = samp(R["vU"]).astype("float32")
    for k, s in enumerate(R["dates"]):
        write_png(d / f"disp_{iso(s)}.png", *color_disp(Ugrid[k], a.range, stops))
        write_png(d / f"wrap_{iso(s)}.png", *color_wrap(Lgrid[k], stops))
    write_png(d / "rate.png", *color_disp(rate_grid, [-40.0, 8.0], stops))
    if a.grid:  # sayısal ızgara: siteye konmaz (büyük), kontrol ve başka analizler için
        np.savez_compressed(a.grid, lat=lat, lon=lon, dates=np.array(R["dates"]), disp_cm=Ugrid.astype("float16"),
                            los_master_cm=Lgrid.astype("float16"), rate_cm_yr=rate_grid, east_rate_cm_yr=samp(R["vE"]).astype("float32"))

    # noktalar: 7x7 piksel (560 m) medyan, UTM ızgarasında
    pts = json.loads(Path(a.points).read_text(encoding="utf-8"))["points"]
    out_pts = []
    for p in pts:
        ux, uy = latlon_to_utm(p["lat"], p["lon"])
        jx, jy = int(np.abs(R["bx"] - ux).argmin()), int(np.abs(R["by"] - uy).argmin())
        win = (slice(max(0, jy - 3), jy + 4), slice(max(0, jx - 3), jx + 4))
        ser = [float(np.nanmedian(u[win])) if np.isfinite(u[win]).any() else None for u in R["U"]]
        rate = float(np.nanmedian(R["vU"][win])) if np.isfinite(R["vU"][win]).any() else None
        q = dict(p)
        q["rate_cm_yr"] = None if rate is None else round(rate, 1)
        q.setdefault("s1_rate_cm_yr", None)
        q["series"] = [dict(date=iso(s), disp_cm=None if v is None else round(v, 2)) for s, v in zip(R["dates"], ser)]
        q["los_rate_cm_yr"] = {str(t): (round(float(np.nanmedian(R["A"][t]["rate"][win])), 1) if np.isfinite(R["A"][t]["rate"][win]).any() else None) for t in TRACKS}
        q["east_rate_cm_yr"] = None if rate is None else round(float(np.nanmedian(R["vE"][win])), 1)
        out_pts.append(q)
    (d / "points.json").write_text(json.dumps(dict(points=out_pts), ensure_ascii=False, indent=1), encoding="utf-8")

    dd = [d64(s) for s in R["dates"]]
    steps = [(int((q - p).astype(int)), p, q) for p, q in zip(dd, dd[1:])]
    gaps = [[str(p), str(q)] for n, p, q in steps if n > 12]
    longest = max(steps, key=lambda s: s[0])
    region = dict(
        id="cdmx", name=dict(tr="Mexico City", en="Mexico City"), center=[19.38, -99.08], zoom=11,
        bounds=[[BOX["south"], BOX["west"]], [BOX["north"], BOX["east"]]],
        source=dict(status="verified", sensor="NISAR L-band HH", product="L2 GUNW", maturity="provisional",
                    track=f"{R['master']} (asc) + 113 (desc)" if R["master"] == 19 else f"113 (desc) + 19 (asc)",
                    note=dict(tr="Dikey hareket iki bakış yönünün birleşimi; kuzey-güney hareket 0 kabul edildi. Troposfer düzeltmesi yok.",
                              en="Vertical motion from two look directions; north-south motion assumed 0. No tropospheric correction.")),
        dates=[iso(s) for s in R["dates"]],
        gap=[str(longest[1]), str(longest[2])] if longest[0] > 12 else None, gaps=gaps,
        disp_range_cm=a.range, half_wave_cm=round(HALF_WAVE_CM, 2), dir="cdmx",
        colors=legend(a.range, stops),
        rate_range_cm_yr=[-40, 8], wrap_track=R["master"],
        stats=dict(days=int(R["td"][-1]), vertical_rate_p1_cm_yr=round(float(np.nanpercentile(R["vU"], 1)), 1),
                   valid_frac=round(float(np.isfinite(R["vU"]).mean()), 3)),
    )
    (outdir / "regions.json").write_text(json.dumps(dict(regions=[region]), ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(R['dates'])} tarih, {iso(R['dates'][0])} -> {iso(R['dates'][-1])} ({int(R['td'][-1])} gün); ızgara {nlat}x{nlon}; boşluklar {gaps}")
    for q in out_pts:
        print(f"  {q['id']:<12} dikey {q['rate_cm_yr']} cm/yıl, son birikmiş {q['series'][-1]['disp_cm']} cm")


if __name__ == "__main__":
    main()
