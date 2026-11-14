# Literatür ile doğrulama: Mexico City zemin çökmesi

Bu belge, NISAR L-band (GUNW, provisional) dikey hız ve zaman serisi sonucumuzu (`web/public/data/regions.json`, `web/public/data/cdmx/points.json`, `backend/out/vertical.npz`) yayımlanmış InSAR/GNSS çalışmalarıyla karşılaştırır. Yalnızca doğrudan erişilebilen makale özetlerinde ve literatür kayıtlarında görülen sayılar kullanılmıştır; görülmeyen değerler için "bulunamadı" / `null` denmiştir.

## 1. Bizim sonucumuz (özet)

- **Veri ve dönem:** NISAR L2 GUNW provisional, descending track 113 + ascending track 19. Bireysel track hızları 348 günlük (Kasım 2025 – Ekim 2026) pencereden, birleşik dikey zaman serisi (`points.json`, `regions.json`) ise track 19 tarih ekseninde **2025-11-11 → 2026-10-13 (336 gün, 28 tarih)** arasından hesaplanmıştır.
- **Haritanın en hızlı %1'lik kısmı:** **−32,9 cm/yıl** (`web/public/data/regions.json`, 336 gün). Önceki `vertical.npz` çıktısında (`−31,1 cm/yıl`, 348 gün) eksik/maskelenen çiftler 0 hareket sayılırken, güncel arayüz serisinde eksik çiftler pikselin kendi ortalama hızıyla doldurulduğu için en hızlı %1 değeri −31,1'den −32,9 cm/yıl'a güncellenmiştir (`HANDOFF.md` Bölüm 8).
- **Güncel en hızlı noktalar (`points.json`):** Xochimilco–Tláhuac sulak alanı **−36,4 cm/yıl**, Chalco ovası **−35,7 cm/yıl**, Aragón **−33,6 cm/yıl**, Nezahualcóyotl **−28,8 cm/yıl**, Iztapalapa (doğu ova) **−23,7 cm/yıl**.
- **Kaya kontrolleri ve referans:** Santa Fe (referans) **+0,7 cm/yıl**; bağımsız kaya kontrolleri Ciudad Universitaria **−0,4 cm/yıl** ve Peñón Viejo **−0,8 cm/yıl**.
- **Havalimanı / eski Texcoco göl tabanı:** Sinyal kopuyor, maskeli (NaN). Bu bir veri sınırlamasıdır, çökme yok demek değildir.

## 2. Literatürdeki değerler

| Kaynak | Sensör / dönem | Bulgu (yalnızca kaynakta görülen) |
|---|---|---|
| Cabral-Cano ve ark. 2008 | ERS 1996–2000, Envisat 2003–2005 + GPS | Güncel çökme **350 mm/yıl üzerinde**; en hızlı alan tarihî merkezden doğuya kaymış; sıkışan Kuvaterner göl kili ve silt ana kontrol |
| Osmanoğlu ve ark. 2011 | Envisat PS-InSAR, Oca 2004 – Tem 2006 | Azami yaklaşık **300 mm/yıl**; GPS ile uyum RMS 6,9 mm/yıl; **GPS verilerinde belirgin mevsimsel değişim yok** |
| Chaussard ve ark. 2014 | ALOS L-band SBAS, 2007–2011 | Mexico City'de doğrusal dikey hız **30 cm/yıl üzeri** (başka şehirlerde 5–10 cm/yıl); ana neden yeraltı suyu çekimi |
| Cigna ve Tapete 2021 | Sentinel-1 IW, 2014–2020 (300+ görüntü), 2017–2019 dikey hız | Zirve dikey hız **−38,7 cm/yıl Nezahualcóyotl**, **−39,1 cm/yıl Iztapalapa**, **~−32,0 cm/yıl Gustavo A. Madero ve Venustiano Carranza**; Metropolitan Katedrali (Zócalo yanı) **−7,0 ile −8,8 cm/yıl** arası; ana süreç akitard sıkışması |
| Chaussard ve ark. 2021 | 115 yıl nivelman + 24 yıl InSAR + 14 yıl GPS | Çökme en az 1950'den beri kabaca sabit hızda, hızlar **50 cm/yıl**'a kadar (elastik geri dönüş neredeyse yok); yeraltı suyu seviyesi/pompalama hızı ile doğrudan ilişki bulunmamış, hız üst akitard kalınlığıyla güçlü ilişkili |
| Solano-Rojas ve ark. 2024 | COSMO-SkyMed (X-band) + InSAR/GPS, Metro hattı | En yüksek hızlar Peñón de los Baños'un doğusunda ve **Chalco'da (>350 mm/yıl)**; genel olarak 500 mm/yıl'a kadar; Peñón de los Baños ≈ 0 (sabit kaya) |

