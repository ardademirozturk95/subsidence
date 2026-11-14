# Subsidence: devir notu (Mert ve Yağız için)

Bu dosya projenin şu ana kadarki bütün durumunu anlatır. Kendi yapay zekânıza bu dosyayı ve
`backend/` klasörünü verirseniz kaldığımız yerden devam edebilir.

Son güncelleme: 14 Kasım 2026 akşam (arayüz verisi üretildi, noktalar yeniden seçildi; bkz. bölüm 8).

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
3. ~~Noktaları yeniden yerleştir~~ **bitti** (`backend/points_cdmx.json`, bölüm 8).
4. ~~Arayüze aktar~~ **bitti** (`backend/export_web.py` → `web/public/data/`, bölüm 8). Renk durakları arayüzle eşitlenecek.
5. **L-band / C-band karşılaştırması**: aynı tarihlere denk gelen 3–5 Sentinel-1 12 günlük çifti ASF HyP3'ten sipariş et (ücretsiz, aynı Earthdata hesabı). Chalco ve Xochimilco tarlalarında tutarlılığı NISAR'la yan yana koy. Tam C-band zaman serisi çıkarmayın; zaman kaybı. Doğrulama için literatür hızları yeterli.
6. **GCOV HH/HV** arka planı: script hazır (`backend/gcov_subset.py`), **henüz gerçek dosyayla çalıştırılmadı** (token'lı bilgisayarda çalıştırılacak).
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

---

## 8. 14 Kasım akşam güncellemesi (Mert): arayüz verisi ve yeni noktalar

### Üretilen dosyalar (`web/public/data/`, README şemasıyla)

- `regions.json`: 28 tarih, **2025-11-11 → 2026-10-13 (336 gün)**, `status: "verified"`, `disp_range_cm: [-35, 5]`, `gap: ["2026-07-21", "2026-08-14"]`.
- `cdmx/points.json`: 11 nokta, tarih tarih birikmiş **dikey** hareket.
- `cdmx/disp_<tarih>.png` × 28, `cdmx/wrap_<tarih>.png` × 28: 600 × 600 piksel, EPSG:4326, kutuyu tam kaplar, kuzey yukarı, veri yoksa saydam. Toplam ~15 MB.
- `cdmx/rate.png`: dikey hız haritası (cm/yıl, −40…+8). Şemada yok, isteğe bağlı katman.

Yeniden üretmek (ağ ve token gerekmez, sadece `out/cache` ve `out/geom_*.npz`):

```
backend/.venv/Scripts/python backend/export_web.py
```

### Nasıl hesaplandı

1. **Tarihler:** iki track 6 gün kaymalı geçiyor. Tarih ekseni olarak ascending track 19'un geçişleri kullanıldı (28 tarih, tek 24 günlük boşluk);
   track 113'ün birikmiş serisi bu tarihlere zamanda doğrusal ara değerle taşındı. İlk ortak tarih (11 Kasım 2025) = 0.
   Seri bu yüzden 348 değil 336 gün. Hız (`rate_cm_yr`) yine her track'in tam 348 günlük zincirinden.
2. **Dikey:** her tarihte iki LOS birikimi `decompose.py` ile aynı formülle dikey + doğu-batıya ayrıldı (kuzey-güney 0 kabul).
3. **Sarılı faz (`wrap_`)**: track 19'un birikmiş **LOS** hareketi, bir tur = 11,92 cm. Dikey değil LOS, çünkü halka radarın gördüğü şeydir.
4. **Eksik çiftler:** bir pikselin bir çiftte verisi yoksa artık 0 sayılmıyor, pikselin kendi ortalama hızıyla dolduruluyor
   ("bilinen sorunlar"daki madde). `--fill zero` eski davranışı verir; onunla `rate_*.npz` ve `vertical.npz` 0,0001 cm hassasiyetle aynen çıkıyor (kontrol edildi).
   Etkisi: adı geçen noktalarda değişiklik yok; hızlı çöken bölgede ortalama −0,9 cm/yıl; haritanın en hızlı %1'i **−31,1 → −32,9 cm/yıl**.
5. **Izgara:** UTM 14N (80 m) → enlem-boylam 0,00075° (~80 m), NaN'e duyarlı bilineer.
   Konum kontrolü: Peñón Viejo tepesi (19,3786, −99,0300) haritada −1 cm/yıl, 1,5 km çevresi her yönde −15 ile −26 cm/yıl; Xico krateri −0,4. Yani konumlama doğru.
6. **Renk:** paletli PNG (255 kademe). Duraklar `regions.json > colors` içinde cm cinsinden yazılı (`disp_stops_cm`, `wrap_stops`).
   **DİKKAT:** bu duraklar arayüzdeki `DISP_STOPS` / `WRAP_STOPS` görülmeden seçildi. Ya arayüz lejantı `regions.json > colors`'tan okusun,
   ya da `export_web.py --stops` ile arayüzün durakları verilip PNG'ler yeniden üretilsin (birkaç saniye).
   Artı taraf eksi tarafla aynı cm ölçeğinde: +3 cm atmosfer gürültüsü soluk mavi kalır, yükselme gibi görünmez.

Kare başına gürültü: sabit zeminde karelerin şehir geneli saçılımı 1–2 cm. Seriler düz bir çizgi değil; hızlı noktaların hepsinde
Aralık–Şubat arası yavaşlama, Mart–Mayıs arası hızlanma görünüyor. Gerçek mevsimsellik mi, atmosfer/iyonosfer artığı mı, ayrıştırılmadı.

### Yeni noktalar (dikey hız haritasındaki çanaklara göre)

| Nokta | id | Koordinat | Dikey (cm/yıl) | Doğu-batı | LOS 113 | LOS 19 | 336 günde birikmiş (cm) |
|---|---|---|---|---|---|---|---|
| Xochimilco–Tláhuac sulak alanı | `tlaxialtemalco` | 19.2682, −99.0392 | **−36,4** | −2,7 | −23,9 | −31,5 | −34,0 |
| Chalco ovası (Xico'nun güneyi) | `chalco` | 19.2453, −98.9363 | **−35,7** | +2,8 | −26,3 | −30,1 | −32,7 |
| Aragón (havalimanının kuzeyi) | `aragon` | 19.4716, −99.0575 | **−33,6** | +6,8 | −28,8 | −22,4 | −30,8 |
| Nezahualcóyotl | `neza` | 19.4000, −99.0150 | **−28,8** | +0,1 | −20,8 | −22,7 | −27,2 |
| Iztapalapa (doğu ova) | `iztapalapa` | 19.3564, −99.0407 | **−23,7** | +3,0 | −19,8 | −17,0 | −22,5 |
| Xochimilco (çanak kenarı) | `xochimilco` | 19.2620, −99.1000 | **−11,9** | +2,1 | −9,9 | −7,7 | −10,8 |
| Zócalo (tarihi merkez) | `zocalo` | 19.4330, −99.1330 | **−11,8** | +1,6 | −9,9 | −8,2 | −11,3 |
| Bağımsızlık Anıtı | `angel` | 19.4270, −99.1680 | **−5,2** | +1,7 | −4,8 | −3,1 | −5,1 |
| Peñón Viejo (volkanik tepe) | `penon` | 19.3786, −99.0300 | **−0,8** | +1,2 | −0,8 | +0,5 | −0,3 |
| Ciudad Universitaria (lav zemin) | `cu` | 19.3320, −99.1870 | **−0,4** | +1,5 | −1,3 | +0,6 | −0,3 |
| Santa Fe (referans) | `santafe` | 19.3600, −99.2600 | **+0,7** | +0,1 | +0,4 | +0,6 | +0,6 |

- Değerler 7 × 7 piksel (560 m) medyan.
- Eski "Chalco" koordinatı (19.265, −98.93) Xico volkanının üstüne düşüyordu; yeni nokta kraterin 1,6 km güneyindeki ovada.
- Eski "Iztapalapa" koordinatı (19.357, −99.058) çanağın dışındaydı; yeni nokta yaklaşık 2 km doğuda, çanağın içinde.
- Havalimanı (AICM) dikeyde hâlâ veri yok (track 113'te maskeli); yerine 4 km kuzeyindeki Aragón noktası kondu.
- `aragon` noktasında iki track ayrışıyor (LOS −28,8 ve −22,4), bu yüzden doğu-batı +6,8 çıkıyor: maskeli göl tabanının kenarı, track 113'te 1 eksik çift. Buradaki doğu-batıya güvenmeyin; dikey −33,6 da diğer noktalara göre daha belirsiz (birkaç cm/yıl).
- `penon` ve `cu` referans DEĞİL; ikisinin de ~0 çıkması yöntemin bağımsız kontrolü.
- `s1_rate_cm_yr` bütün noktalarda `null` (Yağız'ın literatür/Sentinel-1 değerleri gelince doldurulacak). **Arda: arayüz `null` değeri kaldırıyor mu, kontrol et.**
- Nokta eklemek/çıkarmak: `backend/points_cdmx.json`'u düzenle, `export_web.py`'yi yeniden çalıştır.

### GCOV (iş 4)

`backend/gcov_subset.py` yazıldı: ASF'de GCOV arar, en son dosyadan `HHHH` ve `HVHV` kesitini okur, güçte ortalayıp (~40 m) dB'ye çevirir,
`hh.png`, `hv.png` (−30…−2 dB gri), `rgb.png` (R: HH −22…0 dB, G: HV −30…−8 dB, B: HH/HV 2…16 dB) yazar; 1200 × 1200 piksel.
Katman yolları ASF NISAR belgelerinden doğrulandı, ama script **gerçek dosyayla çalıştırılmadı** (yazıldığı ortamdan ASF'ye erişim yoktu);
sentetik bir HDF5 ile uçtan uca sınandı. Çalıştırma:

```
backend/.venv/Scripts/python backend/gcov_subset.py --list          # önce ne var bak
backend/.venv/Scripts/python backend/gcov_subset.py --track 19      # en son geçiş
```
