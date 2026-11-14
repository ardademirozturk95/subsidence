# Challenge'ın üç sorusu: sade cevaplar (site ve slayt için)

Yağız'ın ayrıntılı ve teknik metni: `docs/challenge-cevaplari-yagiz.md`. Bu dosya onun sadeleştirilmiş hali.
Sitede aynı metinler "Neden çöküyor?", "Radar ne görüyor?" ve "NISAR neyi mümkün kılıyor?" bölümlerinde.
Rakamlar `web/public/data/cdmx/points.json` ve `regions.json`'dan (NISAR L2 GUNW provisional, Kasım 2025 – Ekim 2026).

---

## Türkçe

### 1. Gördüğümüz değişimin fiziksel nedeni ne?

Mexico City kurutulmuş Texcoco gölünün yumuşak, suya doymuş kili üstünde duruyor. Şehrin suyunun büyük kısmı bu kilin altındaki akiferden pompalanıyor. Su çekildikçe kil sıkışıyor ve bir daha eski haline dönmüyor.

**Hipotezimiz:** neden fiziksel (sıkışan kil), tetikleyici insan (yeraltı suyu pompalama).

**Kanıt:** Kalın kilin üstündeki Xochimilco–Tláhuac yılda 36 cm, Chalco 36 cm, Nezahualcóyotl 29 cm çöküyor. Volkanik kayanın üstündeki Santa Fe, Ciudad Universitaria ve ovanın ortasındaki Peñón Viejo tepesi ise yılda 1 cm'den az hareket ediyor. Ölçtüğümüz hızlı çöken yerlerin hepsi eski göl tabanında, sabit kalanların hepsi kaya zeminde. Sonuçlarımız Sentinel-1 ile yapılmış yayınlarla aynı mertebede.

**Radarın göremediği:** Eski göl tabanında (havalimanı çevresi) iki ölçüm arasında yüzey çok değiştiği için sinyal kopuyor. Oradaki boşluk "çökme yok" değil, "ölçüm yok" demek.

### 2. Hangi polarizasyonlar bu değişimi öne çıkarıyor?

Çökmeyi, radar dalgasının fazından ölçüyoruz. Bu faz NISAR'ın **HH** kanalından geliyor: yatay gönderip yatay alıyor. HH, binalar ve sert yüzeylerde güçlü yankı verir; şehir çok parlak (−2 dB), göl tabanı (−9 dB) ve su (−16 dB) koyu.

**HV** (yatay gönderip dikey alıyor) sinyali karıştıran yüzeyleri öne çıkarır: L-band'de hem orman (−9 dB) hem karmaşık şehir dokusu (−8 dB). Düz tarla (−13 dB) ve göl tabanı (−17 dB) koyu kalır. HV, arazinin ne olduğunu ayırt etmeye yarar.

**Polarizasyon ile dalga boyu farklı şeyler.** NISAR'ın dalgası 24 cm (L-band), Sentinel-1'inki 5,5 cm (C-band). Sentinel-1 ile karşılaştırdık: 12 günlük ölçümlerde şehirde ve tarlada ikisi de çalışıyor; dağlık ormanda NISAR biraz daha az sinyal kaybediyor.

### 3. NISAR gelecekte neleri mümkün kılacak?

- **Her şehir için düzenli erken uyarı.** Her 12 günde bir, ücretsiz ve hazır işlenmiş veri. Bu haritayı bir yarışma için yaptık; aynı yöntem dünyanın herhangi bir şehri için tekrarlanabilir.
- **Altyapı riski.** Metro, su boruları ve binalar en çok sabit zeminle çöken zeminin yan yana geldiği yerlerde hasar görür. Peñón Viejo tepesi yılda 1 cm'den az hareket ederken, yaklaşık 3 km ötedeki Iztapalapa ovası yılda 24 cm çöküyor.
- **Tarım havzaları ve ormanlar.** Uzun dalgası sayesinde NISAR, ormanlık yamaçlarda ve Konya gibi tarım havzalarında yeraltı suyu kaynaklı çökmeyi izlemek için güçlü bir aday. Veri şu an "provisional"; kalibrasyon tamamlandıkça sonuçlar daha da güvenilir olacak.

---

## English

### 1. What is the physical cause of the change we see?

Mexico City sits on the soft, water-saturated clay of drained Lake Texcoco. Most of the city's water is pumped from the aquifer beneath that clay. As the water leaves, the clay compacts and does not spring back.

**Our hypothesis:** the cause is physical (compacting clay), the trigger is human (groundwater pumping).

**Evidence:** On thick clay, Xochimilco–Tláhuac sinks 36 cm a year, Chalco 36 cm, Nezahualcóyotl 29 cm. On volcanic rock, Santa Fe, Ciudad Universitaria and the Peñón Viejo hill in the middle of the plain move less than 1 cm a year. Every fast-sinking spot we measured is on the old lakebed; every stable one is on rock. Our results match published Sentinel-1 studies in magnitude.

**What the radar cannot see:** On the old lakebed around the airport the surface changes too much between passes and the signal breaks up. Gaps there mean "no measurement", not "no sinking".

### 2. Which polarizations highlight the change?

We measure sinking from the phase of the radar wave, taken from NISAR's **HH** channel (horizontal transmit, horizontal receive). HH echoes strongly from buildings and hard surfaces: the city is very bright (−2 dB), the lakebed (−9 dB) and water (−16 dB) are dark.

**HV** (horizontal transmit, vertical receive) highlights surfaces that scramble the signal: at L-band both forest (−9 dB) and the complex city fabric (−8 dB). Flat fields (−13 dB) and the lakebed (−17 dB) stay dark. HV helps tell land types apart.

**Polarization and wavelength are different things.** NISAR's wave is 24 cm (L-band), Sentinel-1's 5.5 cm (C-band). We compared them: over 12 days both work in the city and over fields; in the mountain forest NISAR loses slightly less signal.

### 3. What will NISAR make possible?

- **Routine early warning for any city.** Free, ready-processed data every 12 days. We built this map for a competition; the same method works anywhere in the world.
- **Infrastructure risk.** Metro lines, water mains and buildings are damaged most where stable and sinking ground meet. The Peñón Viejo hill moves less than 1 cm a year while the Iztapalapa plain about 3 km away sinks 24 cm a year.
- **Farming basins and forests.** Thanks to its long wave, NISAR is a strong candidate for tracking groundwater-driven subsidence on forested slopes and in farming basins such as Konya. The data are still "provisional"; results will get more reliable as calibration is completed.
