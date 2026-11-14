# Zemin Eğimi (Diferansiyel Çökme) Analizi — CDMX

**Ön-Kayıt Ölçütleri:** [tilt-olcut.md](tilt-olcut.md)  
**Doğrulama Kararı:** `doğrulanmadı`

## 1. Yöntem Özeti
- **Girdi:** `export_web.py` (`compute`) çıktısı dikey hız alanı `vU` (`cm/yıl`, UTM 14N, `80 m` piksel, `fill=rate`).
- **Yumuşatma:** NaN-duyarlı normalize edilmiş Gauss konvolüsyonu, birincil `sigma = 1` piksel (`80 m`); duyarlılık için `sigma = 0` ve `sigma = 2` (`160 m`).
- **Türev ve Büyüklük:** Merkezi fark (`dx = 80 m`, `dy = -80 m`); herhangi bir eksenel komşusu NaN olan ve kenar pikseller NaN bırakıldı. Eğim oranı $\beta = \sqrt{g_x^2 + g_y^2} / 100$ (`m/m/yıl`).
- **Gürültü Tabanı (Santa Fe 7×7 medyan):** `0.0511 ‰/yıl` (`1/19554 yr^-1`), alt eşik olan `0.2000 ‰/yıl` (`1/5000 yr^-1`) değerinin altında kaldığı için alt eşik yükseltilmedi.
- **Çıktılar:** `web/public/data/cdmx/tilt.png` (`600×600`, `rate.png` ile aynı ızgara), `web/public/data/cdmx/tilt.json`, `backend/out/tilt_check.png`.

## 2. Jeoteknik Bölgeleme Doğrulaması (NTC 2017)
Resmî CDMX *Normas Técnicas Complementarias* (2017) jeoteknik bölgeleme katmanı (`backend/out/zonas/zonificacion_geotecnica.geojson`) UTM 14N `80 m` ızgarasına rasterleştirilerek her zon için medyan $\beta$ hesaplandı:

| Zon | Piksel Sayısı | Medyan $\beta$ (`‰/yıl`) | Medyan (`1/X yr^-1`) | p75 (`‰/yıl`) | p95 (`‰/yıl`) | $\ge 1/5000$ Oranı | $\ge 1/2000$ Oranı | $\ge 1/1000$ Oranı |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| **Zona I (Lomas)** | 207,683 | 0.0660 | `1/15155 yr^-1` | 0.1186 | 0.2295 | 7.85% | 0.16% | 0.03% |
| **Zona II (Transición)** | 44,922 | 0.0618 | `1/16185 yr^-1` | 0.1172 | 0.2706 | 10.10% | 0.53% | 0.00% |
| **Zona III (Lacustre)** | 87,636 | 0.0747 | `1/13382 yr^-1` | 0.1457 | 0.3468 | 15.99% | 1.54% | 0.09% |

- **Oranlar:** `Zona II / Zona III = 0.827` (`< 1.5`, sağlanmadı); `Zona II / Zona I = 0.936` (`< 1.5`, sağlanmadı).
- **Sonuç (`doğrulanmadı`):** Havza genelinde Zona II medyan eğimi Zona III ve Zona I medyanlarının 1.5 katına ulaşmamaktadır. Bu harita zeminin en hızlı eğildiği kuşakları (diferansiyel çökme) gösterir; ancak bu ölçüt altında harita genelinde jeoteknik zon sınırını tek başına ayırdığı doğrulanmamıştır. Bunun başlıca nedenleri: Zona II'nin düşük hızlı geniş geçiş sektörlerini de kapsaması, Zona III içinde ise göl tabanındaki volkanik tepeler (Peñón Viejo, Xico) ve yerel çanak kenarları çevresinde yüksek diferansiyel çökme gradyanlarının bulunmasıdır.

## 3. Yumuşatma Duyarlılığı ($\sigma = 0, 1, 2$ piksel)
340,333 geçerli gradyan pikseli üzerinde:

