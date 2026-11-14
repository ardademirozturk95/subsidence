# L-band (NISAR) vs C-band (Sentinel-1) Uzun Zaman Bazı Tutarlılık Analizi (12 gün → 24/36 gün)

Bu rapor, 12 günlük tutarlılık testinin (`docs/arsiv/l-vs-c-raporu.md` / `docs/arsiv/l-vs-c/l_vs_c_coherence.json`) ardından **"L-band zaman içinde tutarlılığını C-band'dan daha iyi koruyor mu?"** hipotezini 24 ve 36 günlük interferogram çiftleriyle sınayan `backend/arsiv/l_vs_c_baseline.py` çıktılarının (`docs/arsiv/l-vs-c/l_vs_c_baseline.json` ve `docs/arsiv/l-vs-c/l_vs_c_baseline.png`) özetini sunar.

---

## 1. Yöntem, Eşleştirme ve Zaman Farkı Kuralları

### 1.1 Veri, Izgara ve Piksel İşlemi
- **NISAR L2 GUNW (L-band, HH, ~23,84 cm):** 80 m × 80 m EPSG:32614 ızgarası, `13×16` (208) bakış. Her sabit 15×15 piksellik (1,2 km × 1,2 km, 225 piksel) kutuda **`cc == 0` pikseller atılmadan** tüm pikseller üzerinden medyan tutarlılık hesaplandı; `cc == 0` piksel oranı ayrı raporlandı.
- **Sentinel-1 IW (C-band, VV, ~5,6 cm, ASF HyP3 / GAMMA `INSAR_GAMMA`):** 80 m EPSG:32614, `20×4` (80) bakış, `adf` faz süzgeci (`α = 0,6`). `_corr.tif` dosyaları `rasterio` bilineer örnekleme (`src_nodata = 0 → NaN`) ile bire bir NISAR ızgarasına yeniden örneklendi.
- **HyP3 Siparişleri (`docs/arsiv/l-vs-c/jobs_long.json`):** `jobs.json` dosyasına dokunulmadan tam 3 uzun bazlı HyP3 siparişi verildi ve tümü `SUCCEEDED` olarak tamamlandı. Kredi bakiyesi `7950 → 7920` (`−30` kredi). Yalnızca `*_corr.tif` dosyaları indirildi.

### 1.2 Bağımsız Orman Kutusu (`docs/arsiv/l-vs-c/forest_box.json`)
- Tutarlılık haritalarına hiç bakılmadan önce, ESA WorldCover 2021 v200 (10 m) verisiyle CDMX kesiti (`lat 19,15–19,60`, `lon −99,30 / −98,85`) içindeki en büyük bağlantılı ağaç örtüsü (`class 10`) yaması (`202,94 km²`, 8-bağlantılı) belirlendi.
- Öklid uzaklık dönüşümü merkezi en yakın NISAR 80 m pikseline yuvarlandı: **`forest` (Ajusco–Los Dinamos)**, `lat = 19,255861`, `lon = −99,267585` (`ix = 42, iy = 476`, `UTM X = 471.880 m`, `UTM Y = 2.129.160 m`), kutu içi WorldCover 2021 dağılımı **%100,0 Ağaç örtüsü (`17.831/17.831` 10 m piksel)**.

### 1.3 Çift Eşleştirme, Mevsim Ayrımı ve `(S1 − NISAR)` Tarih Farkı
Her uzun bazlı çift yalnızca **aynı sensör yörüngesi (track/yön) ve aynı mevsimdeki** 12 günlük referansla karşılaştırıldı (kurak ve yağışlı mevsimler karıştırılmadı). Tarih farkı her çiftin başlangıç ve bitiş tarihleri için `(S1 − NISAR)` gün cinsinden hesaplandı; `|fark| > 4 gün` eşiği `"zayıf eşleşme"` bayrağı olarak tanımlandı:

