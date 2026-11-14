# L-band (NISAR) / C-band (Sentinel-1) Tutarlılık Karşılaştırması

Bu rapor İş 1 kapsamında `backend/l_vs_c.py` tarafından `backend/out/l_vs_c_coherence.json` ve `backend/out/l_vs_c_coherence.png` dosyalarına üretilen sonuçları özetler.

## 1. Karşılaştırılabilirlik ve Yöntem

| Özellik | NISAR L2 GUNW (Provisional) | Sentinel-1 IW (ASF HyP3 / GAMMA) |
|---|---|---|
| Dalga boyu / Bant | ~23,84 cm (L-band, HH) | ~5,6 cm (C-band, VV) |
| Piksel boyutu / Izgara | 80 m × 80 m (EPSG:32614) | 80 m × 80 m (EPSG:32614, NISAR ızgarasına bilineer örneklendi) |
| Bakış sayısı (range × azimuth) | **13 × 16** (208 bakış, HDF5 `unwrappedInterferogram/frequencyA` üstverisinden) | **20 × 4** (80 bakış, HyP3 ürün `.txt` dosyasından) |
| Faz süzgeci | Provisional L2 GUNW ürünü (`coherenceMagnitude`) | GAMMA `adf` uyarlamalı faz süzgeci (α = 0,6) |
| Eksik/maskeli piksel işlemi | Kutudaki **tüm pikseller** dahil (`cc == 0` atılmadı) | Swath dışı `nodata = 0` → `NaN` |

- Tüm 5 HyP3 siparişi (`backend/out/c_band/jobs.json`) `SUCCEEDED` durumundaydı; yeni sipariş verilmedi.
- Bölgeler sabit 15×15 piksel (1,2 km × 1,2 km) karelerdir.
- Geçme ölçütü sonuçlardan önce sabitlendi: üç tarım/sulak alan kutusunun (`chalco`, `xochimilco_fields`, `tlaxialtemalco`) en az ikisinde ortanca fark `(NISAR − Sentinel-1) ≥ 0,15` ise çift "L-band üstün"; 5 çiftin ≥4'ünde sağlanırsa **doğrulandı**, 2–3'ünde **kısmen**, <2'sinde **doğrulanmadı**.

## 2. Sabit Kutular ve Bağımsız Arazi Örtüsü Kontrolü (ESA WorldCover 2021 v200, 10 m)

| Kutu | Koordinat | ESA WorldCover 2021 Dağılımı | Değerlendirme |
|---|---|---|---|
| Zócalo (şehir) | 19,433 / −99,133 | Yapılaşma %92,6; Çıplak/seyrek %6,1; Ağaç %1,2 | Tanıma uyuyor |
| Chalco tarlaları | 19,2453 / −98,9363 | Çayır/otlak %42,3; Tarım %39,5; Ağaç %5,9; Yapılaşma %4,3; Çalılık %4,0; Su %1,9 | Tanıma uyuyor |
| Xochimilco tarlaları | 19,26 / −99,09 | Ağaç %49,5; Yapılaşma %46,5; Çıplak %2,9 (Tarım %0) | **Arazi örtüsü tanıma uymuyor** (yaklaşık yarısı yapılaşmış + ağaçlık kentsel chinampa sınırı; kural gereği kutu taşınmadı) |
| Xochimilco–Tláhuac sulak alanı | 19,2682 / −99,0392 | Ağaç %52,2; Yapılaşma %23,6; Çalılık %13,3; Çayır %4,5; Su %2,5; Tarım %2,5 | Sulak/ağaçlık chinampa dokusu (%75+ doğal/tarımsal örtü) |
| Santa Fe (kaya) | 19,36 / −99,26 | Yapılaşma %55,4; Ağaç %30,3; Çayır %7,1; Tarım %4,2; Çalılık %2,3 | Batı yamacı kaya zemin |

## 3. Çift Çift Sonuçlar (15×15 piksel medyan tutarlılık ve `cc == 0` oranı)

