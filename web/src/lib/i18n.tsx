import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { L10n, Lang } from "@/lib/data"

const S = {
  title: { tr: "Mexico City batıyor", en: "Mexico City is sinking" },
  lede: {
    tr: "Şehir eski bir gölün kili üstünde duruyor. Yerin altından su çekildikçe kil sıkışıyor ve zemin bazı mahallelerde yılda 30 cm'den fazla alçalıyor. Bu harita, NISAR uydusunun 11 aylık gerçek radar ölçümlerinden hesaplandı.",
    en: "The city sits on the clay of an old lake. As water is pumped from underground the clay compacts, and in some neighbourhoods the ground drops more than 30 cm a year. This map was computed from 11 months of real NISAR radar measurements.",
  },
  mock: { tr: "Örnek veri", en: "Sample data" },
  mockHint: {
    tr: "Gerçek NISAR ölçümleri işleniyor. Şimdilik gösterilen sayılar aynı biçimde üretilmiş örneklerdir.",
    en: "Real NISAR measurements are being processed. Numbers shown now are samples in the same format.",
  },
  verified: { tr: "NISAR verisi", en: "NISAR data" },
  langSwitch: { tr: "English", en: "Türkçe" },

  viewDisp: { tr: "Çökme (cm)", en: "Sinking (cm)" },
  viewWrap: { tr: "Radar halkaları", en: "Radar fringes" },
  viewSwipe: { tr: "İkisini karşılaştır", en: "Compare both" },
  viewLabel: { tr: "Harita görünümü", en: "Map view" },
  swipeHandle: { tr: "Karşılaştırma çizgisini kaydır", en: "Move the comparison line" },
  swipeLeft: { tr: "Radarın gördüğü", en: "What the radar sees" },
  storyTitleL: { tr: "Radar hareketi halkalarla görür", en: "Radar sees motion as fringes" },
  storyL: {
    tr: "Her renk turu bir halka. NISAR'ın 24 cm'lik dalgasında bir halka, uyduya doğru yaklaşık 12 cm hareket demek. Şehrin en hızlı yeri bu tarihe kadar {cm} cm uzaklaştı; bu {l} halkaya karşılık geliyor. Halkaları merkezden dışa sayarak çökmenin ne kadar olduğunu buluyoruz.",
    en: "Each colour cycle is one fringe. With NISAR's 24 cm wave, one fringe means about 12 cm of motion along the line of sight. The city's fastest spot has moved {cm} cm away up to this date, which is {l} fringes. Counting fringes from the centre outwards tells us how much the ground sank.",
  },
  swipeRight: { tr: "Bizim çözdüğümüz", en: "What we work out" },
  legendSinking: { tr: "çöküyor", en: "sinking" },
  legendRising: { tr: "yükseliyor", en: "rising" },
  legendWrap: { tr: "Bir renk turu, yaklaşık {n} cm hareket", en: "One colour cycle is about {n} cm of motion" },
  backdrop: { tr: "Arka plan", en: "Background" },
  bdMap: { tr: "Harita", en: "Map" },
  mapLabel: { tr: "Mexico City çökme haritası", en: "Mexico City sinking map" },

  play: { tr: "Oynat", en: "Play" },
  pause: { tr: "Durdur", en: "Pause" },
  since: { tr: "{d} tarihinden bu yana", en: "since {d}" },
  noData: { tr: "veri yok", en: "no data" },
  timeline: { tr: "Ölçüm tarihi", en: "Measurement date" },

  pickPoint: { tr: "Haritada bir yere tıkla.", en: "Click a place on the map." },
  sunk: { tr: "alçaldı", en: "lower" },
  perYear: { tr: "Bu hızla yılda yaklaşık {v} cm", en: "At this pace, about {v} cm a year" },
  staffLabel: { tr: "Ölçü mirası: {d} tarihindeki zemin seviyesine göre bugünkü zemin", en: "Levelling staff: today's ground compared with the level on {d}" },
  groundThen: { tr: "{d} zemini", en: "ground on {d}" },
  groundNow: { tr: "bugün", en: "now" },
  chartTitle: { tr: "Zaman içinde", en: "Over time" },
  chartNisar: { tr: "NISAR, 12 günde bir", en: "NISAR, every 12 days" },
  chartAria: { tr: "{n}: {a} ile {b} arasında {v} cm", en: "{n}: {v} cm between {a} and {b}" },

  whyTitle: { tr: "Neden çöküyor?", en: "Why is it sinking?" },
  why1: {
    tr: "Aztekler şehri Texcoco gölünün üstüne kurdu. Göl kurutuldu, geriye yumuşak, suya doymuş kil kaldı.",
    en: "The Aztecs built the city on Lake Texcoco. The lake was drained, leaving soft, water-soaked clay.",
  },
  why2: {
    tr: "Şehrin suyunun büyük kısmı bu kilin altındaki akiferden pompalanıyor. Su gidince kil sıkışıyor ve bir daha eski haline dönmüyor.",
    en: "Most of the city's water is pumped from the aquifer below that clay. When the water leaves, the clay compacts and does not spring back.",
  },
  why3: {
    tr: "Haritamız bunu gösteriyor: kalın kilin üstündeki Xochimilco–Tláhuac yılda 36 cm, Chalco 36 cm, Nezahualcóyotl 29 cm çöküyor. Volkanik kayanın üstündeki Santa Fe, Ciudad Universitaria ve ovanın ortasındaki Peñón Viejo tepesi ise neredeyse hiç kıpırdamıyor (yılda 1 cm'den az).",
    en: "Our map shows this: on thick clay, Xochimilco–Tláhuac sinks 36 cm a year, Chalco 36 cm, Nezahualcóyotl 29 cm. On volcanic rock, Santa Fe, Ciudad Universitaria and the Peñón Viejo hill in the middle of the plain barely move (under 1 cm a year).",
  },
  whyHuman: {
    tr: "Hipotezimiz: neden fiziksel (sıkışan kil), tetikleyici insan (yeraltı suyu pompalama). Ölçtüğümüz hızlı çöken yerlerin hepsi eski göl tabanında, sabit kalanların hepsi kaya zeminde.",
    en: "Our hypothesis: the cause is physical (compacting clay), the trigger is human (groundwater pumping). Every fast-sinking spot we measured is on the old lakebed; every stable one is on rock.",
  },
  whyBlind: {
    tr: "Radarın göremediği yerler de var: eski göl tabanında, havalimanının çevresinde, iki ölçüm arasında yüzey çok değiştiği için sinyal kopuyor. Haritadaki boşluklar 'çökme yok' değil, 'ölçüm yok' demek.",
    en: "There are places the radar cannot see: on the old lakebed around the airport the surface changes too much between passes and the signal breaks up. Gaps on the map mean 'no measurement', not 'no sinking'.",
  },
  whyCheck: {
    tr: "Sonuçlarımız yayınlanmış çalışmalarla aynı mertebede: Nezahualcóyotl'de yılda yaklaşık 39 cm (Cigna ve Tapete 2021), Chalco'da yılda 35 cm'den fazla (Solano-Rojas ve ark. 2024).",
    en: "Our results match published studies in magnitude: about 39 cm a year at Nezahualcóyotl (Cigna and Tapete 2021), over 35 cm a year at Chalco (Solano-Rojas et al. 2024).",
  },

  radarTitle: { tr: "Radar ne görüyor?", en: "What does the radar see?" },
  radarIntro: {
    tr: "NISAR yere mikrodalga gönderir ve geri dönen yankıyı iki şekilde dinler. Seçtiğin görüntü haritanın arka planına gelir.",
    en: "NISAR sends microwaves to the ground and listens to the echo in two ways. The view you pick becomes the map background.",
  },
  polHH: {
    tr: "HH binalara ve sert yüzeylere duyarlı. Şehir çok parlak (yaklaşık −2 dB), düz göl tabanı (−9 dB) ve su (−16 dB) koyu. Çökmeyi ölçtüğümüz faz da bu kanaldan geliyor.",
    en: "HH responds to buildings and hard surfaces. The city is very bright (about −2 dB), the flat lakebed (−9 dB) and water (−16 dB) are dark. The phase we use to measure sinking comes from this channel.",
  },
  polHV: {
    tr: "HV, sinyali karıştıran yüzeyleri öne çıkarır. L-band'de buna hem orman (−9 dB) hem karmaşık şehir dokusu (−8 dB) girer. Düz yüzeyler koyu kalır: tarla −13, kuru göl tabanı −17, su −22 dB.",
    en: "HV highlights surfaces that scramble the signal. At L-band that includes both forest (−9 dB) and the complex city fabric (−8 dB). Flat surfaces stay dark: fields −13, dry lakebed −17, water −22 dB.",
  },
  polRGB: {
    tr: "Kırmızı HH, yeşil HV, mavi HH/HV oranı. Kurumuş göl tabanı ve su koyu lacivert, düzenli sıralı bina blokları pembe, bitki ve karışık şehir dokusu yeşil görünür. Görüntü 13 Ekim 2026 tarihli gerçek NISAR GCOV verisi.",
    en: "Red is HH, green is HV, blue is the HH/HV ratio. The dry lakebed and water look dark navy, regularly aligned building blocks pink, vegetation and mixed city fabric green. Real NISAR GCOV data from 13 October 2026.",
  },
  lband: {
    tr: "Çökmeyi bu görüntülerin parlaklığından değil, radar dalgasının fazından ölçüyoruz. O faz da HH kanalından geliyor: binaların ve sert yüzeylerin güçlü yankısı, şehirde 12 gün arayla yapılan iki ölçümün birbirine benzemesini sağlıyor.",
    en: "We measure sinking not from the brightness of these images but from the phase of the radar wave, taken from the HH channel: the strong echo of buildings and hard surfaces keeps two passes 12 days apart similar enough to compare.",
  },
  dotAria: { tr: "Şehir, orman, tarla, kuru göl tabanı ve su için ölçülen HH ve HV değerleri", en: "Measured HH and HV values for city, forest, fields, dry lakebed and water" },
  dotNote: { tr: "Bu görüntüden ölçüldü: NISAR GCOV, 13 Ekim 2026, her tür için yaklaşık 1 km'lik alanın ortancası.", en: "Measured from this image: NISAR GCOV, 13 October 2026, median of a ~1 km area per type." },

  futureTitle: { tr: "NISAR neyi mümkün kılıyor?", en: "What does NISAR make possible?" },
  future1: {
    tr: "Her 12 günde bir, ücretsiz ve hazır işlenmiş veri. Bu haritayı biz bir yarışma için yaptık; aynı yöntem dünyanın herhangi bir şehri için tekrarlanabilir. Çökme, tek seferlik makalelerden düzenli bir erken uyarıya dönüşebilir.",
    en: "Free, ready-processed data every 12 days. We made this map for a competition; the same method works for any city in the world. Subsidence monitoring can move from one-off papers to routine early warning.",
  },
  future2: {
    tr: "Metro, su boruları ve binalar en çok sabit zeminle çöken zeminin yan yana geldiği yerlerde hasar görür. Peñón Viejo tepesi yılda 1 cm'den az hareket ederken, yaklaşık 3 km ötedeki Iztapalapa ovası yılda 24 cm çöküyor. Bu geçişleri haritalamak altyapı riskini gösterir.",
    en: "Metro lines, water mains and buildings are damaged most where stable and sinking ground meet. The Peñón Viejo hill moves less than 1 cm a year, while the Iztapalapa plain about 3 km away sinks 24 cm a year. Mapping these transitions shows infrastructure risk.",
  },
  future3: {
    tr: "Uzun dalgası sayesinde NISAR, ormanlık yamaçlarda ve Konya gibi geniş tarım havzalarında yeraltı suyu kaynaklı çökmeyi izlemek için güçlü bir aday. Veri şu an 'provisional'; kalibrasyon tamamlandıkça sonuçlar daha da güvenilir olacak.",
    en: "Thanks to its long wave, NISAR is a strong candidate for tracking groundwater-driven subsidence on forested slopes and in large farming basins such as Konya. The data are still 'provisional'; results will get more reliable as calibration is completed.",
  },
  chartTrend: { tr: "11 ayın eğilimi", en: "11-month trend" },
  pointTitle: { tr: "{n}, NISAR'ın {k} ölçümüyle", en: "{n}, from {k} NISAR measurements" },
  subtitle: {
    tr: "NISAR L-band radarı, 11 ay, 28 ölçüm: bazı mahalleler yılda 35 cm alçalıyor.",
    en: "NISAR L-band radar, 11 months, 28 passes: some neighbourhoods drop 35 cm a year.",
  },
  themeToggle: { tr: "Açık / koyu tema", en: "Light / dark theme" },
  polView: { tr: "Görünüm", en: "View" },
  polModeSwipe: { tr: "Karşılaştır", en: "Compare" },
  polModeRgb: { tr: "RGB", en: "RGB" },
  polHHShort: { tr: "binalar parlak", en: "buildings bright" },
  polHVShort: { tr: "bitki ve karmaşık doku", en: "vegetation, rough fabric" },
  polRgbShort: { tr: "HH, HV ve oranı tek resimde", en: "HH, HV and their ratio in one image" },
  polSwipeHint: { tr: "Ortadaki çizgiyi sürükle: solda HH, sağda HV. Aynı yer, aynı an, iki farklı dinleme.", en: "Drag the line: HH on the left, HV on the right. Same place, same moment, two ways of listening." },
  polSingleHint: { tr: "Karşılaştırmaya dönmek için “Karşılaştır”a bas.", en: "Press “Compare” to go back to the side-by-side view." },
  polIntro2: { tr: "NISAR yere mikrodalga gönderir ve dönen yankıyı iki şekilde dinler. Aynı sahne iki farklı görünür: bu fark, yüzeyin ne olduğunu söyler.", en: "NISAR sends microwaves to the ground and listens to the echo in two ways. The same scene looks different in each, and that difference tells us what the surface is." },
  polHHName: { tr: "HH: yatay gönder, yatay dinle", en: "HH: send horizontal, listen horizontal" },
  polHVName: { tr: "HV: yatay gönder, dikey dinle", en: "HV: send horizontal, listen vertical" },
  eqDoorOver: { tr: "Bu hızla 10 yılda {m} metre: bir kapıdan yüksek.", en: "At this pace, {m} metres in 10 years: taller than a door." },
  eqDoorPart: { tr: "Bu hızla 10 yılda {m} metre alçalır.", en: "At this pace, {m} metres lower in 10 years." },
  eqStable: { tr: "Kaya zemin: yılda bir kalem kalınlığı kadar bile oynamıyor.", en: "Rock ground: it moves less than a pencil's width a year." },
  regionChange: { tr: "Değiştir", en: "Change" },
  groupSinking: { tr: "Çöken yerler, en hızlıdan", en: "Sinking places, fastest first" },
  groupStable: { tr: "Kaya zemin (kontrol noktaları)", en: "Rock ground (control points)" },
  pickHint: { tr: "Haritadaki noktalara tıklayarak da seçebilirsin.", en: "You can also click the dots on the map." },
  regionPick: { tr: "Yer seç", en: "Choose a place" },
  statSince: { tr: "{d} tarihinden bu yana", en: "since {d}" },
  statRate: { tr: "yıllık çökme hızı", en: "sinking per year" },
  statMap: { tr: "haritanın en hızlı %1'i", en: "fastest 1% of the map" },
  statPasses: { tr: "NISAR ölçüm tarihi", en: "NISAR measurement dates" },
  statStable: { tr: "Kaya zemin: neredeyse kıpırdamıyor.", en: "Rock ground: barely moves." },
  chartTitle2: { tr: "Zemin zaman içinde", en: "Ground over time" },
  polTitle: { tr: "İki polarizasyon, aynı şehir", en: "Two polarizations, one city" },
  polSlider: { tr: "HH ile HV arasındaki çizgiyi kaydır", en: "Move the line between HH and HV" },
  polLeft: { tr: "HH: binalar parlak", en: "HH: buildings bright" },
  polRight: { tr: "HV: bitki ve karmaşık doku", en: "HV: vegetation and rough fabric" },
  polOnMap: { tr: "Haritanın arka planı", en: "Map background" },
  storyTitle: { tr: "İnsanlar şehri batırıyor", en: "People are sinking the city" },
  storyIntro: {
    tr: "Zemin kendi kendine çökmüyor. Bu bir zincir ve her halkasında insan var.",
    en: "The ground is not sinking on its own. It is a chain, and people are in every link.",
  },
  sf1: { tr: "%70", en: "70%" },
  sfl1: { tr: "suyun yeraltından gelen payı", en: "of the water comes from underground" },
  sf2: { tr: "2×", en: "2×" },
  sfl2: { tr: "çekilen su / yağmurla gelen", en: "pumped out vs. returned by rain" },
  sf3: { tr: "1947", en: "1947" },
  sfl3: { tr: "mekanizmanın ilk açıklandığı yıl", en: "year the mechanism was first explained" },
  sf4: { tr: "2024", en: "2024" },
  sfl4: { tr: "barajlar tarihî düşükte", en: "reservoirs at record lows" },
  sf5: { tr: "14", en: "14" },
  sfl5: { tr: "anıta eklenen basamak", en: "steps added to the monument" },
  st1T: { tr: "20 milyon kişilik susuzluk", en: "A thirst for 20 million" },
  st1: {
    tr: "Valle de México'da 20 milyondan fazla insan yaşıyor. Suyun yaklaşık %70'i dışarıdan değil, şehrin hemen altındaki akiferden geliyor.",
    en: "More than 20 million people live in the Valley of Mexico. About 70% of their water comes not from outside but from the aquifer right beneath the city.",
  },
  st2T: { tr: "Gelenin iki katı çekiliyor", en: "Twice the inflow is pumped out" },
  st2: {
    tr: "Conagua'ya göre akiferden her yıl 993 milyon m³ su çekiliyor; yağmurla geri dönen ise 513 milyon m³. Conagua bu akiferi ülkenin en kritik akiferi sayıyor.",
    en: "According to Conagua, 993 million m³ is pumped from the aquifer each year while rain returns 513 million m³. Conagua rates it the most critical aquifer in the country.",
  },
  st3T: { tr: "Kil sıkışıyor, geri dönmüyor", en: "The clay compacts for good" },
  st3: {
    tr: "Şehir kurutulmuş göllerin yumuşak kili üstünde. Su basıncı düşünce kil sıkışıyor; bunu 1947'de Nabor Carrillo açıkladı. Kil en kalın nerede ise çökme orada en hızlı (Chaussard ve ark. 2021).",
    en: "The city stands on the soft clay of drained lakes. As water pressure drops the clay compacts, as Nabor Carrillo explained in 1947. Where the clay is thickest, sinking is fastest (Chaussard et al. 2021).",
  },
  st4T: { tr: "Beton ve kuraklık döngüyü hızlandırıyor", en: "Concrete and drought speed up the loop" },
  st4: {
    tr: "Asfalt ve beton yağmurun akifere ulaşmasını engelliyor. 2024 kuraklığında şehre dışarıdan su getiren barajlar tarihî düşüğe indi; çözüm olarak yeni kuyular konuşuldu.",
    en: "Asphalt and concrete keep rain from reaching the aquifer. In the 2024 drought the reservoirs that bring water from outside hit record lows, and new wells were proposed.",
  },
  st5T: { tr: "Sonuç sokakta", en: "The result is on the street" },
  st5: {
    tr: "Bağımsızlık Anıtı'na 14 basamak eklendi, Katedral eğik, Iztapalapa'nın yaklaşık üçte birinde yer çatlakları var. Tláhuac'ta zemin o kadar çöktü ki yeni bir göl oluştu; haritamızın en hızlı noktası (yılda 36 cm) tam orada.",
    en: "Fourteen steps were added to the Angel of Independence, the Cathedral leans, and about a third of Iztapalapa has ground cracks. In Tláhuac the ground sank so far that a new lake formed; our fastest point (36 cm a year) is right there.",
  },
  storyMap: {
    tr: "NISAR'ın 11 aylık ölçümü bu zinciri doğruluyor: hızlı çöken her yer eski göl tabanında, sabit kalan her yer kayada.",
    en: "NISAR's 11 months of measurements back this chain: every fast-sinking spot is on the old lakebed, every stable one on rock.",
  },
  storyJpl: {
    tr: "NASA/JPL'in NISAR'ın ilk üç ayından yaptığı harita da ayda birkaç santime varan çökme gösteriyor; bizim sonucumuz onunla aynı mertebede.",
    en: "NASA/JPL's map from NISAR's first three months also shows sinking of up to a few centimetres a month; our result agrees in magnitude.",
  },
  sourcesLabel: { tr: "Kaynaklar", en: "Sources" },
  howTitle: { tr: "Bu harita nasıl yapıldı?", en: "How this map was made" },
  how1: { tr: "ASF Vertex'ten NISAR L2 GUNW interferogramlarını indirdik (12 günlük çiftler).", en: "We downloaded NISAR L2 GUNW interferograms from ASF Vertex (12-day pairs)." },
  how2: { tr: "İyonosfer düzeltmesini uygulayıp çiftleri sırayla toplayarak birikmiş hareketi çıkardık.", en: "We applied the ionosphere correction and chained the pairs into cumulative motion." },
  how3: { tr: "Uydunun batıdan (descending) ve doğudan (ascending) eğik bakışlarını birleştirip gerçek dikey harekete çevirdik.", en: "We combined the satellite's slanted views from the west (descending) and east (ascending) into true vertical motion." },
  how4: { tr: "Arka plan görüntüleri NISAR L2 GCOV ürününden (HH ve HV).", en: "Background images come from the NISAR L2 GCOV product (HH and HV)." },
  sourceLine: {
    tr: "Kaynak: {sensor}, {product}, {maturity}, track {track}. {g0} ile {g1} arasında 12 günlük ölçüm yok.",
    en: "Source: {sensor}, {product}, {maturity}, track {track}. No 12-day measurement between {g0} and {g1}.",
  },
  loadError: { tr: "Veri yüklenemedi. Sayfayı yenile; sorun sürerse public/data klasörünü kontrol et.", en: "Data failed to load. Refresh the page; if it persists, check the public/data folder." },
  loading: { tr: "Veri yükleniyor", en: "Loading data" },
} satisfies Record<string, L10n>

export type Key = keyof typeof S

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string; pick: (v: L10n) => string }
const I18n = createContext<Ctx | null>(null)

function initialLang(): Lang {
  const q = new URLSearchParams(location.search).get("lang")
  if (q === "tr" || q === "en") return q
  try {
    const s = localStorage.getItem("lang")
    if (s === "tr" || s === "en") return s
  } catch { /* depolama kapalı olabilir */ }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = S.title[lang] + " | NISAR"
    try { localStorage.setItem("lang", lang) } catch { /* yoksay */ }
  }, [lang])
  const t: Ctx["t"] = (k, vars) => {
    let s: string = S[k][lang]
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b))
    return s
  }
  return <I18n.Provider value={{ lang, setLang, t, pick: (v) => v[lang] }}>{children}</I18n.Provider>
}

export function useI18n() {
  const c = useContext(I18n)
  if (!c) throw new Error("I18nProvider eksik")
  return c
}
