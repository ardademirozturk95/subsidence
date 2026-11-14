# Literatür ile doğrulama: Mexico City zemin çökmesi

Bu belge, NISAR L-band (GUNW, provisional) sonucumuzu (`backend/out/vertical.json`, `vertical.npz`) yayımlanmış InSAR/GNSS değerleriyle karşılaştırır. Yalnızca arama sonuçlarında ve makale sayfalarında gerçekten görebildiğimiz sayılar yazıldı; görülmeyen değer için "bulunamadı" denmiştir. Birçok kaynakta yalnızca özete (abstract) erişebildik, tam metni okumadık. Sayıları kesin alıntı yapmadan önce DOI'den kontrol edin.

## 1. Bizim sonucumuz (özet)

- Veri: NISAR L2 GUNW provisional, descending track 113 + ascending track 19, Kas 2025 – Eki 2026 (yaklaşık 348 gün), LOS hızları dikey + doğu-batı bileşene ayrıldı.
- Haritanın en hızlı %1'lik kısmı: yılda **−31 cm** ve daha fazla (`_vertical_p1_p99`: −31,1 / +5,9).
- Nezahualcóyotl noktası: **−28,8 cm/yıl** dikey; Santa Fe (kaya, referans): +0,7.
- Havalimanı / eski Texcoco göl tabanı: sinyal kopuyor, maskeli (NaN). Bu bir veri sınırlaması, çökme yok demek değildir.

## 2. Literatürdeki değerler

| Kaynak | Sensör / dönem | Bulgu (yalnızca kaynakta görülen) |
|---|---|---|
| Cabral-Cano ve ark. 2008 | ERS 1996–2000, Envisat 2003–2005 + GPS | Güncel çökme **350 mm/yıl üzerinde**; en hızlı alan tarihî merkezden doğuya kaymış; sıkışan Kuvaterner göl kili ve silt ana kontrol |
| Osmanoğlu ve ark. 2011 | Envisat PS-InSAR, Oca 2004 – Tem 2006 | Azami yaklaşık **300 mm/yıl**; GPS ile uyum RMS 6,9 mm/yıl; GPS'te belirgin mevsimsel değişim yok |
| Chaussard ve ark. 2014 | ALOS L-band SBAS, 2007–2011 | Mexico City'de doğrusal dikey hız **30 cm/yıl üzeri** (başka şehirlerde 5–10 cm/yıl); ana neden: yeraltısuyu çekimi |
| Cigna ve Tapete 2021 | Sentinel-1 IW, 2014–2020 (300+ görüntü), 2017–2019 dikey hız | Zirve dikey hız **~38,7 cm/yıl Nezahualcóyotl**, **~39 cm/yıl Iztapalapa**, ~32 cm/yıl Gustavo A. Madero ve Venustiano Carranza; ana süreç akitard sıkışması |
| Chaussard ve ark. 2021 | 115 yıl nivelman + 24 yıl InSAR + 14 yıl GPS | Çökme en az 1950'den beri kabaca sabit hızda, hızlar **50 cm/yıl**'a kadar; yeraltısuyu seviyesi ile çökme hızı arasında doğrudan ilişki bulunmamış (özetten) |
| Solano-Rojas ve ark. 2024 | COSMO-SkyMed (X-band) + InSAR/GPS, Metro hattı | Mexico City'de en yüksek hızlar Peñón de los Baños'un doğusunda ve **Chalco'da (>350 mm/yıl, dönem belirtilmemiş)**; Metro yüzey bölümlerinde 0–310 mm/yıl; Peñón de los Baños ~0 (sabit); genel olarak "500 mm/yıl'a kadar" ifadesi (bölgeye bağlanmamış) |

Xochimilco, tarihî merkez (Zócalo), havalimanı/Texcoco için bu aramalarda **sayısal bir değer bulamadık**. Bu bölgeler için literatür karşılaştırması nitel kalıyor.

## 3. Karşılaştırma

