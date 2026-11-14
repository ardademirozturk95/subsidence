# Eğim (Tilt) Hesaplama ve Doğrulama Ön-Kayıt Ölçütleri

**Zaman Damgası:** 2026-11-14 23:27+03:00  
**Durum:** Ön-kayıt (hesaplama öncesi sabitlenmiş parametreler)

## 1. Girdi Verisi
- **Kaynak:** `export_web.compute(Path("out")) -> R["vU"]`
- **Birim ve Projeksiyon:** cm/yıl (`cm/yr`), UTM 14N, 80 m piksel çözünürlüğü, `fill=rate`.

## 2. Yumuşatma (Smoothing)
- **Birincil parametre:** NaN-duyarlı normalize edilmiş Gauss konvolüsyonu, `sigma = 1` piksel (80 m).
- **Duyarlılık analizi:** `sigma = 0` (yumuşatmasız) ve `sigma = 2` (160 m) için de sonuçlar raporlanacaktır.

## 3. Türev ve Büyüklük Hesabı
- **Türev:** Merkezi fark `np.gradient(v, dy, dx)` ile `dx = 80`, `dy = -80` (m).
- **NaN kuralı:** Komşu piksellerden herhangi biri NaN ise merkez pikselin gradyanı NaN olarak bırakılır.
- **Büyüklük (Tilt oranı):**
  $$\beta = \frac{\sqrt{g_x^2 + g_y^2}}{100} \quad (\text{m/m/yıl})$$
  (vU cm/yıl olduğundan metre/yıl'a dönüştürmek için 100'e bölünür.)
- **Gösterim:** Binde/yıl (`‰/yr`) ve `"1/X yr^-1"` biçiminde sunulur.

## 4. Renk Eşikleri ve Gürültü Tabanı Kontrolü
- **Şeffaf:** `< 1/5000 yr^-1` (`< 0.0002 m/m/yr`, `< 0.2 ‰/yr`)
- **Sarı:** `1/5000 – 1/2000 yr^-1`
- **Turuncu:** `1/2000 – 1/1000 yr^-1`
- **Kırmızı:** `>= 1/1000 yr^-1` (`>= 0.001 m/m/yr`, `>= 1.0 ‰/yr`)
- **Gürültü Tabanı (Noise Floor) Kontrolü:** Santa Fe referans/taban medyan değeri alt eşiğin (`1/5000 yr^-1`) altında kalmalıdır. Kalmazsa yalnızca alt eşik gürültü tabanına yükseltilir ve bu değişiklik açıkça belgelenir.

## 5. Nokta Değerleri
- Her nokta için `7x7` piksel medyanı kullanılır (`export_web` ile uyumlu).

## 6. Jeoteknik Bölgeleme Doğrulama Ölçütü
- **Referans Veri:** CDMX *Normas Técnicas Complementarias* jeoteknik bölgeleme katmanı:
  - **Zona I:** Lomas
  - **Zona II:** Transición
  - **Zona III:** Lacustre
- **Karar Kuralı:**
  - Zona II medyan $\beta \ge 1.5 \times$ Zona III medyan $\beta$ **VE** Zona II medyan $\beta \ge 1.5 \times$ Zona I medyan $\beta$ ise $\rightarrow$ **`"doğrulandı"`**
  - Koşullardan yalnızca biri sağlanıyorsa $\rightarrow$ **`"kısmen"`**
  - Hiçbiri sağlanmıyorsa $\rightarrow$ **`"doğrulanmadı"`**
- **Yedek Plan (Fallback):** Resmi bölgeleme verisi indirilemezse Copernicus GLO-30 DEM eğim `> 5°` + `1 km` tampon alanı `"geçiş"` zonu olarak tanımlanır ve doğrulama **`"zayıf kanıt"`** etiketiyle raporlanır.

## 7. Ek Tutarlılık Kontrolü (Track Bağımsızlığı)
- Track 113 ve Track 19 LOS hız alanları üzerinde ayrı ayrı gradyan hesaplanır.
- İki track arasındaki en yüksek %1'lik (`top-1%`) eğim piksellerinin **Jaccard örtüşme oranı** raporlanır.