| Çift (mevsim, track) | Zócalo (NISAR / S1 / Fark / cc=0) | Chalco tarlaları | Xochimilco tarlaları* | Xoch.–Tláhuac sulak alanı | Santa Fe (kaya) | Ölçüt (≥0,15) |
|---|---|---|---|---|---|---|
| `desc-dry-0422-0504` (kurak, 113) | 0,491 / 0,992 / −0,500 (cc0 %0,4) | 0,310 / 0,665 / −0,355 (cc0 %5,8) | 0,641 / 0,923 / −0,282 (cc0 %0,0) | 0,479 / 0,745 / −0,266 (cc0 %6,2) | 0,438 / 0,946 / −0,509 (cc0 %0,9) | **0/3 (Hayır)** |
| `desc-rain-0609-0621` (yağış, 113) | 0,780 / 0,982 / −0,202 (cc0 %0,0) | 0,338 / 0,645 / −0,307 (cc0 %5,3) | 0,705 / 0,875 / −0,170 (cc0 %0,0) | 0,495 / 0,677 / −0,182 (cc0 %3,1) | 0,528 / 0,870 / −0,342 (cc0 %0,0) | **0/3 (Hayır)** |
| `desc-rain-0901-0913` (yağış, 113) | 0,773 / 0,975 / −0,201 (cc0 %0,4) | 0,343 / 0,414 / −0,071 (cc0 %1,3) | 0,475 / 0,917 / −0,443 (cc0 %1,3) | 0,338 / 0,668 / −0,331 (cc0 %26,7) | 0,391 / 0,866 / −0,475 (cc0 %4,4) | **0/3 (Hayır)** |
| `asc-dry-0216-0228` (kurak, 19) | 0,856 / N/A / N/A (cc0 %0,4) | 0,621 / 0,810 / −0,189 (cc0 %0,4) | 0,572 / 0,917 / −0,345 (cc0 %0,0) | 0,588 / 0,758 / −0,171 (cc0 %1,8) | 0,755 / N/A / N/A (cc0 %0,0) | **0/3 (Hayır)** |
| `asc-rain-0523-0604` (yağış, 19) | 0,806 / N/A / N/A (cc0 %0,0) | 0,452 / 0,639 / −0,187 (cc0 %0,4) | 0,514 / 0,844 / −0,330 (cc0 %0,0) | 0,338 / 0,638 / −0,300 (cc0 %15,6) | 0,715 / N/A / N/A (cc0 %0,0) | **0/3 (Hayır)** |

\* `Xochimilco tarlaları` kutusu WorldCover'da %46,5 yapılaşmış çıktığı için "arazi örtüsü tanıma uymuyor" olarak işaretlenmiştir.

## 4. Akıl Sağlığı Kontrolü ve Hizalama Doğrulaması

- **`desc-rain-0609-0621` ve `desc-rain-0901-0913`:** Zócalo'da iki sensör de yüksek (`NISAR ≥ 0,77`, `S1 ≥ 0,97`); yeniden örnekleme ve UTM 14N hizalaması harita özellikleriyle (eski havalimanı/Texcoco göl tabanı, volkanik tepeler) tam örtüşmektedir.
- **`desc-dry-0422-0504`:** Zócalo'da NISAR medyanı `0,491` ile `0,50` eşiğinin hemen altındadır. Bu değer yeniden örneklemeden değil, doğrudan `cache/113/20260423_20260505.npz` içindeki ham NISAR tutarlılığından gelmektedir (Track 113'teki 26 çift içinde Zócalo tutarlılığının en düşük olduğu çifttir).
- **`asc-dry-0216-0228` ve `asc-rain-0523-0604`:** Sentinel-1 ascending çerçevesinin kuzey sınırı `UTM Y ≈ 2.148.160 m` civarından geçtiği için Zócalo ve Santa Fe kutuları Sentinel-1 görüntüsünün kapsamı dışında (`NaN`) kalmaktadır; ancak üç tarım/sulak alan kutusu (`CHA`, `XOC`, `TLA`) tamamen kapsam içindedir.

## 5. Sonuç ve Site İçin Öne Çıkan Çift

- **Sonuç:** **DOĞRULANMADI (0/5 çift).** Sabitlenen ölçüt altında, üç tarım/sulak alan kutusunun hiçbirinde NISAR tutarlılığı Sentinel-1'i `≥ 0,15` farkla geçemedi. Bunun iki ana nedeni vardır: (1) Chalco ve Xochimilco kutuları kapalı orman değil, kısmen yapılaşmış/açık tarım dokusudur (haritanın güneybatısındaki yoğun ormanlık dağlarda görsel olarak NISAR > Sentinel-1 çıkmaktadır); (2) Sentinel-1 HyP3 `_corr.tif` ürünü `20×4` bakış + `adf` (α=0,6) süzgeciyle şehirde `0,98–0,99` gibi çok yüksek taban tutarlılığı üretirken provisional NISAR GUNW (`13×16` bakış) şehirde `0,77–0,86` bandında kalmaktadır.
- **Site için öne çıkan çift:** 5 çift içinde tarım/sulak alan medyan farkına göre sıralandığında (`−0,331`, `−0,300`, `−0,282`, `−0,189`, `−0,182`) tam ortanca çift **`desc-dry-0422-0504`** (`medyan fark = −0,282`)'tır. (Not: Bu çiftte NISAR Zócalo tutarlılığı `0,491` ile alışılmadık derecede düşük olduğu için görselde tam şehir kapsamlı ve Zócalo ≥ 0,77 olan bir örnek olarak `desc-rain-0609-0621` de ek bağlam olarak belirtilebilir; ancak kural gereği ortanca seçimi `desc-dry-0422-0504`'tür.)
