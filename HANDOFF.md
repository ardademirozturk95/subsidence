# Subsidence: devir notu (Mert ve Yağız için)

Bu dosya projenin şu ana kadarki bütün durumunu anlatır. Kendi yapay zekânıza bu dosyayı ve
`backend/` klasörünü verirseniz kaldığımız yerden devam edebilir.

Son güncelleme: 14 Kasım 2026.

---

## 1. Proje ne?

NASA Space Apps 2026, **Dancing with the SARs**. Şart: ana veri NISAR olmalı, en az bir yüzey
değişimi zaman içinde gösterilmeli, sonuç herkesin kullanabileceği interaktif bir uygulama olmalı.

Bizim konu: **Mexico City'de zemin çökmesi**, NISAR L-band interferometrisiyle (GUNW ürünü).
Önerilen kurgu: Mexico City = yöntemin doğrulaması (literatürde yılda 30–40 cm bilinen vaka),
sonra aynı yöntem Konya'ya ya da başka bir vakaya uygulanabilir.

---

## 2. Neler kesinleşti

| Konu | Sonuç |
|---|---|
| Veri var mı? | **Evet.** ASF'de Mexico City için iki track'te provisional GUNW zinciri var. |
| Erişim çalışıyor mu? | **Evet.** Earthdata token'ı ile dosyalar indirilmeden buluttan parça parça okunuyor. |
| Çökme sinyali çıkıyor mu? | **Evet.** 11 aylık descending zincirde net bir çanak çıktı (bkz. `backend/out/chain_113.png`). |
| Tek 12 günlük çift yeter mi? | **Hayır.** Tek çiftte çökme yaklaşık 1 cm, atmosfer gürültüsü ±2–5 cm. Zincir şart. |

### Mexico City NISAR verisi (ASF araması, 14 Kasım 2026)

| Track | Yön | Çerçeve | Provisional çift | Tarih aralığı | Dosya başı |
|---|---|---|---|---|---|
| 113 | Descending (uydu batıdan bakar) | 79 | 26 | 6 Kas 2025 – 20 Eki 2026 | yaklaşık 2,35 GB |
| 19 | Ascending (uydu doğudan bakar) | 11 | 28 | 30 Eki 2025 – 13 Eki 2026 | yaklaşık 2,3 GB |

