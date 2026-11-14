"""L-band (NISAR) / C-band (Sentinel-1) tutarlılık: ORMAN dahil, göreli karşılaştırma.

Neden göreli? İki ürün farklı işleniyor (Sentinel-1 HyP3: 20x4 bakış + adf süzgeci; NISAR GUNW: süzgeçsiz).
Süzgeç tutarlılığı her yerde yükseltir. Bu yüzden her uydunun bir arazi türündeki değeri, AYNI uydunun
aynı çiftteki şehir değerine bölünür: "bu arazi türü, şehre göre ne kadar sinyal kaybediyor?"

Arazi türleri NISAR'ın kendi GCOV görüntüsünden (13 Eki 2026) piksel piksel seçilir:
  orman = HV parlak (> -10.5 dB) + HH/HV oranı düşük (< 5.6 dB, bina değil) + HH < -2.8 dB + güney/batı dağları
Girdi:  out/c_band/corr/*_corr.tif (Sentinel-1, HyP3), out/cache/<track>/*.npz (NISAR), out/gcov_cdmx.npz
Çıktı:  out/l_vs_c_forest.json, out/l_vs_c_forest.png
"""
import glob, json, sys
from datetime import date
from pathlib import Path

import numpy as np
import tifffile

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from geo_util import to_latlon  # noqa: E402

OUT = HERE / "out"
PAIRS = {  # Sentinel-1 çifti -> NISAR track
    "desc-dry-0422-0504": ("113", "20260422"), "desc-rain-0609-0621": ("113", "20260609"),
    "desc-rain-0901-0913": ("113", "20260901"), "asc-dry-0216-0228": ("19", "20260216"),
    "asc-rain-0523-0604": ("19", "20260523"),
}
BOXES = {  # Yağız'ın WorldCover ile doğrulanmış kutuları (15x15 px)
    "sehir_zocalo": (19.433, -99.133), "chalco_tarla": (19.2453, -98.9363), "tlahuac_sulak": (19.2682, -99.0392),
}


def d8(s):
    return date(int(s[:4]), int(s[4:6]), int(s[6:]))


def latlon_grid(x, y, step=20):
    """NISAR ızgarasının her pikselinin enlem-boylamı (kaba ızgarada kesin, arada bilineer)."""
    ix = np.unique(np.r_[np.arange(0, len(x), step), len(x) - 1]); iy = np.unique(np.r_[np.arange(0, len(y), step), len(y) - 1])
    LA = np.zeros((len(iy), len(ix))); LO = np.zeros_like(LA)
    for a, j in enumerate(iy):
        for b, i in enumerate(ix):
            LA[a, b], LO[a, b] = to_latlon(x[i], y[j])
    def interp(G):
        rows = np.array([np.interp(np.arange(len(x)), ix, r) for r in G])
        return np.array([np.interp(np.arange(len(y)), iy, rows[:, k]) for k in range(len(x))]).T
    return interp(LA), interp(LO)


def read_s1(path):
    t = tifffile.TiffFile(path); p = t.pages[0]
    sx, sy, _ = p.tags[33550].value; _, _, _, X0, Y0, _ = p.tags[33922].value
    return p.asarray().astype("float32"), X0, Y0, sx, sy


