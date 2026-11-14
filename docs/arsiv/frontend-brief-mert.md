# Mert için: yeni arayüz brifi (içerik, tasarım değil)

## 1. Proje tek paragrafta

NASA Space Apps 2026, "Dancing with the SARs". **NISAR L-band radarıyla Mexico City'nin batışını** zaman içinde gösteren interaktif harita. İki yönden bakan iki track'in (19 ascending + 113 descending, provisional L2 GUNW) 11 aylık zincirini birleştirip **dikey çökme hızı** çıkardık. Sonuç literatürle aynı mertebede: en hızlı yerler **yılda 33–36 cm** batıyor, kaya zemin ~0. Arka planda gerçek NISAR GCOV HH/HV/RGB görüntüsü var. Site TR/EN.

## 2. Elimizde hazır olan veri (hepsi `web/public/data/`, hepsi GERÇEK NISAR)

| Dosya | İçerik |
|---|---|
| `regions.json` | 28 tarih (**2025-11-11 → 2026-10-13, 336 gün**), harita kutusu, renk durakları, veri boşluğu (`2026-07-21 → 2026-08-14`), istatistik (en hızlı %1: −32,9 cm/yıl, geçerli piksel %95,6), kaynak bilgisi (`status: "verified"`) |
| `cdmx/points.json` | 11 nokta: ad, not (TR/EN), koordinat, dikey hız, LOS hız, doğu-batı hız, 28 tarihlik birikmiş dikey seri (`disp_cm`). `s1_rate_cm_yr` şimdilik hep `null` |
| `cdmx/disp_<tarih>.png` ×28 | O tarihe kadar birikmiş dikey çökme haritası |
| `cdmx/lwrap_<tarih>.png` ×28 | L-band radar halkaları (gerçek, 1 halka = 11,9 cm) |
| `cdmx/cwrap_<tarih>.png` ×28 | Aynı hareket C-band dalga boyuyla sarılmış (SİMÜLASYON, 1 halka = 2,8 cm) |
| `cdmx/rate.png` | Dikey hız haritası (cm/yıl, −40…+8) |
| `cdmx/hh.png`, `hv.png`, `rgb.png` | Gerçek GCOV arka planı (13 Eki 2026) |
| `cdmx/fringes.json` | Her tarihte en hızlı yerde kaç halka: L vs C |
| `backend/out/l_vs_c_forest.json` | 5 çiftte NISAR vs Sentinel-1 tutarlılık (orman, şehir, Chalco tarla, Tláhuac sulak) |

Noktalar ve dikey hızları (cm/yıl): Tláhuac sulak alanı −36,4 · Chalco ovası −35,7 · Aragón −33,6 · Nezahualcóyotl −28,8 · Iztapalapa −23,7 · Xochimilco −11,9 · Zócalo −11,8 · Bağımsızlık Anıtı −5,2 · Peñón Viejo −0,8 · Ciudad Universitaria −0,4 · Santa Fe +0,7 (referans).

## 3. Sayfa düzeni ve her kutunun içeriği

```
┌───────────────┬──────────── BAŞLIK ─────────────┬────────────────┐
│ SOL ÜST       │                                 │ SAĞ ÜST        │
│ Bölge kartı   │                                 │ Çökme grafiği  │
│               │         HARİTA (tam ekran)      │                │
│ SOL ALT       │                                 │ SAĞ ALT        │
│ L vs C band   │      ── zaman çizgisi ──        │ Neden batıyor? │
└───────────────┴─────────────────────────────────┴────────────────┘
```

### 3.1 Orta: harita (sayfanın kalbi)

- **Katman seçici** (bir anda biri): Birikmiş çökme (cm) · Dikey hız (cm/yıl) · Radar halkaları.
- **Arka plan seçici:** Sokak haritası · NISAR HH · HV · RGB. Çökme katmanı için **saydamlık kaydırıcısı**.
- **Lejant** (renk çubuğu + birim). Renkler `regions.json > colors`'tan okunmalı, elle yazılmamalı. Saydam = veri yok (maskeli, ör. havalimanı) — lejantta "veri yok" ayrıca yazsın.
- **11 nokta işaretçisi**, renk/boyut hıza göre. Tıklanınca o nokta seçilir → sol üst kart ve sağ üst grafik ona göre değişir.
- **Haritada herhangi bir yere tıklama / üstüne gelme:** o pikselin değeri (cm veya cm/yıl). Opsiyonel ama çok etkileyici.
- **Referans işareti:** Santa Fe "0 noktası" diye ayrı işaretli olsun.
- **Zaman çizgisi (alt orta):** 28 tarih, ▶ oynat/durdur, kaydırıcı, seçili tarih yazısı. Temmuz–Ağustos boşluğu **taralı "veri yok"** olarak görünsün (gizlemiyoruz). Tarih değişince harita, grafik imleci ve L/C kutusu birlikte değişir.
- Opsiyonel: **"Karşılaştır" perdesi** — solda radar halkaları, sağda çözülmüş çökme; ortadaki çizgi sürüklenir.