Xochimilco tarım alanı/çanak kenarı, Bağımsızlık Anıtı, Aragón noktası ve havalimanı/Texcoco için bu kaynaklarda doğrudan noktaya bağlı sayısal değer bulunamamıştır.

## 3. Karşılaştırma (güncel `points.json` değerleriyle)

Aşağıdaki değerler `web/public/data/cdmx/points.json` dosyasındaki güncel konumlardan alınmıştır (7×7 piksel / 560 m medyan).

| Nokta (`id`) | Koordinat | Bizim dikey hız (cm/yıl) | Literatür | Değerlendirme |
|---|---|---|---|---|
| Xochimilco–Tláhuac sulak alanı (`tlaxialtemalco`) | 19,2682 / −99,0392 | **−36,4** | Bölge/havza geneli >30 (Chaussard 2014), 35–39 zirveler (Cigna ve Tapete 2021) | Haritadaki en hızlı nokta; güney çanağın merkezi, literatürdeki zirve aralığıyla uyumlu |
| Chalco ovası (`chalco`) | 19,2453 / −98,9363 | **−35,7** | **>35 cm/yıl** (Solano-Rojas 2024, X-band/GPS, Chalco) | Doğrudan uyumlu |
| Aragón (`aragon`) | 19,4716 / −99,0575 | **−33,6** | **~−32,0 cm/yıl** (Cigna ve Tapete 2021, Gustavo A. Madero ilçe zirvesi) | Büyüklük sınıfı uyumlu; nokta maskeli göl tabanı kenarında ve track 113'te 1 eksik çift var (`HANDOFF.md` §8), dolayısıyla birkaç cm/yıl daha belirsiz |
| Nezahualcóyotl (`neza`) | 19,4000 / −99,0150 | **−28,8** | **−38,7 cm/yıl** (Cigna ve Tapete 2021, Sentinel-1); **>30 cm/yıl** (ALOS) | Aynı büyüklük sınıfında, yaklaşık %25 daha düşük. Olası nedenler: 80 m piksel ve 560 m medyan ortalaması, tek yıllık (336/348 gün) pencere, farklı dönem (2017–2019 vs 2025–2026) ve **maskelenen çiftlerin zincirde 0 hareket sayılmasının hızları küçültmesi (`HANDOFF.md` Bilinen sorunlar)** |
| Iztapalapa doğu ova (`iztapalapa`) | 19,3564 / −99,0407 | **−23,7** | **−39,1 cm/yıl** (Cigna ve Tapete 2021, Iztapalapa KD zirvesi) | Doğru ovaya taşındı; literatür değeri tüm ilçedeki en yüksek yerel zirve iken bizimki ova içi tek noktadır |
| Xochimilco çanak kenarı (`xochimilco`) | 19,2620 / −99,1000 | **−11,9** | Doğrudan nokta sayısı bulunamadı | Güney çanağın batı kenarı; merkeze göre daha yavaş olması fiziksel olarak tutarlı |
| Zócalo tarihî merkez (`zocalo`) | 19,4330 / −99,1330 | **−11,8** | **−7,0 ile −8,8 cm/yıl** (Cigna ve Tapete 2021, Metropolitan Katedrali) | Merkezden doğuya kayan çökme nedeniyle merkezde daha ılımlı hız beklenir (Cabral-Cano 2008); Katedral hızıyla aynı mertebede |
| Bağımsızlık Anıtı (`angel`) | 19,4270 / −99,1680 | **−5,2** | Doğrudan nokta sayısı bulunamadı | Çanağın batı kenarında kademeli azalma ile tutarlı |
| Peñón Viejo (`penon`) | 19,3786 / −99,0300 | **−0,8** | Peñón de los Baños ≈ 0, sabit kaya (Solano-Rojas 2024) | Çöken ovanın ortasındaki volkanik kaya adası ≈ 0; bağımsız doğrulama |
| Ciudad Universitaria (`cu`) | 19,3320 / −99,1870 | **−0,4** | Bazalt/lav kaya zemini | Bağımsız kaya kontrolü ≈ 0 |
| Santa Fe (`santafe`) | 19,3600 / −99,2600 | **+0,7** | Havza dışı kaya (referans) | Referans zemin ≈ 0 |
| Havalimanı / eski Texcoco | — | Maskeli (NaN) | Sayı bulunamadı | Eski göl tabanında koherans kaybı |