| Bölge | Bizim değerimiz (dikey, cm/yıl)* | Literatür | Değerlendirme |
|---|---|---|---|
| Nezahualcóyotl | −28,8 (nokta); komşu pikseller −27,8 | −38,7 (Sentinel-1, 2017–2019); 30+ (ALOS 2007–2011) | Aynı büyüklük sınıfında; bizimki biraz düşük. Olası nedenler: 80 m piksel ortalaması, tek yıllık (348 gün) pencere ve farklı dönem (fark yaklaşık %25) |
| Haritadaki en hızlı alan | −31 (en hızlı %1); yerel pikseller −39 ile −42 arasına çıkıyor (Tláhuac–Chalco kenarı) | 35–39 (Sentinel-1), 50'ye kadar (Chaussard 2021) | Uyumlu. −40 üzeri yerel değerler az sayıda piksele dayanıyor, doğrulanmadı |
| Chalco (haritadaki bölge) | −24 (19,25 / −98,93); −31 ile −42 (19,26 / −98,96…−98,97) | >35 (Solano-Rojas 2024, dönemsiz) | Uyumlu: Chalco çanağında hız 30–40 cm/yıl mertebesinde. Mevcut Chalco noktamız çanağın dışında olduğu için −1,7 çıktı |
| Iztapalapa | Nokta −3,5 (yanlış yerde); doğuya doğru çanak kısmı −16 | ~39 (zirve, Cigna ve Tapete 2021) | Nokta Santa Catarina volkanik sırtına yakın olduğundan karşılaştırma geçersiz; borough içinde çok değişken (%5–%95: −24,6 / +1,5) |
| Xochimilco | −11,9 (nokta); −15 (19,26 / −99,09); kuzey Tláhuac sınırında −25…−41 | Sayı bulunamadı | Karşılaştırılamadı |
| Zócalo / tarihî merkez | −11,8 | Sayı bulunamadı | Karşılaştırılamadı; Cabral-Cano 2008'e göre en hızlı alan merkezden doğuya kaymış, yani merkezde nispeten yavaş çökme beklenir (bizim sonuç bununla nitel olarak uyumlu) |
| Havalimanı / eski Texcoco | Maskeli (NaN) | Sayı bulunamadı | L-band'e rağmen koheransın düştüğü ıslak/tarım dokulu göl tabanı |
| Santa Fe, Sierra Santa Catarina, Peñón de los Baños | +0,7 (Santa Fe) | Peñón ≈ 0, Santa Catarina "kararlı" (Solano-Rojas 2024) | Sabit kaya beklendiği gibi ≈ 0 |

\* Değerler `vertical.json` ve `vertical.npz` üzerinden, 7×7 piksel (yaklaşık 560 m) medyanıdır; tek piksel gürültüsü bu yüzden azalır.

Genel sonuç: Sentinel-1 ve ALOS çalışmalarındaki zirve hızlar (30–39 cm/yıl) ile bizim en hızlı %1'imiz (−31 cm/yıl) aynı mertebede ve mekânsal desen (doğu ve güneydoğu çanakları, batıda kaya ≈ 0) literatürle tutarlıdır. Bizim değerlerin hafif düşük olması beklenen bir şey: 80 m'lik grid ve yalnızca 11 aylık zincir.

## 4. Önerilen nokta koordinatları

Haritanın dikey hız alanından (UTM 14N → enlem/boylam çevrimi `backend/geo_util.py`, 7×7 piksel medyan):

| Nokta | Eski | Önerilen | Dikey hız (cm/yıl) | Not |
|---|---|---|---|---|
| Chalco | eski nokta (−1,7 çıkıyordu, çanağın dışında) | **19,26 / −98,965** | −31 ile −42 | Çanağın merkezine yakın; hız gradyanı dik, ±5 cm/yıl yerel yayılım |
| Iztapalapa | −3,5 olan nokta | **19,35 / −99,04** | −16 | Iztapalapa boroughu karışık: Sierra Santa Catarina rock (−1…−3). Çanak kısmı doğuda ve Tláhuac sınırında |
| Xochimilco / Tláhuac | 19,26 / −99,09 (−15) | **19,27 / −99,03** (−29) veya 19,268 / −99,045 (−41) | −29…−41 | Tarım ve chinampa dokusu; yüksek değer, koheransın düşük olduğu alanlara yakın, güven daha düşük |
| Nezahualcóyotl | mevcut | 19,40 / −99,01 | −27,8 | Uygun |