### 3.2 Orta üst: başlık

- Başlık: **"Mexico City batıyor"** / "Mexico City is sinking".
- Alt satır (tek cümle): "NISAR L-band radarı, 11 ay, 28 geçiş: bazı mahalleler yılda 35 cm alçalıyor."
- **Veri rozeti:** "NISAR verisi · provisional" (`source.status`'tan; `mock` olursa "Örnek veri").
- Küçük kaynak satırı: sensör, ürün (L2 GUNW), track 19 + 113, tarih aralığı.
- **TR/EN düğmesi** ve "Nasıl yaptık?" bağlantısı (yöntem modalı, aşağıda).

### 3.3 Sol üst: bölge kartı (seçili nokta)

Varsayılan seçili nokta: Nezahualcóyotl (ya da en hızlı olan).
- **Nokta seçici** (açılır liste / sekmeler; 11 nokta, hıza göre sıralı).
- Ad + kısa not (`note`, TR/EN), ör. "eski göl tabanı, kil" / "volkanik tepe, kaya".
- **Büyük sayı: dikey hız** (ör. −28,8 cm/yıl).
- **Seçili tarihe kadar birikmiş çökme** (ör. "11 Kas'tan beri −27,2 cm").
- Somut çeviri: "Bu hızla 10 yılda ~2,9 m" veya bir insan/kapı boyu ölçeğiyle kıyas (eski arayüzdeki "ölçü mirası" fikri).
- Küçük teknik satır: LOS 113 / LOS 19 değerleri, doğu-batı hareketi ("hareket neredeyse tamamen dikey").
- Zemin etiketi: **kil** / **kaya** (kaya olanlar: Santa Fe, Peñón Viejo, CU — "referans/kontrol noktası" rozetiyle).
- Uyarı gerekiyorsa: Aragón'da belirsizlik daha yüksek (göl tabanı kenarı, iki track ayrışıyor).

### 3.4 Sağ üst: çökme grafiği

- **Çizgi grafik:** x = tarih (28 nokta), y = birikmiş dikey hareket (cm). Seçili nokta kalın çizgi + noktalar.
- **Karşılaştırma için** 1–2 sabit çizgi daha (soluk): ör. Santa Fe (kaya, ~düz) ve en hızlı nokta. "Kil batıyor, kaya duruyor" grafikten okunmalı.
- **Uydurulan hız doğrusu** (kesikli) + eğim etiketi "−28,8 cm/yıl".
- **Seçili tarih imleci** (dikey çizgi), zaman çizgisiyle senkron.
- **Veri boşluğu** grafikte de taralı alan.
- Hover tooltip: tarih + cm.
- `s1_rate_cm_yr` doluysa Sentinel-1 eğilim çizgisi; `null` ise gizle (şu an hepsi null).
- **Sütun grafik (aynı kutuda sekme ya da altında):** 11 noktanın dikey hızları yatay çubuk, en hızlıdan en yavaşa. Seçili nokta vurgulu. İsteğe bağlı: her çubuğun yanında literatür değeri (Nezahualcóyotl ~38,7, Iztapalapa ~39 — Cigna & Tapete 2021; Chalco >35 — Solano-Rojas 2024).
- Not satırı: "Kareler arası gürültü ±1–2 cm; Aralık–Şubat yavaşlama, Mart–Mayıs hızlanma görünüyor, mevsimsel mi atmosferik mi ayrıştırılmadı."

### 3.5 Sol alt: L-band / C-band karşılaştırma

Mesaj: **"Neden NISAR (L-band)?"** İki ayrı kanıt var, ikisi de gösterilmeli:

1. **Halka sayısı (`fringes.json`)** — seçili tarihe bağlı canlı sayaç:
   "En hızlı yerde bu tarihe kadar 26,7 cm hareket → L-band'de **2,2 halka**, C-band'de **9,6 halka**." Halka sıklaştıkça doğru saymak (çözmek) zorlaşır.
   Haritada **L / C düğmesi** (radar halkaları katmanında `lwrap_` ↔ `cwrap_`). C görünümüne mutlaka **"SİMÜLASYON: NISAR hareketi C-band dalga boyuyla yeniden sarıldı, Sentinel-1 verisi değildir"** etiketi.
   Mini grafik: zamanla L ve C halka sayısı (iki çizgi).
2. **Tutarlılık (`l_vs_c_forest.json`)** — 5 gerçek çift (NISAR vs Sentinel-1), 4 sınıf: orman, şehir (Zócalo), Chalco tarla, Tláhuac sulak. Gruplu sütun grafik, şehre göre normalize ("rel") değerle.
   **Dürüst yorum:** ham tutarlılıkta Sentinel-1 genelde yüksek; şehre göre normalize edince kuru dönemde NISAR ormanda (0,95 vs 0,61) ve sulak alanda (0,98 vs 0,73) önde, yağmur döneminde fark kapanıyor/karışık, Chalco tarlasında S1 iyi. Kutuda "L-band her yerde üstün" yazmayalım; "bitki örtüsünde avantajlı, halka sayısında kesin avantajlı" diyelim.
- Bir satır açıklama: L-band dalga boyu ~24 cm, C-band ~5,6 cm; uzun dalga yapraktan geçer, büyük hareketi daha az halkayla gösterir.

### 3.6 Sağ alt: "Neden batıyor?"

Kısa, 3 adım (ikon + bir cümle), metinler zaten `i18n.tsx`'te (`why1–3`, `whyHuman`):
1. **Göl:** Aztekler şehri Texcoco gölü üstüne kurdu; göl kurutuldu, geriye suya doymuş kil kaldı.
2. **Pompa:** Şehrin suyunun büyük kısmı kilin altındaki akiferden çekiliyor; su gidince kil sıkışıyor, geri dönmüyor.
3. **Kanıt (bizim veri):** kaya zemindeki Santa Fe, Peñón Viejo, CU ~0; kil üstündekiler −24 ile −36 cm/yıl. "Çökme kili takip ediyor."
- Hipotez cümlesi: "Neden fiziksel (kil), tetikleyici insan (pompalama)."
- **Sonuçları:** Metro hatlarında hasar, boru kırıkları, binalarda eğilme, sel riski (1–2 madde, kaynaklı).
- **Literatür doğrulaması** (küçük tablo veya tek satır): "ALOS 2007–11: >30 cm/yıl · Sentinel-1 2017–19: ~39 cm/yıl · NISAR 2025–26 (biz): en hızlı %1 ≥33 cm/yıl." Kaynaklar `docs/dogrulama.md`'de.

### 3.7 Kutuların dışında olması gerekenler

- **"Nasıl yaptık?" modalı:** GUNW → iyonosfer düzeltmesi → Santa Fe'ye referans → 26–28 çift zincir → hız uydurma → iki track ile dikey/doğu-batı ayrıştırma. Troposfer düzeltmesi denendi, gürültüyü artırdığı için kullanılmadı.
- **Sınırlamalar (dürüstlük kutusu):** provisional ürün; tek 11 aylık pencere; kuzey-güney hareket 0 kabul; havalimanı/eski Texcoco maskeli (veri yok ≠ çökme yok); GNSS ile doğrudan doğrulama yok.
- **Ekip / footer:** Arda, Mert, Yağız · NASA Space Apps 2026 · açık kaynak linki.
- **Yükleniyor / hata durumları**, TR/EN tüm metinler.
- **Mobil:** 4 kutu harita altına sırayla dizilsin (başlık → harita → bölge → grafik → L/C → neden).

## 4. Etkileşim akışı (her şey birbirine bağlı)

- **Tarih** değişince: harita PNG'si, grafik imleci, bölge kartındaki birikmiş değer, L/C halka sayacı.
- **Nokta** seçilince: bölge kartı, grafik çizgisi, sütun grafikte vurgu, haritada işaretçi vurgusu.
- **Dil** değişince: tüm metinler + nokta adları/notları (`name`/`note` TR/EN).
- **Katman** (çökme / hız / halkalar, L/C) ve **arka plan** (sokak/HH/HV/RGB) birbirinden bağımsız.

## 5. Dikkat edilecek ufak şeyler

- Eski `agree` metni "dört aylık NISAR, Sentinel-1'in on yıllık eğilimiyle örtüşüyor" diyor: artık **11 aylık** ve S1 hızları `null`. Metin güncellenmeli ya da S1 değerleri gelene kadar kaldırılmalı.
- `disp` = **dikey**; `lwrap` = **LOS** (radarın gördüğü). Lejantlarda bu ayrım yazmalı.
- Seri 336 gün (iki track'in ortak aralığı), hız 348 günlük zincirden; ikisi karışmasın.
- Video senaryosu (`docs/video-senaryosu.md`) eski arayüze göre; yeni düzen bitince güncellenecek.
