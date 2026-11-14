"""Halka sayısı simülasyonu: AYNI gerçek NISAR hareketi C-band (Sentinel-1) dalga boyuyla sarılsaydı nasıl görünürdü?

Bu bir SİMÜLASYONDUR: Sentinel-1 verisi değil, NISAR'ın ölçtüğü birikmiş LOS hareketinin C-band'in
yarım dalga boyuyla (5,5465 / 2 = 2,77 cm) yeniden sarılmasıdır. Amaç: aynı çökmenin L-band'de kaç halka,
C-band'de kaç halka ürettiğini göstermek. Halka sıklaştıkça faz çözme (halkaları sayma) hatası riski artar.

Girdi:  out/grid.npz (export_web.py --grid ile), backend/stops_web.json
Çıktı:  web/public/data/cdmx/cwrap_<tarih>.png, lwrap_<tarih>.png (ikisi de ~400 m yumuşatılmış) ve  web/public/data/cdmx/fringes.json
"""
import json, sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from export_web import HALF_WAVE_CM, ramp, write_png  # noqa: E402

C_LAMBDA_CM = 5.5465  # Sentinel-1 C-band
C_HALF = C_LAMBDA_CM / 2


def smooth(a, r=2):
    """NaN'e duyarlı (2r+1)^2 kutu ortalaması (~400 m). Piksel gürültüsü C-band'e çevrilince 4 kat büyük
    görünmesin diye; atmosfer gibi geniş ölçekli etkiler ve çökme deseni korunur. Adil olsun diye
    simülasyon görselinde L ve C aynı yumuşatılmış hareketi kullanır."""
    v = np.nan_to_num(a); w = np.isfinite(a).astype("float32")
    def box(z):
        z = np.pad(z, r, mode="edge"); c = z.cumsum(0).cumsum(1); c = np.pad(c, ((1, 0), (1, 0)))
        n = 2 * r + 1
        return c[n:, n:] - c[:-n, n:] - c[n:, :-n] + c[:-n, :-n]
    out = box(v) / np.maximum(box(w), 1e-6)
    return np.where(np.isfinite(a), out, np.nan)


def wrap(los_cm, half, stops):
    t = np.mod(np.nan_to_num(los_cm) / half, 1.0)
    pal = np.vstack([[[0, 0, 0]], ramp(stops["wrap"], (np.arange(255) + 0.5) / 255)])
    idx = 1 + np.minimum((t * 255).astype(int), 254)
    return np.where(np.isfinite(los_cm), idx, 0).astype(np.uint8), pal


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    g = np.load(HERE / "out" / "grid.npz")
    stops = json.loads((HERE / "stops_web.json").read_text(encoding="utf-8"))
    L = g["los_master_cm"].astype("float32")  # (tarih, lat, lon), track 19 birikmiş LOS
    d = HERE.parent / "web" / "public" / "data" / "cdmx"
    per_date = []
    for k, s in enumerate(g["dates"]):
        s = str(s); iso = f"{s[:4]}-{s[4:6]}-{s[6:]}"
        Ls = smooth(L[k])
        write_png(d / f"cwrap_{iso}.png", *wrap(Ls, C_HALF, stops))
        write_png(d / f"lwrap_{iso}.png", *wrap(Ls, HALF_WAVE_CM, stops))  # aynı yumuşatmayla L-band, adil karşılaştırma için
        # Halka sayısı: sabit kayadan (≈0) en hızlı yere kadar kaç tur var (en hızlı %0,5'lik kısım)
        mx = float(np.nanpercentile(-L[k], 99.5)) if np.isfinite(L[k]).any() else 0.0
        per_date.append(dict(date=iso, max_los_cm=round(mx, 1), rings_l=round(max(mx, 0) / HALF_WAVE_CM, 1), rings_c=round(max(mx, 0) / C_HALF, 1)))
    out = dict(note="SİMÜLASYON: NISAR'ın ölçtüğü hareket C-band dalga boyuyla yeniden sarıldı; Sentinel-1 verisi değildir.",
               l_half_wave_cm=round(HALF_WAVE_CM, 2), c_half_wave_cm=round(C_HALF, 2), track=19, dates=per_date)
    (d / "fringes.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    last = per_date[-1]
    print(f"{len(per_date)} kare. Son tarih {last['date']}: en hızlı yer {last['max_los_cm']} cm LOS -> L-band {last['rings_l']} halka, C-band {last['rings_c']} halka")


if __name__ == "__main__":
    main()