**Güncelleme (ekipten düzeltilmiş noktalar, `backend/points_cdmx.json`):** Aragón −33,6; Nezahualcóyotl −28,8; Iztapalapa doğu ova (19,3564 / −99,0407) −23,7; Xochimilco–Tláhuac sulak alanı (19,2682 / −99,0392) −36,4; Chalco ovası (19,2453 / −98,9363) −35,7; Zócalo −11,8; Peñón Viejo −0,8; Ciudad Universitaria −0,4; Santa Fe +0,7 cm/yıl. Bu düzeltmeyle Chalco (−35,7) literatürdeki ">35 cm/yıl" ile (Solano-Rojas 2024), Iztapalapa (−23,7) ise Sentinel-1 zirvesi ~−39 ile (Cigna ve Tapete 2021; zirve tek bir yerdir, ova ortalaması düşük olabilir) aynı mertebeye geldi. Yukarıdaki tablodaki "eski nokta" değerleri tarihsel kayıt olarak bırakıldı.

Bu koordinatlar haritadan türetildi. Yayın öncesi, her nokta çevresindeki koherans ve bağlantılı bileşen (`cc`) maskesiyle bir kez daha kontrol edilmeli.

## 5. Kaynaklar

1. Cabral-Cano, E., Dixon, T. H., Miralles-Wilhelm, F., Díaz-Molina, O., Sánchez-Zamora, O., Carande, R. E. (2008). Space geodetic imaging of rapid ground subsidence in Mexico City. *Geological Society of America Bulletin*, 120(11–12), 1556–1566. DOI: 10.1130/B26001.1
2. Osmanoğlu, B., Dixon, T. H., Wdowinski, S., Cabral-Cano, E., Jiang, Y. (2011). Mexico City subsidence observed with persistent scatterer InSAR. *International Journal of Applied Earth Observation and Geoinformation*, 13(1), 1–12. DOI: 10.1016/j.jag.2010.05.009
3. Chaussard, E., Wdowinski, S., Cabral-Cano, E., Amelung, F. (2014). Land subsidence in central Mexico detected by ALOS InSAR time-series. *Remote Sensing of Environment*, 140, 94–106. DOI: 10.1016/j.rse.2013.08.038
4. Cigna, F., Tapete, D. (2021). Present-day land subsidence rates, surface faulting hazard and risk in Mexico City with 2014–2020 Sentinel-1 IW InSAR. *Remote Sensing of Environment*, 253, 112161. DOI: 10.1016/j.rse.2020.112161
5. Chaussard, E., Havazli, E., Fattahi, H., Cabral-Cano, E., Solano-Rojas, D. (2021). Over a century of sinking in Mexico City: No hope for significant elevation and storage capacity recovery. *Journal of Geophysical Research: Solid Earth*, 126(4), e2020JB020648. DOI: 10.1029/2020JB020648
6. Solano-Rojas, D., Wdowinski, S., Cabral-Cano, E., Osmanoğlu, B. (2024). Geohazard assessment of Mexico City's Metro system derived from SAR interferometry observations. *Scientific Reports*, 14, 6035. DOI: 10.1038/s41598-024-53525-y

## 6. Sınırlamalar

- Biz tek bir 348 günlük pencereden doğrusal hız uyduruyoruz; literatür çoğunlukla 3–13 yıllık ortalamalar. Mexico City'de zaman serisi yaklaşık doğrusal olduğu bildirildiği için karşılaştırma makul (Osmanoğlu 2011, Chaussard 2021), fakat yıl-yıl dalgalanmayı dışlayamayız.
- NISAR ürünleri provisional; kalibrasyon tamamlanmadı.
- Dikey ayrıştırma kuzey hareketini sıfır kabul eder.
- Bağımsız GNSS verisi bu çalışmada doğrudan alınmadı; GNSS ile doğrulama yalnızca literatürdeki GPS-InSAR uyumu (Osmanoğlu 2011) üzerinden dolaylıdır.