def sample_s1(arr, X0, Y0, sx, sy, x, y):
    cols = np.floor((x - X0) / sx).astype(int); rows = np.floor((Y0 - y) / sy).astype(int)
    ok_c = (cols >= 0) & (cols < arr.shape[1]); ok_r = (rows >= 0) & (rows < arr.shape[0])
    out = np.full((len(y), len(x)), np.nan, "float32")
    sub = arr[np.ix_(rows[ok_r], cols[ok_c])]
    sub = np.where(sub <= 0, np.nan, sub)  # 0 = kapsam dışı
    out[np.ix_(np.where(ok_r)[0], np.where(ok_c)[0])] = sub
    return out


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ref = np.load(sorted(glob.glob(str(OUT / "cache/113/*.npz")))[0])
    x, y = ref["x"], ref["y"]
    LA, LO = latlon_grid(x, y)

    g = np.load(OUT / "gcov_cdmx.npz")
    gi = np.clip(np.round((g["lat"][0] - LA) / (g["lat"][0] - g["lat"][1])).astype(int), 0, len(g["lat"]) - 1)
    gj = np.clip(np.round((LO - g["lon"][0]) / (g["lon"][1] - g["lon"][0])).astype(int), 0, len(g["lon"]) - 1)
    HH, HV = g["hh_db"][gi, gj], g["hv_db"][gi, gj]
    mountains = (LA < 19.22) | ((LA < 19.40) & (LO < -99.20))
    forest = mountains & (HV > -10.5) & ((HH - HV) < 5.6) & (HH < -2.8)

    masks = {"orman": forest}
    for k, (la, lo) in BOXES.items():
        d = (LA - la) ** 2 + (LO - lo) ** 2
        r, c = np.unravel_index(np.argmin(d), d.shape)
        m = np.zeros_like(forest); m[max(0, r - 7):r + 8, max(0, c - 7):c + 8] = True
        masks[k] = m

    res, figs = [], []
    for name, (tr, s1start) in PAIRS.items():
        files = sorted(glob.glob(str(OUT / f"cache/{tr}/*.npz")))
        best = min(files, key=lambda f: abs((d8(Path(f).stem[:8]) - d8(s1start)).days))
        n = np.load(best)
        assert np.allclose(n["x"], x) and np.allclose(n["y"], y) or tr != "113"
        nx, ny = n["x"], n["y"]
        # NISAR coh'u ortak (113) ızgaraya taşı: en yakın komşu
        jx = np.clip(np.searchsorted(nx, x), 0, len(nx) - 1)
        jy = np.clip(len(ny) - 1 - np.searchsorted(ny[::-1], y), 0, len(ny) - 1)
        L = n["coh"].astype("float32")[np.ix_(jy, jx)]
        C = sample_s1(*read_s1(OUT / f"c_band/corr/{name}_corr.tif"), x, y)
        row = dict(pair=name, nisar=Path(best).stem, classes={})
        city_L = np.nanmedian(L[masks["sehir_zocalo"]]); city_C = np.nanmedian(C[masks["sehir_zocalo"]])
        for k, m in masks.items():
            both = m & np.isfinite(L) & np.isfinite(C)
            if both.sum() < 30:
                row["classes"][k] = None; continue
            l, c = float(np.median(L[both])), float(np.median(C[both]))
            row["classes"][k] = dict(n=int(both.sum()), nisar=round(l, 3), s1=round(c, 3),
                                     nisar_rel=round(float(l / city_L), 2) if np.isfinite(city_L) else None,
                                     s1_rel=round(float(c / city_C), 2) if np.isfinite(city_C) else None,
                                     nisar_good=round(float((L[both] > 0.4).mean()), 2), s1_good=round(float((C[both] > 0.4).mean()), 2))
        res.append(row); figs.append((name, L, C))
        f = row["classes"]["orman"]
        print(name, "NISAR", row["nisar"], "| orman:", f)

    (OUT / "l_vs_c_forest.json").write_text(json.dumps(dict(forest_pixels=int(forest.sum()), pairs=res), indent=1, ensure_ascii=False), encoding="utf-8")

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(len(figs), 3, figsize=(13, 4.2 * len(figs)))
    for i, (name, L, C) in enumerate(figs):
        for j, (A, t) in enumerate([(L, f"NISAR L-band  {name}"), (C, "Sentinel-1 C-band"), (forest.astype(float), "Orman maskesi (GCOV'dan)")]):
            ax[i, j].imshow(A, cmap="gray" if j < 2 else "Greens", vmin=0, vmax=1); ax[i, j].set_title(t, fontsize=9); ax[i, j].axis("off")
    plt.tight_layout(); plt.savefig(OUT / "l_vs_c_forest.png", dpi=80); plt.close()
    print("orman pikseli:", int(forest.sum()))


if __name__ == "__main__":
    main()
