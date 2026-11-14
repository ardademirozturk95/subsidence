# NASA Space Apps 2026 — Challenge Sorularına Yanıtlar (TR / EN)

---

## Türkçe

### 1. Gördüğümüz değişimin fiziksel nedeni ne?

Mexico City kurutulmuş eski Texcoco, Xochimilco ve Chalco göllerinin yumuşak, suyla doygun kil ve silt tabakaları üzerine kuruludur. Milyonlarca insanın su ihtiyacını karşılamak için alttaki akiferden yoğun biçimde yeraltı suyu pompalandıkça gözenek suyu basıncı düşer ve üstteki sıkışabilir kil tabakası kendi ağırlığı altında geri dönüşsüz biçimde ezilir. Yani fiziksel neden sıkışabilir göl kili, tetikleyici ise insan kaynaklı yeraltı suyu çekimidir.

11 aylık NISAR dikey çökme haritamız bu jeolojik sınırı doğrudan kanıtlar. Göl tabanının dışındaki veya içindeki sert volkanik kaya zeminler neredeyse hiç kıpırdamaz: referans noktamız Santa Fe `+0,7 cm/yıl`, bağımsız kaya kontrolleri Ciudad Universitaria `−0,4 cm/yıl` ve çöken ovanın ortasındaki volkanik ada Peñón Viejo `−0,8 cm/yıl` hızındadır. Buna karşılık kalın kil dolgusu üzerindeki Xochimilco–Tláhuac sulak alanı `−36,4 cm/yıl`, Chalco ovası `−35,7 cm/yıl`, Aragón `−33,6 cm/yıl`, Nezahualcóyotl `−28,8 cm/yıl` ve Iztapalapa doğu ovası `−23,7 cm/yıl` hızla çökmektedir (haritanın en hızlı %1'i `−32,9 cm/yıl`). Öte yandan radarın göremediği yerler de vardır: eski Texcoco göl tabanında (havalimanı çevresi) yüzey nemi ve bitki örtüsü nedeniyle interferometrik tutarlılık bozulduğu için ölçüm maskelenmiştir; bu alanlarda çökme olmadığı değil, radarın güvenilir faz izleyemediği anlaşılmalıdır.

### 2. Hangi polarizasyonlar onu öne çıkarıyor?

Zemin çökmesini ölçtüğümüz interferometrik faz, NISAR L2 GUNW ürününün **HH** (yatay gönderip yatay alan) polarizasyon kanalından gelir. HH kanalı yollar, çatılar ve çıplak zemin gibi sert yüzeylerden gelen tek veya çift sıçramalı yansımalara duyarlıdır ve faz kararlılığını en iyi burada korur. Buna karşılık HV (çapraz) polarizasyon ağaç dalları ve yoğun bitki örtüsü içindeki hacimsel saçılmayı öne çıkarır; bitki yapısını ayırmada yararlıdır ancak rüzgârla sallanan yapraklar yüzünden interferometri için kararlı değildir.

Burada frekans (dalga boyu) ile polarizasyonu birbirine karıştırmamak gerekir: NISAR L-band (~24 cm) ile Sentinel-1 C-band (~5,6 cm) arasındaki temel fark polarizasyon değil dalga boyu farkıdır. Kısa C-band dalgaları bitki tepesinden saçılırken uzun L-band dalgaları bitki örtüsünün içine daha derinden nüfuz edebilir. Ancak kendi 5 çiftlik (12 günlük, 80 m) testimizde dürüst sonuç şudur: önceden belirlenen tarım ve sulak alan kutularında L-band avantajı **doğrulanmadı (0/5 çift)**; güneybatıdaki yoğun ormanlık dağlarda NISAR görsel olarak daha yüksek tutarlılık korusa da, HyP3 Sentinel-1 ürünündeki `adf` faz süzgeci ve 20×4 bakış nedeniyle tarla kutularında Sentinel-1 tutarlılığı provisional NISAR GUNW'den yüksek kalmıştır.

### 3. NISAR gelecekte neleri mümkün kılacak?

NISAR'ın 12 günlük düzenli tekrar yörüngesi ve ücretsiz, açık veri politikası, zemin çökmesini tek seferlik akademik haritalar yerine sürekli çalışan küresel bir erken uyarı sistemine dönüştürebilir. Mexico City gibi büyük kentlerde metro hatları, su boruları ve binalar tekdüze çökmeden çok keskin geçiş bölgelerinde zarar görür; örneğin sabit kalan Peñón Viejo kaya adası (`−0,8 cm/yıl`) ile hemen yanındaki hızlı çöken Iztapalapa ovası (`−23,7 cm/yıl`) arasındaki eğimler yer çatlaklarını ve altyapı riskini belirler.

Uzun L-band dalga boyu sayesinde NISAR, özellikle yoğun ormanlık yamaçlarda ve bitki örtüsüyle kaplı tarım havzalarında C-band'in körleştiği dönemlerde yeraltı suyu çekimine bağlı deformasyonu izleme potansiyeli sunar; Konya gibi geniş tarımsal çökme havzaları bunun doğrudan uygulama alanıdır. Ancak Mexico City testimiz önemli bir teknik sınır da gösterdi: provisional GUNW ürünlerinde yağışlı dönemde sulak alanların `%15,6–26,7`'si faz çözme maskesine (`cc == 0`) takılabilmekte ve eski göl tabanı tamamen kopabilmektedir. Gelecekte kalibre edilmiş V1 ürünleri, daha iyi troposfer/iyonosfer düzeltmeleri ve GCOV HH/HV arazi örtüsü katmanlarıyla birleştiğinde NISAR; zemin çökmesi, deprem, volkan ve altyapı sağlığını haftalık ölçekte herkesin izleyebileceği güvenilir bir omurgaya dönüşecektir.

---

## English

### 1. What is the physical cause of the observed change?

Mexico City sits on soft, water-saturated clay and silt beds left behind by drained ancient lakes Texcoco, Xochimilco, and Chalco. As millions of residents pump groundwater from the underlying aquifer, pore-water pressure drops and the compressible clay aquitard compacts irreversibly under its own weight. The physical mechanism is clay compaction; the human trigger is intensive groundwater extraction.

Our 11-month NISAR vertical subsidence map confirms this geological boundary directly. Hard volcanic bedrock outside or rising through the basin barely moves: our reference at Santa Fe measures `+0.7 cm/yr`, while independent rock controls at Ciudad Universitaria (`−0.4 cm/yr`) and the volcanic hill of Peñón Viejo (`−0.8 cm/yr`) stay near zero. By contrast, thick lakebed clays sink rapidly at Xochimilco–Tláhuac wetland (`−36.4 cm/yr`), Chalco plain (`−35.7 cm/yr`), Aragón (`−33.6 cm/yr`), Nezahualcóyotl (`−28.8 cm/yr`), and eastern Iztapalapa (`−23.7 cm/yr`), with the fastest 1% of the map reaching `−32.9 cm/yr`. Yet radar also has blind spots: over the former Lake Texcoco bed around the airport, surface moisture and vegetation destroy interferometric coherence, leaving masked (`NaN`) pixels—an observational gap, not an absence of sinking.

### 2. Which polarizations highlight this change?

The interferometric phase used to measure subsidence comes from the **HH** (horizontal transmit, horizontal receive) channel of the NISAR L2 GUNW product. HH responds strongly to hard surfaces such as roads, rooftops, and bare ground via surface and double-bounce scattering, preserving the phase stability needed for centimeter-scale tracking. By contrast, **HV** cross-polarization highlights volume scattering inside tree canopies and dense vegetation; it helps distinguish land cover, but moving foliage loses interferometric coherence quickly.

Crucially, frequency and polarization must not be confused: the potential penetration difference between NISAR L-band (~24 cm) and Sentinel-1 C-band (~5.6 cm) stems from radar wavelength, not polarization. In our five-pair (12-day, 80 m) coherence test over Mexico City, we report honestly that the pre-registered L-band advantage over farmland boxes was **not confirmed (0/5 pairs)**. Although NISAR visually preserved higher coherence over the forested southwestern mountains, Sentinel-1 HyP3 products—processed with `20×4` looks and `adf` adaptive phase filtering (`α=0.6`)—yielded higher coherence than provisional NISAR GUNW (`13×16` looks) across the semi-urbanized and managed agricultural test boxes (`0.41–0.92` vs `0.31–0.71`).

### 3. What will NISAR enable in the future?

With a regular 12-day repeat cycle and free, open data access, NISAR can turn ground subsidence monitoring from retrospective academic studies into continuous global early warning. In megacities like Mexico City, infrastructure damage to metro lines, water mains, and buildings concentrates along sharp differential gradients—such as the transition between stable volcanic bedrock at Peñón Viejo (`−0.8 cm/yr`) and the rapidly sinking Iztapalapa plain (`−23.7 cm/yr`), where ground fissures form.

Because L-band waves penetrate dense vegetation better than shorter wavelengths, NISAR holds strong promise for tracking groundwater-driven subsidence across forested slopes and irrigated agricultural basins like Konya. At the same time, our Mexico City evaluation reveals real-world limits that future workflows must respect: in provisional GUNW products, up to `15.6–26.7%` of pixels in wet chinampa wetlands can still fail phase unwrapping (`cc == 0`), and former lakebed mudflats lose coherence entirely. Once calibrated V1 products are combined with improved atmospheric corrections and GCOV HH/HV land-cover mapping, NISAR's 12-day cadence will provide a reliable, open backbone for tracking subsidence, infrastructure risk, earthquakes, and volcanoes worldwide.