- Çiftler ardışık 12 günlük. Veri boşlukları 24 ve 36 günlük çiftlerle köprülenmiş; zincirde kopukluk yok.
- Sadece **PROVISIONAL** sürüm kullanılıyor. BETA ve V1 (validated) ile karıştırmayın.
- Konya'da da veri var: 4 track'te 65 GUNW (38'i provisional). Henüz işlenmedi.

### GUNW dosyasının içindeki katmanlar (gerçek dosyadan okundu)

```
science/LSAR/GUNW/grids/frequencyA/unwrappedInterferogram/HH/
    unwrappedPhase            radyan, 80 m ızgara, UTM 14N (EPSG:32614)
    coherenceMagnitude
    connectedComponents       0 = güvenilmez
    ionospherePhaseScreen     radyan, çıkarılıyor
    xCoordinates, yCoordinates, projection
science/LSAR/GUNW/grids/frequencyA/wrappedInterferogram/HH/wrappedInterferogram
science/LSAR/GUNW/metadata/radarGrid/      (kaba 3B küp: 20 yükseklik × ~680 × ~700)
    losUnitVectorX, losUnitVectorY        yerden uyduya birim vektörün doğu ve kuzey bileşeni
    incidenceAngle
    wetTroposphericPhaseScreen, hydrostaticTroposphericPhaseScreen   radyan
    slantRangeSolidEarthTidesPhase         radyan
    heightAboveEllipsoid                   küpün yükseklik katmanları
```

Tam liste: `backend/out/probe/layers.txt`.

Bakış geometrisi (Mexico City, yaklaşık 2000 m katmanı):

| Track | e (doğu) | n (kuzey) | u (yukarı) | Geliş açısı |
|---|---|---|---|---|
| 113 | −0,667 | +0,191 | 0,720 | 44° |
| 19 | +0,607 | +0,136 | 0,783 | 38° |

---

## 3. Bulgular

### Descending track 113, 26 çift, 348 gün (troposfer düzeltmesi YOK)

- Doğuda (Nezahualcóyotl, havalimanı, eski Texcoco kıyısı) ve güneyde (Chalco, Tláhuac) iki çökme çanağı var.
- Batıdaki kaya zemin (Santa Fe) yaklaşık 0. Referans noktası burası.
- Sarılı fazda yaklaşık 2 tam halka oluşuyor (bir halka = 11,9 cm LOS).
- En yüksek hız yılda yaklaşık −24 cm **LOS**. Dikeye kabaca çevrilince (÷0,72) yılda yaklaşık −33 cm; literatürle uyumlu.

`backend/out/chain_113.json` nokta değerleri (LOS, cm/yıl):

| Nokta | Değer | Not |
|---|---|---|
| Nezahualcóyotl | −20,8 | güvenilir |
| Zócalo | −9,9 | güvenilir |
| Xochimilco | −9,9 | güvenilir |
| Bağımsızlık Anıtı | −4,8 | güvenilir |
| Santa Fe | +0,4 | referans, beklendiği gibi |
| Iztapalapa | −3,6 | **koordinat yanlış**: büyük ihtimalle volkanik tepeye (Cerro de la Estrella / Sierra Santa Catarina) düşüyor |
| Chalco | −1,7 | **koordinat yanlış**: çanağın kenarında |
| Havalimanı (AICM) | NaN | eski göl tabanında sinyal kopuyor, maskelendi |

Nokta koordinatları örnek veriden kalma tahminlerdi. Haritadaki gerçek çanağa göre yeniden seçilmeleri gerekiyor.

### DİKEY HIZ (iki track birleşik, 348 gün) — ana sonuç

`backend/out/vertical.png`, `vertical.json`, `vertical.npz` (`vU` dikey, `vE` doğu-batı, cm/yıl).

| Nokta | Dikey (cm/yıl) | Doğu-batı | LOS 113 | LOS 19 |
|---|---|---|---|---|
| Nezahualcóyotl | **−28,8** | +0,1 | −20,8 | −22,7 |
| Zócalo | −11,8 | +1,6 | −9,9 | −8,2 |
| Xochimilco | −11,9 | +2,1 | −9,9 | −7,7 |
| Bağımsızlık Anıtı | −5,2 | +1,7 | −4,8 | −3,1 |
| Santa Fe (referans) | +0,7 | +0,1 | +0,4 | +0,6 |
| Iztapalapa / Chalco | −3,5 / −1,7 | | | koordinatlar çanağın dışında, yeniden seçilecek |

- Haritanın %1'lik en hızlı kısmı yılda **−31 cm** ve daha fazla: literatürle (yılda 30–40 cm) uyumlu.
- Nezahualcóyotl'de doğu-batı hareketi yaklaşık 0: hareket neredeyse tamamen dikey, fiziksel olarak beklenen bu.
- Güneybatıdaki dağlarda doğu-batı bileşeni gürültülü (−5 ile −10); orman ve topoğrafya. Kentte küçük (+1–2), muhtemelen referanslama kaynaklı ufak bir sapma.

### Troposfer düzeltmesi denendi: KULLANILMIYOR

Track 113'te çift başına şehir geneli saçılım: düzeltmesiz **1,53 cm**, ıslak+kuru troposfer (+) 1,94 cm, (−) 2,05 cm, +gelgit 1,94 cm.
Ürünün hava modeli (ECMWF) katmanları bu havzada gürültüyü artırıyor. `chain_test.py` varsayılanı artık `--corr none`.
Gürültü, hızın tüm tarihlere doğru uydurulmasıyla azaltılıyor.

### Önemli düzeltme

Zincirin ilk yarısından (168 gün) Nezahualcóyotl için yılda −36 cm çıkmıştı. Tam zincirde değer yılda −21 cm oldu.
Sebep: her çiftte şehir genelinde ±2–5 cm sahte hareket var (atmosfer). Tek bir gürültülü bitiş tarihi hızı şişirebiliyor.
Bu yüzden hız artık **bütün tarihlere uydurulan doğrudan** hesaplanıyor, uç noktalardan değil.

---

## 4. Veri hattı (backend/)

Ortam: Python 3.14, `backend/.venv`. Kurulum:

```
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
```

`pyproj` bu bilgisayarda Windows uygulama denetimine takıldı. UTM dönüşümü bu yüzden `probe_gunw.py` içinde elle yazıldı.

Token: `EARTHDATA_TOKEN` ortam değişkeni (urs.earthdata.nasa.gov > Generate Token).
Earthdata profilinde "Alaska Satellite Facility Data Access" uygulaması onaylı olmalı.
Token'ı koda ya da repoya yazmayın.

| Script | Ne yapar | Çıktı |
|---|---|---|
| `probe_gunw.py --track 113` | ASF'de arar, en son GUNW'yi açar, katmanları listeler, Mexico City kesitinin PNG'sini çıkarır | `out/probe/` |
| `chain_test.py --track 113 --workers 4` | Tüm çiftlerden kesit okur (önbelleğe alır), iyonosfer ve isteğe bağlı troposfer düzeltmesini uygular, Santa Fe'ye referanslar, zinciri toplar, hızı uydurur | `out/cache/<track>/*.npz`, `out/chain_<track>.png/.json`, `out/rate_<track>.npz` |
| `decompose.py` | İki track'in hızını LOS vektörleriyle dikey + doğu-batı hıza ayırır (kuzey hareketi 0 kabul edilir) | `out/geom_<track>.npz`, `out/vertical.npz/.png/.json` |

`chain_test.py` seçenekleri:
- `--corr none|tropo|tropo_set`: troposfer düzeltmesi yok / ıslak + kuru troposfer / artı katı yer gelgiti.
- `--sign 1|-1`: düzeltmenin işareti. **Henüz doğrulanmadı**; doğru olan, çiftler arası şehir geneli dalgalanmayı azaltandır.

### Önbellek dosyası (`out/cache/<track>/<ref>_<sec>.npz`)

| Anahtar | İçerik |
|---|---|
| `unw` | çözülmüş faz (radyan), Mexico City kesiti |
| `iono` | iyonosfer faz katmanı (radyan) |
| `cc` | bağlantılı bileşenler, 0 = maskelenecek |
| `coh` | tutarlılık |
| `x`, `y` | UTM 14N koordinatları (m) |
| `ref_xy` | referans noktası (Santa Fe) UTM |
| `wet`, `hydro`, `set` | troposfer ve gelgit katmanları, kaba ızgarada |
| `cx`, `cy` | o kaba ızgaranın koordinatları |

Kesit kutusu: lat 19,15–19,60, lon −99,30 – −98,85. Yaklaşık 620 × 590 piksel.

Faz → cm: `cm = −faz × 23,84 / (4π)`. Eksi = uydudan uzaklaşma = çökme. Çıkan desenle tutarlı, ama ürün kılavuzundan da teyit edin.

### `out/rate_<track>.npz`

`rate` (cm/yıl LOS), `stack` (tarih × y × x birikmiş cm, ilk tarih 0), `dates`, `x`, `y`.

---

## 5. Arayüz (web/)

React + Vite + Tailwind + Leaflet. Şu an **örnek veriyle** çalışıyor (`scripts/mock-data.mjs`).
Gerçek veriyi bağlamak için `README.md` içindeki şemaya uyan dosyaları `web/public/data/` altına koymak yeterli:

- `regions.json`: tarihler, kutu, renk aralığı, `source.status: "verified"`.
- `cdmx/points.json`: noktalar ve tarih tarih `disp_cm` (DİKEY, eksi = çöküyor).
- `cdmx/disp_<tarih>.png`, `cdmx/wrap_<tarih>.png`: her tarih için birikmiş dikey hareket ve sarılı faz.
- `cdmx/hh.png`, `hv.png`, `rgb.png`: GCOV arka planları (henüz yok).

Dikkat: arayüzün kutusu EPSG:4326 düz ızgara bekliyor. Bizim veri UTM 14N'de; PNG'leri üretirken enlem-boylam ızgarasına yeniden örneklemek gerekiyor.

Çalıştırma: `cd web && npm install && npm run dev`.

---

## 6. Yapılacaklar (öncelik sırasıyla)

1. ~~Track 19 zinciri ve dikey hız~~ **bitti** (`out/vertical.*`).
2. ~~Troposfer düzeltmesi~~ **denendi, kullanılmıyor** (yukarıya bakın).
3. **Noktaları yeniden yerleştir**: dikey hız haritasındaki çanaklara göre (en hızlı yer, kenar, sabit kaya).
4. **Arayüze aktar**: `vertical.npz` ve `stack`'ten dikey birikmiş kareleri EPSG:4326'ya örnekle, README şemasındaki PNG ve JSON'ları üret.
5. **L-band / C-band karşılaştırması**: aynı tarihlere denk gelen 3–5 Sentinel-1 12 günlük çifti ASF HyP3'ten sipariş et (ücretsiz, aynı Earthdata hesabı). Chalco ve Xochimilco tarlalarında tutarlılığı NISAR'la yan yana koy. Tam C-band zaman serisi çıkarmayın; zaman kaybı. Doğrulama için literatür hızları yeterli.
6. **GCOV HH/HV** arka planı: bir GCOV dosyasından Mexico City kesiti (dosya başı yaklaşık 7 GB; aynı parça okuma yöntemiyle).
7. İsteğe bağlı: Konya'ya aynı hattı uygula (`CDMX` kutusunu ve referans noktasını değiştirerek).

### Bilinen sorunlar

- Eski göl tabanında (havalimanı, Texcoco) sinyal kopuyor; buralar maskeleniyor.
- Maskelenen pikseller zincirde 0 hareket sayılıyor; bir pikselin çiftlerin %30'undan fazlasında verisi yoksa harita dışı bırakılıyor. Daha iyi yöntem: piksel bazında eksik çiftleri atlayıp kalanlarla uydurmak.
- L-band iyonosfere duyarlı. Ürünün iyonosfer katmanı çiftten çifte bağımsız tahmin edildiği için zincirde hata birikebilir.
- Ağ zaman aşımları: `chain_test.py` her dosyayı 4 kez dener. Kalan çiftler için tekrar çalıştırmak yeterli; önbellekteki çiftler yeniden okunmaz.

---

## 7. Dosya haritası

```
HANDOFF.md            bu dosya
README.md             arayüz veri şeması
backend/              veri hattı (Python)
  probe_gunw.py  chain_test.py  decompose.py  requirements.txt
  out/                (git'e girmez; zip ile paylaşılır)
    cache/113, cache/19   okunmuş kesitler
    chain_113.png/json    11 aylık descending sonuç
    rate_113.npz          hız + birikmiş seri
    geom_113.npz, geom_19.npz
    probe/layers.txt      GUNW katman listesi
scripts/mock-data.mjs örnek veri üretici (arayüz için)
web/                  arayüz
docs/video-senaryosu.md
```
