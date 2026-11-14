# Görev promptu: Yağız'ın yapay zekâsı için

> Bu metnin tamamını yapay zekâna ver. Yanına `subsidence_yagiz_paketi.zip` dosyasını aç ve proje klasörünü göster.

---

Sen NASA Space Apps 2026 "Dancing with the SARs" yarışmasında bir ekibin bilim sorumlusunun asistanısın. Proje: **NISAR uydusunun L-band radarıyla Mexico City'de zemin çökmesini ölçmek ve bunu herkesin anlayacağı bir web sitesinde göstermek.** Proje klasörünü aç ve önce `HANDOFF.md` dosyasını baştan sona oku; veri, dosya formatları ve şimdiye kadarki sonuçlar orada. Sonra `docs/dogrulama.md`'yi oku.

Bütün belgeleri Türkçe yaz. Challenge cevapları ayrıca İngilizce de olacak.

## 1. Neden bu işler var? (bağlam)

**Durum:** Ekip gerçek NISAR verisinden Mexico City'nin 11 aylık dikey çökme haritasını üretti ve siteye bağladı. En hızlı bölgeler yılda 33–36 cm çöküyor, kaya zemin sabit. Bu, literatürle uyumlu.

**Sorun:** Mexico City'nin çöktüğü onlarca yıldır biliniyor. Jüri "bunu zaten biliyorduk, NISAR'ın katkısı ne?" diye sorabilir. Bu soruya cevap veremezsek proje "bilinen bir haritanın kopyası" olarak görülür.

**Çözüm:** NISAR'ın farkı **L-band** (dalga boyu yaklaşık 24 cm) olması. Sentinel-1 ise **C-band** (yaklaşık 5,6 cm) kullanıyor. Kısa dalga bitki örtüsüne çarpıp dağılıyor, bu yüzden tarla ve sulak alanlarda iki ölçüm arasındaki tutarlılık (coherence) bozuluyor ve çökme ölçülemiyor. Uzun dalga bitkinin içinden geçip zemine ulaşıyor. **Bunu veriyle göstermek, projenin "yenilik" iddiasının tek dayanağı.** O yüzden aşağıdaki 1. iş en önemlisi.

**Challenge ayrıca şunları soruyor:** Gördüğünüz değişimin fiziksel nedeni ne? Hangi polarizasyonlar onu öne çıkarıyor? NISAR gelecekte neleri mümkün kılacak? Jüri bu üç sorunun cevabını bekliyor. 3. iş bunun için.

## 2. Elindeki malzeme

- `backend/out/cache/113/*.npz` ve `backend/out/cache/19/*.npz`: her 12 günlük NISAR çiftinin Mexico City kesiti. Dosya adı `<ilk tarih>_<ikinci tarih>.npz`. İçinde `coh` = **NISAR tutarlılığı**, `x`, `y` = UTM 14N (EPSG:32614) metre koordinatları, 80 m piksel. Kesit kutusu: enlem 19,15–19,60, boylam −99,30 – −98,85.
- `backend/out/vertical.npz` ve `vertical.json`: dikey hız haritası. `web/public/data/cdmx/points.json`: 11 noktanın gerçek değerleri. **Güncel nokta değerleri burada; eski HANDOFF tablolarındaki Iztapalapa −3,5 ve Chalco −1,7 değerleri yanlış konumdan, kullanma.**
- `backend/out/c_band/jobs.json`: **ASF HyP3'te Sentinel-1 için daha önce sipariş edilmiş 5 interferogram.** Siparişler Yağız'ın Earthdata hesabında. **YENİ SİPARİŞ VERME**, bunları kullan:

| Ad | NISAR karşılığı | Mevsim | Sentinel-1 tarihleri |
|---|---|---|---|
| desc-dry-0422-0504 | track 113 | kurak | 22 Nis – 4 May 2026 |
| desc-rain-0609-0621 | track 113 | yağmurlu | 9 – 21 Haz 2026 |
| desc-rain-0901-0913 | track 113 | yağmurlu | 1 – 13 Eyl 2026 |
| asc-dry-0216-0228 | track 19 | kurak | 16 – 28 Şub 2026 |
| asc-rain-0523-0604 | track 19 | yağmurlu | 23 May – 4 Haz 2026 |

