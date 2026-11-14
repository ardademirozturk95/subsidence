# Mexico City batıyor

NASA Space Apps 2026, **Dancing with the SARs**. NISAR L-band radarıyla Mexico City'de zemin çökmesini
zaman içinde gösteren interaktif harita: birikmiş çökme (cm), radar halkaları (sarılı faz),
ikisini karşılaştıran kaydırıcı, nokta zaman serisi ve HH/HV/RGB polarizasyon arka planı. TR/EN.

> Şu an `web/public/data/` içindeki her şey **örnek veri** (`scripts/mock-data.mjs` üretir).
> Gerçek NISAR çıktısı aynı şemayla konunca arayüz değişmeden çalışır ve üstteki rozet "NISAR verisi" olur.

## Çalıştırma

```bash
cd web
npm install
npm run dev
```

Örnek veriyi yeniden üretmek: `node scripts/mock-data.mjs`

## Veri sözleşmesi (Mert ve Yağız için)

Hepsi `web/public/data/` altına gider.

**`regions.json`**

```json
{ "regions": [{
  "id": "cdmx",
  "name": { "tr": "Mexico City", "en": "Mexico City" },
  "center": [19.38, -99.08], "zoom": 11,
  "bounds": [[19.15, -99.3], [19.6, -98.85]],
  "source": { "status": "verified", "sensor": "NISAR L-band HH", "product": "L2 GUNW + L2 GCOV", "maturity": "provisional", "track": "…" },
  "dates": ["2026-06-17", "2026-06-29", "…"],
  "gap": ["2026-07-27", "2026-08-10"],
  "disp_range_cm": [-15, 3],
  "half_wave_cm": 11.9,
  "dir": "cdmx"
}]}
```

`status` `"mock"` ise rozet "Örnek veri", `"verified"` ise "NISAR verisi" yazar.

**`<dir>/points.json`**

```json
{ "points": [{
  "id": "neza",
  "name": { "tr": "Nezahualcóyotl", "en": "Nezahualcóyotl" },
  "note": { "tr": "…", "en": "…" },
  "lat": 19.4, "lon": -99.015,
  "rate_cm_yr": -34.7,
  "s1_rate_cm_yr": -33.5,
  "series": [{ "date": "2026-06-17", "disp_cm": 0 }, { "date": "2026-06-29", "disp_cm": -1.1 }]
}]}
```

`series` içindeki tarihler `dates` ile birebir aynı olmalı. `disp_cm` ilk tarihe göre birikmiş **dikey** hareket, eksi = çöküyor.

**`<dir>/*.png`** — hepsi `bounds` kutusunu tam kaplayan, kuzey yukarı, EPSG:4326 düz ızgara.

| Dosya | İçerik | Renk |
|---|---|---|
| `disp_<tarih>.png` | O tarihe kadar birikmiş dikey hareket | `DISP_STOPS` (`web/src/lib/data.ts`), 0 cm = beyaz durak; veri yoksa alfa 0 |
| `wrap_<tarih>.png` | Aynı hareketin sarılı fazı (bir tur = λ/2 ≈ 11.9 cm LOS) | `WRAP_STOPS`, döngüsel |
| `hh.png`, `hv.png` | GCOV geri saçılım, dB → gri ton | −30…−2 dB |
| `rgb.png` | R: HH, G: HV, B: HH/HV oranı | |

Python tarafında renklendirme `scripts/mock-data.mjs` içindeki `ramp` ve `dispT` ile aynı mantıkta olmalı.

## Yayına alma

`.github/workflows/deploy.yml`, `main`'e her push'ta `web/`'i derleyip GitHub Pages'e koyar.
Bir kez GitHub'da **Settings > Pages > Source: GitHub Actions** seçilmeli.

## Ekip

Arda (arayüz, sunum), Mert (NISAR GUNW veri hattı), Yağız (GCOV polarizasyon, Konya, bilimsel metin).