| Çift (Rol) | Track / Yön / Mevsim | NISAR Çifti (`cache/*.npz`) | Sentinel-1 Çifti (`_corr.tif`, Uydu / Orbit / Frame) | `S1 − NISAR` Farkı | Eşleşme Notu |
|---|---|---|---|---|---|
| **`desc-dry-24d`** (24g) | 113 / Desc / Kurak | `2026-03-18 / 2026-04-11` | `2026-03-16 / 2026-04-09` (S1C, orb 143, fr 527) | **`−2 / −2 gün`** | Uygun (`\|Δ\| ≤ 4`). `2026-04-22` öncesinde S1D verisi olmadığından S1C kullanıldı; 12g ref (`desc-dry-0422-0504`) S1D orb 143 fr 528'dir. |
| ↳ *12g ref:* `desc-dry-0422-0504` | 113 / Desc / Kurak | `2026-04-23 / 2026-05-05` | `2026-04-22 / 2026-05-04` (S1D, orb 143, fr 528) | **`−1 / −1 gün`** | Uygun (`\|Δ\| ≤ 4`). |
| **`desc-rain-36d`** (36g) | 113 / Desc / Yağış | `2026-07-16 / 2026-08-21` | `2026-07-15 / 2026-08-20` (S1D, orb 143, fr 526) | **`−1 / −1 gün`** | Uygun (`\|Δ\| ≤ 4`). `desc-rain-0901-0913` ile aynı uydu/orbit/frame. |
| ↳ *12g ref (ort.):* `desc-rain-0609-0621` & `0901-0913` | 113 / Desc / Yağış | `06-10/06-22` & `09-02/09-14` | `06-09/06-21` (fr 528) & `09-01/09-13` (fr 526) (S1D) | **`−1 / −1 gün`** (ikisi de) | İki yağışlı 12g çiftin kutu medyanlarının ortalaması alındı. |
| **`asc-rain-24d`** (24g) | 19 / Asc / Yağış | `2026-07-21 / 2026-08-14` | `2026-07-17 / 2026-08-10` (S1C, orb 78, fr 55) | **`−4 / −4 gün`** | Sınırda uygun (`\|Δ\| = 4 ≤ 4`, `"zayıf eşleşme"` eşiği `>4` gün aşılmadı). `asc-rain-0523-0604` ile aynı uydu/orbit/frame (`−5g` döngü kayması). |
| ↳ *12g ref:* `asc-rain-0523-0604` | 19 / Asc / Yağış | `2026-05-22 / 2026-06-03` | `2026-05-23 / 2026-06-04` (S1C, orb 78, fr 55) | **`+1 / +1 gün`** | Uygun (`\|Δ\| ≤ 4`). S1 çerçevesi `ZOC` ve `STF`'yi kapsamaz (`NaN`). |

---

## 2. Önceden Kayıtlı Geçme Ölçütü ve Dışlama Kuralı