- `backend/l_vs_c_submit.py`: siparişleri veren script (tekrar çalıştırma). `backend/geo_util.py`: UTM ↔ enlem-boylam dönüşümü.
- `docs/dogrulama.md`: literatür karşılaştırmasının taslağı. **Büyük ölçüde hazır**; aşağıdaki 2. işte sadece kontrol ve tamamlama var.
- Earthdata token: `EARTHDATA_TOKEN` ortam değişkeninde olmalı. **Token'ı hiçbir dosyaya, loga veya ekrana yazma.**

## 3. Yapılacaklar

### İş 1: L-band / C-band tutarlılık karşılaştırması (en önemli)

**Amaç:** "NISAR, Sentinel-1'in sinyal kaybettiği tarla ve sulak alanlarda ölçmeye devam ediyor" iddiasını ölçülmüş sayılarla ve bir görselle kanıtlamak ya da çürütmek.

1. `hyp3_sdk` ile (token'la giriş) `jobs.json`'daki 5 işin durumuna bak. Başarılı olanların sadece **tutarlılık (`_corr.tif`)** dosyasını indir. Gerekirse küçük olduğu için `_vert_disp.tif` dosyasını da al. `backend/out/c_band/` içine koy.
   - **Neden sadece bunlar:** tam ürün paketleri büyük; karşılaştırma için tutarlılık yeterli.
   - **Başarısız iş varsa:** hatasını not et. Yeni sipariş verme; elindeki işlerle devam et.
2. GeoTIFF'leri NISAR kesitinin ızgarasına taşı: aynı UTM 14N koordinatları, 80 m. Önce dosyanın kendi koordinat sistemini kontrol et.
   - **Neden:** iki haritayı piksel piksel karşılaştırabilmek için aynı ızgarada olmaları gerekiyor.
   - **Teknik not:** bazı Windows bilgisayarlarda `pyproj` / `rasterio` / GDAL'ın DLL'leri uygulama denetimine takılıyor. Takılırsa `tifffile` ile oku ve dönüşüm için `geo_util.py`'yi kullan.
3. Her Sentinel-1 çifti için **aynı track'te ve tarihi en yakın NISAR çiftini** seç ve `coh` değerini al.
   - **Neden:** mevsim ve hava koşulu tutarlılığı etkiliyor. Adil bir karşılaştırma için aynı dönemi kıyaslamak gerekiyor.
4. Şu bölgelerde **ortanca tutarlılığı** hesapla. Önce haritaya bakıp bölgelerin gerçekten tanımına uyduğunu doğrula; uymuyorsa koordinatı düzelt ve kullandığın değeri yaz:
   - Yoğun şehir: Zócalo çevresi (19,433 / −99,133)
   - Chalco tarlaları (19,25 / −98,93 civarı)
   - Xochimilco tarlaları ve chinampa'lar (19,26 / −99,09 civarı)
   - Kaya zemin: Santa Fe (19,36 / −99,26)

   **Beklenen:** şehirde ikisi de yüksek. Tarlada NISAR belirgin şekilde yüksek, Sentinel-1 düşük. Yağmur mevsiminde (bitki büyürken) fark daha büyük.
5. **Dürüst ol.** Fark küçükse ya da yoksa bunu açıkça yaz. Yanlış bir iddia jürinin önünde projeyi daha çok zayıflatır.
6. Çıktılar:
   - `backend/out/l_vs_c_coherence.png`: her çift için NISAR | Sentinel-1 | fark, aynı renk ölçeğiyle; bölgeler işaretli.
   - `backend/out/l_vs_c_coherence.json`: çift, tarih, bölge, NISAR ortancası, Sentinel-1 ortancası.
   - `backend/l_vs_c.py`: indirilen dosyalardan bu çıktıları yeniden üreten script.
   - Sitenin paneli için tek bir öne çıkan çift seç (büyük ihtimalle yağmurlu bir çift) ve neden onu seçtiğini yaz.

### İş 2: Literatür doğrulamasını bitir

**Amaç:** "Sonuçlarımız doğru" iddiasını yayınlanmış çalışmalara dayandırmak.

1. `docs/dogrulama.md`'deki kaynakları ve sayıları kontrol et. Mümkünse DOI'den makalenin özetine bak. **Görmediğin bir sayıyı yazma, kaynak uydurma.**
2. Karşılaştırma tablosunu güncel nokta değerleriyle (`points.json`) yeniden yaz. Eski yanlış konum değerlerini tablodan çıkar.
3. Sitedeki grafikte "Sentinel-1'in uzun dönem hızı" diye kesikli bir çizgi var. Şu an boş (`s1_rate_cm_yr: null`). **Literatürde doğrudan bir noktaya bağlanabilen** Sentinel-1 hızı bulabildiğin noktalar için değer öner; örneğin Cigna ve Tapete 2021, Nezahualcóyotl için yaklaşık −38,7 cm/yıl veriyor. Her değerin kaynağını yaz. Bulamadığın noktayı `null` bırak.
   - **Neden:** grafikte "NISAR'ın 1 yıllık ölçümü ile Sentinel-1'in uzun dönem eğilimi örtüşüyor mu?" karşılaştırması gösteriliyor. Değer uydurursak yanlış bir örtüşme göstermiş oluruz.
4. **Mevsimsellik sorusu:** hızlı noktaların serilerinde Aralık–Şubat yavaş, Mart–Mayıs hızlı bir desen var (`points.json` > `series`). Literatürde Mexico City çökmesinin mevsimsel değişimi var mı, bak (Osmanoğlu 2011, GPS'te belirgin mevsimsellik bulmamış). Sonuç: bu desen gerçek bir mevsimsellik mi, yoksa atmosfer ya da iyonosfer artığı mı olabilir? Kısa bir paragraf yaz. **Kanıt yoksa "belirsiz" de.**

### İş 3: Challenge'ın üç sorusuna metin

**Amaç:** jürinin doğrudan aradığı cevaplar. Hem siteye hem slaytlara girecek.

`docs/challenge-cevaplari.md` dosyasına Türkçe ve İngilizce, her cevap 120–200 kelime, uzman olmayan birinin anlayacağı ama bilimsel olarak doğru bir dille yaz. **Sayılar bizim dosyalarımızdan ve iş 1'in sonucundan gelsin.**

1. **Fiziksel neden:** Kurutulmuş Texcoco gölünün kili, yeraltı suyu pompalandıkça sıkışıyor ve geri dönmüyor. Neden fiziksel (kil), tetikleyici insan (pompalama). Kanıt: kaya zemindeki noktalar (Santa Fe, Peñón Viejo, Ciudad Universitaria) yaklaşık 0. Radarın görmediği yerler de var: eski göl tabanında (havalimanı çevresi) tutarlılık kayboluyor, orada ölçüm yok. Bunu da açıkla.
2. **Hangi polarizasyon:** Çökmeyi ölçtüğümüz faz GUNW ürününün **HH** kanalından geliyor. HH sert yüzey ve binalara, HV ise hacimsel saçılmaya (bitki, orman) duyarlı. İş 1'in sonucunu buraya bağla: L-band / C-band farkı aslında frekans farkı, polarizasyon farkı değil; ikisini karıştırma.
3. **NISAR'ın geleceği:** 12 günlük tekrarla küresel çökme erken uyarısı, tarım havzalarında yeraltı suyu izleme (L-band'in tarlada ölçebilmesi sayesinde), altyapı riski (metro, boru hatları), deprem ve volkan deformasyonu, ücretsiz ve açık veri.

## 4. Kurallar

- `web/` klasörünü değiştirme. Siteye ne girmesi gerektiğini belgelerde yaz; siteyi Arda bağlayacak.
- `chain_test.py`, `decompose.py`, `export_web.py`, `probe_gunw.py` dosyalarını değiştirme. İçlerinden fonksiyon kullanabilirsin.
- HyP3'e yeni sipariş verme.
- Token'ı hiçbir yere yazma.
- git commit ya da push yapma.
- Bir adım takılırsa (giriş hatası, iş başarısız, DLL engeli) durumu `docs/c-band-durum.md`'ye yaz ve diğer işlere devam et.

## 5. Teslim

Bitince kısa bir özet yaz (en fazla 250 kelime):
- Her HyP3 işinin durumu.
- Bölge bölge L-band / C-band tutarlılık sayıları ve "L-band avantajı doğrulandı mı?" sorusuna net bir cevap.
- Önerdiğin Sentinel-1 nokta hızları ve kaynakları.
- Mevsimsellik hakkındaki sonuç.
- Oluşturduğun dosyaların listesi ve bitmeyen işler.

Dosyaları zip'leyip Arda'ya gönder: `backend/out/l_vs_c_coherence.*`, `backend/l_vs_c.py`, `docs/*.md` ve indirdiğin `c_band` dosyaları.