Genel sonuç: Haritanın en hızlı %1'i (**−32,9 cm/yıl**) ve güney/kuzey çanak zirveleri (**−33,6 ile −36,4 cm/yıl**) literatürdeki 30–39 cm/yıl aralığıyla uyumludur; üç ayrı kaya noktası (~0) da referanslama ve ayrıştırmayı doğrulamaktadır.

## 4. Önerilen Sentinel-1 uzun dönem hızları (`s1_rate_cm_yr`)

`points.json` şemasındaki `s1_rate_cm_yr` alanı, yalnızca yayımlanmış Sentinel-1 çalışmalarında doğrudan noktaya bağlanabilen hızlar için doldurulmalıdır; eşleşmeyen noktalar `null` bırakılmıştır:

| Nokta (`id`) | Önerilen `s1_rate_cm_yr` | Kaynak ve gerekçe |
|---|---|---|
| `neza` | **−38,7** | Cigna ve Tapete (2021): 2017–2019 Sentinel-1 IW dikey hız haritasında Nezahualcóyotl için verilen hız (~−38,7 cm/yıl). |
| `zocalo` | **null** *(isteğe bağlı alternatif: −8,8)* | Cigna ve Tapete (2021) Zócalo yanındaki Metropolitan Katedrali için −7,0 ile −8,8 cm/yıl aralığı vermektedir. Tek bir nokta sayısı yerine aralık verildiği ve yapı ölçeğinde olduğu için `null` bırakılması daha güvenlidir; tek değer gerekiyorsa üst sınır olan −8,8 kaynak notuyla kullanılabilir. |
| `aragon` | **null** | Cigna ve Tapete (2021) Gustavo A. Madero ve Venustiano Carranza ilçeleri için ilçe zirvesi ~−32,0 cm/yıl vermektedir; ancak doğrudan Aragón koordinatına bağlı nokta değeri olmadığı için `null` bırakılır. |
| `iztapalapa` | **null** | Cigna ve Tapete (2021) Iztapalapa kuzeydoğusu için zirve −39,1 cm/yıl verir; bizim nokta ovadaki başka bir konumdur, doğrudan eşleşme olmadığı için `null` bırakılır. |
| `tlaxialtemalco`, `chalco`, `xochimilco`, `angel`, `penon`, `cu`, `santafe` | **null** | Bu koordinatlar için doğrudan noktaya bağlı Sentinel-1 hızı literatürde bulunamadı (Chalco için >35 cm/yıl değeri Solano-Rojas 2024'te COSMO-SkyMed X-band + GPS/InSAR kaynaklıdır). |

## 5. Mevsimsellik analizi (`points.json` zaman serileri)

`web/public/data/cdmx/points.json` serilerinde hızlı çöken tüm noktalarda **Aralık–Şubat arası yavaşlama**, **Mart–Mayıs arası hızlanma** göze çarpmaktadır (2025-12-05 → 2026-02-27 ile 2026-02-27 → 2026-05-22 pencereleri karşılaştırıldığında):

- `chalco`: Ara–Şub **−15,0 cm/yıl** (−4,03 cm) → Mar–May **−52,8 cm/yıl** (−12,55 cm)
- `tlaxialtemalco`: Ara–Şub **−22,6 cm/yıl** (−5,06 cm) → Mar–May **−49,8 cm/yıl** (−11,68 cm)
- `aragon`: Ara–Şub **−17,0 cm/yıl** (−3,42 cm) → Mar–May **−52,6 cm/yıl** (−11,93 cm)
- `neza`: Ara–Şub **−18,4 cm/yıl** (−4,24 cm) → Mar–May **−39,7 cm/yıl** (−9,06 cm)

Ancak **aynı pencerede sabit kaya kontrol noktalarında da** benzer büyüklükte ve eşzamanlı bir salınım vardır:
- `penon` (volkanik kaya): Ara–Şub **+16,1 cm/yıl** (+4,09 cm yükselme) → Mar–May **−8,8 cm/yıl** (−1,94 cm alçalma)
- `cu` (lav zemini): Ara–Şub **+7,4 cm/yıl** (+1,61 cm) → Mar–May **−5,9 cm/yıl** (−1,56 cm)
- `santafe` (referans): Ara–Şub **0,0 cm/yıl** (−0,02 cm) → Mar–May **+2,6 cm/yıl** (+0,63 cm)

**Değerlendirme:** Sabit volkanik kaya zeminde (~4 cm'lik kış yükselmesi ve ardından ~2 cm'lik bahar alçalması biçiminde) gerçek elastik yer hareketi beklenmez. Ayrıca Osmanoğlu ve ark. (2011) GPS düşey verilerinde yağmurlu/kurak mevsimlerle ilişkili **belirgin bir mevsimsel değişim bulmamıştır**; Chaussard ve ark. (2021) da çökmenin elastik geri dönüş olmaksızın neredeyse doğrusal ilerlediğini göstermiştir. Bizim serilerimiz tek bir 336 günlük pencereye dayanmakta ve `HANDOFF.md`'de belirtildiği gibi **troposfer düzeltmesi içermemektedir** (`--corr none`, çift başına 1–2 cm havza geneli atmosfer saçılımı + bağımsız iyonosfer artığı). Dolayısıyla Aralık–Şubat yavaşlaması ile Mart–Mayıs hızlanmasının gerçek bir mevsimsel çökme değişimi olduğuna dair **kanıt yoktur (belirsiz)**; kaya kontrollerindeki eşzamanlı salınım bunun büyük olasılıkla **atmosfer ve/veya iyonosfer artığı** olduğunu düşündürmektedir.

## 6. Kaynaklar

1. Cabral-Cano, E., Dixon, T. H., Miralles-Wilhelm, F., Díaz-Molina, O., Sánchez-Zamora, O., Carande, R. E. (2008). Space geodetic imaging of rapid ground subsidence in Mexico City. *Geological Society of America Bulletin*, 120(11–12), 1556–1566. DOI: 10.1130/B26001.1
2. Osmanoğlu, B., Dixon, T. H., Wdowinski, S., Cabral-Cano, E., Jiang, Y. (2011). Mexico City subsidence observed with persistent scatterer InSAR. *International Journal of Applied Earth Observation and Geoinformation*, 13(1), 1–12. DOI: 10.1016/j.jag.2010.05.009
3. Chaussard, E., Wdowinski, S., Cabral-Cano, E., Amelung, F. (2014). Land subsidence in central Mexico detected by ALOS InSAR time-series. *Remote Sensing of Environment*, 140, 94–106. DOI: 10.1016/j.rse.2013.08.038
4. Cigna, F., Tapete, D. (2021). Present-day land subsidence rates, surface faulting hazard and risk in Mexico City with 2014–2020 Sentinel-1 IW InSAR. *Remote Sensing of Environment*, 253, 112161. DOI: 10.1016/j.rse.2020.112161
5. Chaussard, E., Havazli, E., Fattahi, H., Cabral-Cano, E., Solano-Rojas, D. (2021). Over a century of sinking in Mexico City: No hope for significant elevation and storage capacity recovery. *Journal of Geophysical Research: Solid Earth*, 126(4), e2020JB020648. DOI: 10.1029/2020JB020648
6. Solano-Rojas, D., Wdowinski, S., Cabral-Cano, E., Osmanoğlu, B. (2024). Geohazard assessment of Mexico City's Metro system derived from SAR interferometry observations. *Scientific Reports*, 14, 6035. DOI: 10.1038/s41598-024-53525-y

## 7. Sınırlamalar

- Bireysel track hızları tek bir 348 günlük pencereden, dikey seri ise 336 günlük ortak pencereden uydurulmuştur; literatür çoğunlukla 3–13 yıllık ortalamalar sunar.
- NISAR ürünleri provisional aşamasındadır; kalibrasyon tamamlanmamıştır.
- Dikey ayrıştırma kuzey-güney hareketini sıfır kabul eder.
- Bağımsız GNSS verisi bu çalışmada doğrudan alınmamıştır; GNSS ile doğrulama yalnızca literatürdeki GPS-InSAR uyumu (Osmanoğlu 2011) üzerinden dolaylıdır.