Sonuçlar görülmeden önce sabitlenen ölçüt:
1. **Tarım/sulak alan kutuları (3 adet):** `chalco`, `xochimilco_fields` (WorldCover 2021'de %49,5 ağaç + %46,5 yapılaşma, Tarım %0 çıktığı için **"arazi örtüsü tanıma uymuyor"** etiketi korunarak sabit tutuldu) ve `tlaxialtemalco`.
2. **`< 0,20` Dışlama Kuralı ("ikisi de kaybetti"):** Uzun zaman bazında bir kutuda **her iki sensörün medyan tutarlılığı da `< 0,20`** ise o kutu `"ikisi de kaybetti"` sayılarak ölçütten hariç tutulur.
3. **Çift kuralı:** Hariç tutulmayan tarım/sulak alan kutularının **en az 2'sinde** şu iki koşul aynı anda sağlanmalıdır:
   - **(i)** Uzun baz farkı: `(NISAR_uzun − S1_uzun) ≥ 0,15`
   - **(ii)** Kayıp farkı: `(S1_kayıp − NISAR_kayıp) ≥ 0,10`, burada `kayıp = coh_12g − coh_uzun`.
4. **Genel hüküm:** `3/3` çift geçerse **doğrulandı**, `2/3` çift geçerse **kısmen**, `<2/3` çift geçerse **doğrulanmadı**.

### Dışlama Kuralı Kontrolü
- **Uzun zaman bazında:** 3 uzun çiftin ve 6 kutunun **hiçbirinde** her iki sensör birden `< 0,20` değildir (`excluded_agri_boxes = []`). Yalnızca tek sensörün `< 0,20` altına indiği durumlar gözlenmiştir:
  - `desc-dry-24d` / `chalco`: NISAR `0,187` (`<0,20`, `cc0 = %32,0`), S1 `0,471` (`≥0,20`) → hariç değil.
  - `desc-dry-24d` / `forest`: NISAR `0,097` (`<0,20`, `cc0 = %100,0`), S1 `0,477` (`≥0,20`) → tarım/sulak değil ve tek sensör `<0,20`.
  - `desc-rain-36d` / `forest`: NISAR `0,411` (`≥0,20`), S1 `0,200` (`0,1995 < 0,20`) → tek sensör `<0,20`.
  - `asc-rain-24d` / `forest`: NISAR `0,549` (`≥0,20`), S1 `0,192` (`<0,20`) → tek sensör `<0,20`.
- **12 günlük referans bazında (ek bilgi):** `desc-rain` 12g referansında `forest` kutusu hem NISAR (`0,121`, `cc0 = %83,1`) hem de S1 (`0,185`) ile `< 0,20` idi (`both_lost_lt_020_12d = true`); ancak `forest` tarım/sulak alan grubunda olmadığı ve uzun bazda (`36g`) NISAR `0,411`'e yükseldiği için dışlama tetiklenmedi.

---

## 3. Çift Çift ve Kutu Kutu Sonuçlar (Tüm 6 Kutu)

Kısaltmalar: `N = NISAR`, `S1 = Sentinel-1`, `Fark = N − S1`, `Kayıp = 12g − Uzun`, `ΔKayıp = S1_kayıp − N_kayıp`.

### 3.1 `desc-dry-24d` (Track 113, Kurak, 12g → 24g | `S1−NISAR: −2/−2 gün`)
*12g referansı:* `desc-dry-0422-0504` (S1D, orb 143, fr 528) | *24g çift:* S1C, orb 143, fr 527 (`2026-03-16 / 2026-04-09`) vs NISAR `2026-03-18 / 2026-04-11`.

| Kutu | Rol | 12g N / S1 (Fark, `cc0`) | 24g N / S1 (Fark, `cc0`) | N Kaybı | S1 Kaybı | ΔKayıp (`S1−N`) | (i) Fark ≥0,15 | (ii) ΔKayıp ≥0,10 | Durum |
|---|---|---|---|---|---|---|---|---|---|
| Zócalo (`ZOC`) | Şehir | 0,491 / 0,992 (−0,500, %0,4) | 0,639 / 0,989 (−0,350, %0,9) | −0,148 | +0,002 | +0,150 | — | — | Referans |
| Chalco tarlaları (`CHA`) | Tarım/sulak | 0,310 / 0,665 (−0,355, %5,8) | 0,187 / 0,471 (−0,284, %32,0) | +0,123 | +0,195 | +0,071 | Hayır | Hayır | **Geçemedi** |
| Xochimilco tarlaları (`XOC`)* | Tarım/sulak* | 0,641 / 0,923 (−0,282, %0,0) | 0,485 / 0,910 (−0,425, %0,4) | +0,156 | +0,013 | −0,143 | Hayır | Hayır | **Geçemedi** |
| Xoch.–Tláhuac sulak (`TLA`) | Tarım/sulak | 0,479 / 0,745 (−0,266, %6,2) | 0,314 / 0,738 (−0,424, %15,6) | +0,165 | +0,006 | −0,159 | Hayır | Hayır | **Geçemedi** |
| Santa Fe (`STF`) | Kaya | 0,438 / 0,946 (−0,509, %0,9) | 0,356 / 0,949 (−0,593, %7,6) | +0,082 | −0,003 | −0,085 | — | — | Referans |
| Orman (`FOR`, Ajusco) | Orman (%100) | 0,285 / 0,270 (+0,015, %4,0) | 0,097 / 0,477 (−0,380, %100,0) | +0,189 | −0,207 | −0,395 | — | — | Referans (`cc0=%100`) |

- **`desc-dry-24d` ölçütü:** `0/3` tarım/sulak kutusu geçti → **GEÇEMEDİ**.

### 3.2 `desc-rain-36d` (Track 113, Yağış, 12g → 36g | `S1−NISAR: −1/−1 gün`)
*12g referansı:* `mean(desc-rain-0609-0621, desc-rain-0901-0913)` | *36g çift:* S1D, orb 143, fr 526 (`2026-07-15 / 2026-08-20`) vs NISAR `2026-07-16 / 2026-08-21`.

| Kutu | Rol | 12g N / S1 (Fark, `cc0`) | 36g N / S1 (Fark, `cc0`) | N Kaybı | S1 Kaybı | ΔKayıp (`S1−N`) | (i) Fark ≥0,15 | (ii) ΔKayıp ≥0,10 | Durum |
|---|---|---|---|---|---|---|---|---|---|
| Zócalo (`ZOC`) | Şehir | 0,777 / 0,978 (−0,202, %0,2) | 0,746 / 0,982 (−0,235, %0,4) | +0,031 | −0,003 | −0,034 | — | — | Referans |
| Chalco tarlaları (`CHA`) | Tarım/sulak | 0,341 / 0,530 (−0,189, %3,3) | 0,206 / 0,215 (−0,009, %30,2) | +0,135 | +0,315 | **+0,180** | Hayır | **Evet** | **Geçemedi** |
| Xochimilco tarlaları (`XOC`)* | Tarım/sulak* | 0,590 / 0,896 (−0,306, %0,7) | 0,637 / 0,869 (−0,231, %0,0) | −0,047 | +0,028 | +0,075 | Hayır | Hayır | **Geçemedi** |
| Xoch.–Tláhuac sulak (`TLA`) | Tarım/sulak | 0,417 / 0,673 (−0,256, %14,9) | 0,357 / 0,423 (−0,065, %17,3) | +0,059 | +0,250 | **+0,191** | Hayır | **Evet** | **Geçemedi** |
| Santa Fe (`STF`) | Kaya | 0,459 / 0,868 (−0,409, %2,2) | 0,461 / 0,877 (−0,415, %0,4) | −0,002 | −0,009 | −0,007 | — | — | Referans |
| Orman (`FOR`, Ajusco) | Orman (%100) | 0,121 / 0,185 (−0,065, %83,1) | **0,411 / 0,200 (+0,212, %0,0)** | −0,291 | −0,014 | **+0,276** | *(+0,212)* | *(+0,276)* | Referans (L-band üstün) |

*Not — `desc-rain` 12g bileşenleri (`0609-0621` / `0901-0913`):* `ZOC` N `0,780 / 0,773`, S1 `0,982 / 0,975`; `CHA` N `0,338 / 0,343`, S1 `0,645 / 0,414`; `XOC` N `0,705 / 0,475`, S1 `0,875 / 0,917`; `TLA` N `0,495 / 0,338`, S1 `0,677 / 0,669`; `STF` N `0,528 / 0,391`, S1 `0,870 / 0,866`; `FOR` N `0,140 / 0,102` (`cc0 %66,2 / %100,0`), S1 `0,194 / 0,176`.

- **`desc-rain-36d` ölçütü:** `0/3` tarım/sulak kutusu geçti → **GEÇEMEDİ** (`CHA` ve `TLA`'da C-band kaybı çok daha büyük olduğu için koşul (ii) sağlandı, ancak 36g sonunda S1 hâlâ NISAR düzeyinde kaldığından koşul (i) sağlanmadı).

### 3.3 `asc-rain-24d` (Track 19, Yağış, 12g → 24g | `S1−NISAR: −4/−4 gün`)
*12g referansı:* `asc-rain-0523-0604` (S1C, orb 78, fr 55) | *24g çift:* S1C, orb 78, fr 55 (`2026-07-17 / 2026-08-10`) vs NISAR `2026-07-21 / 2026-08-14`.

| Kutu | Rol | 12g N / S1 (Fark, `cc0`) | 24g N / S1 (Fark, `cc0`) | N Kaybı | S1 Kaybı | ΔKayıp (`S1−N`) | (i) Fark ≥0,15 | (ii) ΔKayıp ≥0,10 | Durum |
|---|---|---|---|---|---|---|---|---|---|
| Zócalo (`ZOC`) | Şehir | 0,806 / N/A (N/A, %0,0) | 0,801 / N/A (N/A, %0,0) | +0,005 | N/A | N/A | — | — | S1 kapsam dışı |
| Chalco tarlaları (`CHA`) | Tarım/sulak | 0,452 / 0,639 (−0,187, %0,4) | 0,307 / 0,253 (**+0,054**, %4,9) | +0,145 | +0,386 | **+0,241** | Hayır | **Evet** | **Geçemedi** |
| Xochimilco tarlaları (`XOC`)* | Tarım/sulak* | 0,514 / 0,844 (−0,330, %0,0) | 0,452 / 0,655 (−0,203, %0,0) | +0,062 | +0,189 | **+0,127** | Hayır | **Evet** | **Geçemedi** |
| Xoch.–Tláhuac sulak (`TLA`) | Tarım/sulak | 0,338 / 0,638 (−0,300, %15,6) | 0,299 / 0,309 (−0,010, %30,2) | +0,039 | +0,329 | **+0,290** | Hayır | **Evet** | **Geçemedi** |
| Santa Fe (`STF`) | Kaya | 0,715 / N/A (N/A, %0,0) | 0,702 / N/A (N/A, %0,4) | +0,013 | N/A | N/A | — | — | S1 kapsam dışı |
| Orman (`FOR`, Ajusco) | Orman (%100) | 0,459 / 0,189 (+0,270, %0,0) | **0,549 / 0,192 (+0,357, %0,0)** | −0,090 | −0,003 | +0,087 | *(+0,357)* | *(+0,087)* | Referans (L-band üstün) |

- **`asc-rain-24d` ölçütü:** `0/3` tarım/sulak kutusu geçti → **GEÇEMEDİ** (Üç tarım/sulak kutusunun üçünde de C-band kaybı L-band'dan `0,127–0,290` daha büyük olduğu için koşul (ii) geçti; ancak `CHA` `+0,054` ile en fazla yaklaştı, `≥ 0,15` eşiğine ulaşamadı).

\* `Xochimilco tarlaları` (`XOC`) ESA WorldCover 2021'de %49,5 ağaç + %46,5 yapılaşma (%0 tarım) içerdiğinden "arazi örtüsü tanıma uymuyor" olarak işaretlidir.

---

## 4. Genel Hüküm ve Fiziksel Yorum

- **Önceden kayıtlı ölçüt sonucu:** **DOĞRULANMADI (`0/3` çift geçti).**
- **Neden başarısız oldu — ama veride ne değişti?**
  1. **Zamansal bozunma hızı gerçekten C-band aleyhine:** Yağışlı mevsimdeki iki uzun çiftte (`desc-rain-36d` ve `asc-rain-24d`), gerçek tarım/sulak kutuları olan `CHA` ve `TLA`'da Sentinel-1'in tutarlılık kaybı (`0,250–0,386`) NISAR'ın kaybından (`0,039–0,145`) açık ara daha yüksektir (`S1_kayıp − NISAR_kayıp = +0,180` ile `+0,290`). Yani **koşul (ii) 5/6 yağışlı tarım/sulak değerlendirmesinde sağlanmıştır**.
  2. **Başlangıç farkı (ürün işleme etkisi) farkı kapatmaya yetmedi:** Sentinel-1 HyP3 `_corr.tif` ürünü `20×4` bakış ve `adf` (`α = 0,6`) uyarlamalı süzgeci nedeniyle 12 günde `0,53–0,92` gibi yüksek bir taban tutarlılığıyla başlamaktadır. 24–36 gün sonunda S1 hızla düşse bile ancak NISAR düzeyine (`0,215–0,423`) inmiş, bu yüzden **koşul (i) `NISAR − S1 ≥ 0,15`** hiçbir tarım/sulak kutusunda sağlanamamıştır (en iyi değer `asc-rain-24d` `CHA`'da `+0,054`).
  3. **Kurak mevsimde (`desc-dry-24d`) tersine durum:** `CHA` ve `TLA`'da NISAR `24` günde (`0,187` ve `0,314`, `cc0` %32,0 ve %15,6) S1'e (`0,471` ve `0,738`) göre daha düşük kalmıştır. Ayrıca `desc-dry-24d` S1 çiftinin S1C/frame 527 olması (`12g` S1D/frame 528) unutulmamalıdır.
  4. **Bağımsız `Orman` (`FOR`, %100 Ağaç örtüsü) kutusunda beklenen L-band üstünlüğü:** Tutarlılık görülmeden seçilen yoğun orman kutusunda, yağışlı mevsimin her iki uzun çiftinde de NISAR L-band açık farkla üstündür: `desc-rain-36d`'de **`0,411 vs 0,200` (`+0,212`, kayıp farkı `+0,276`)** ve `asc-rain-24d`'de **`0,549 vs 0,192` (`+0,357`)** (S1 zaten 12 günde `~0,19` gürültü tabanına inmiş durumdadır). Buna karşılık `desc-dry-24d` (`0318_0411`) ve yağışlı `12g` çiftlerinde NISAR `FOR` kutusunda `cc == 0` maskesinin %66–%100'e çıkması, L2 provisional GUNW faz açma maskesinin bu kutuyu yer yer tamamen sıfırladığını göstermektedir.

---

## 5. 12 Günlük Test ile Yan Yana Özet (`l-vs-c-raporu.md` vs `c-band-zaman.md`)

| Özellik / Bulgu | 12 Günlük Test (`docs/arsiv/l-vs-c-raporu.md` / `l_vs_c_coherence.json`) | Uzun Zaman Bazı Testi (`docs/arsiv/c-band-zaman.md` / `l_vs_c_baseline.json`) |
|---|---|---|
| **Çift sayısı & zaman bazı** | 5 çift (tümü 12 gün; Track 113 & 19, kurak & yağış) | 3 çift (`24g` kurak Track 113, `36g` yağış Track 113, `24g` yağış Track 19) + mevsim/yörünge eşli 12g referanslar |
| **Kutular** | 5 sabit 15×15 kutu (`ZOC`, `CHA`, `XOC*`, `TLA`, `STF`) | Aynı 5 kutu + bağımsız WorldCover 2021 **%100 ağaç örtüsü `FOR`** kutusu (toplam 6 kutu) |
| **Ön kayıtlı ölçüt** | Tarım/sulak ≥2/3 kutuda `(NISAR − S1) ≥ 0,15`; ≥4/5 çift | Tarım/sulak ≥2/3 kutuda `(NISAR − S1) ≥ 0,15` **VE** `(S1_kayıp − NISAR_kayıp) ≥ 0,10` (ikisi de `<0,20` hariç); 3/3 → doğrulandı, 2/3 → kısmen |
| **Genel Sonuç** | **DOĞRULANMADI (`0/5` çift)** | **DOĞRULANMADI (`0/3` çift)** |
| **Tarım/sulak fark aralığı (`NISAR − S1`)** | `−0,443` ile `−0,071` arası (tümünde S1 > NISAR) | Kurakta `−0,425` ile `−0,284`; yağışta **`−0,231` ile `+0,054`** (aralık ciddi biçimde kapandı) |
| **Zamanla kayıp (12g → 24/36g)** | Test edilmedi (sabit 12g) | Yağışlı `CHA` ve `TLA`'da S1 `0,25–0,39` kaybederken NISAR `0,04–0,14` kaybetti (`ΔKayıp = +0,18 / +0,29`) |
| **Orman (`FOR`) bulgusu** | Ölçülmedi (yalnızca görsel olarak GB dağlarda L > C not edildi) | Yağışta L-band net üstün (`+0,212` @36g, `+0,357` @24g); kurak 24g ve 12g yağışlı bazı çiftlerde NISAR `cc0=%66–100` |
| **Ana çıkarım** | 12 günde `20×4` + `adf` süzgeçli S1 tüm tarım/şehir kutularında NISAR'dan yüksek | S1 yağışlı tarım/sulakta gerçekten çok daha hızlı bozunuyor; ancak yüksek 12g tabanı nedeniyle 24–36 günde yalnızca NISAR'ın seviyesine iniyor. L-band avantajı asıl **yoğun kapalı ormanda (`FOR`)** ölçülüyor. |

*Görsel:* [`docs/arsiv/l-vs-c/l_vs_c_baseline.png`](l-vs-c/l_vs_c_baseline.png)