| $\sigma$ (px / m) | Medyan (`‰/yıl`) | p95 (`‰/yıl`) | p99 (`‰/yıl`) | Maks (`‰/yıl`) | $\ge 1/5000$ | $\ge 1/2000$ | $\ge 1/1000$ | Santa Fe (`‰/yıl`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **0 (0 m)** | 0.1516 | 0.5799 | 0.8983 | 5.6417 | 38.03% | 7.63% | 0.64% | 0.1444 |
| **1 (80 m)** | 0.0676 | 0.2630 | 0.4304 | 2.3465 | 10.25% | 0.56% | 0.04% | 0.0511 |
| **2 (160 m)** | 0.0388 | 0.1540 | 0.2789 | 0.9057 | 2.64% | 0.06% | 0.00% | 0.0330 |

## 4. Track Bağımsızlığı (Track 113 vs Track 19)
- İki track'in ayrı ayrı LOS hız alanları üzerinde ($\sigma = 1$ px) hesaplanan gradyanların ortak geçerli piksellerinde (`340,333` piksel) en yüksek **%1'lik (`top-1%`)** kesimlerin **Jaccard örtüşme oranı: `0.1419`** (`846 / 5,962` piksel; Track 113 p99 eşiği `0.4380 ‰/yıl`, Track 19 p99 eşiği `0.3512 ‰/yıl`).

## 5. İzleme Noktaları (7×7 Piksel Medyan $\beta$, $\sigma = 1$)
| Nokta | $\beta$ (`‰/yıl`) | Oran (`1/X yr^-1`) |
| --- | ---: | --- |
| **Chalco ovası (Xico'nun güneyi)** (`chalco`) | 0.6048 | `1/1654 yr^-1` |
| **Iztapalapa (doğu ova)** (`iztapalapa`) | 0.2554 | `1/3915 yr^-1` |
| **Xochimilco–Tláhuac sulak alanı** (`tlaxialtemalco`) | 0.2393 | `1/4179 yr^-1` |
| **Peñón Viejo (volkanik tepe)** (`penon`) | 0.0874 | `1/11448 yr^-1` |
| **Xochimilco (çanak kenarı)** (`xochimilco`) | 0.0625 | `1/16008 yr^-1` |
| **Zócalo (tarihi merkez)** (`zocalo`) | 0.0513 | `1/19487 yr^-1` |
| **Santa Fe (referans)** (`santafe`) | 0.0511 | `1/19554 yr^-1` |
| **Ciudad Universitaria (lav zemin)** (`cu`) | 0.0507 | `1/19731 yr^-1` |
| **Bağımsızlık Anıtı** (`angel`) | 0.0442 | `1/22634 yr^-1` |
| **Aragón (havalimanının kuzeyi)** (`aragon`) | 0.0354 | `1/28245 yr^-1` |
| **Nezahualcóyotl** (`neza`) | 0.0243 | `1/41173 yr^-1` |

## 6. Sınırlılıklar
1. **80 m Mekânsal Çözünürlük:** `80 m` piksel boyutu ve $\sigma = 1$ px (`80 m`) Gauss yumuşatması, birkaç metre genişliğindeki keskin zemin kırıklarını veya dar basamakları ortalamaktadır; yerel tepe eğimler olduğundan düşük çıkabilir.
2. **Kuzey–Güney Hareket Varsayımı (`N-S = 0`):** Dikey hız (`vU`), yalnızca inen (113) ve çıkan (19) yörünge LOS hızlarından kuzey–güney bileşeni sıfır kabul edilerek ayrıştırılmıştır.
3. **Troposferik Düzeltme Yok:** Ölçümlerde atmosferik gecikme (troposfer) düzeltmesi uygulanmamıştır; uzun dalga boylu atmosferik gradyanlar düşük seviyeli eğim gürültüsüne katkıda bulunabilir.
4. **Yorum Sınırı:** Bu katman yalnızca yüzeyde **zeminin en hızlı eğildiği kuşakları (diferansiyel çökme)** gösterir; yapısal hasar veya tekil altyapı elemanlarının durumu hakkında doğrudan kanıt sunmaz.
