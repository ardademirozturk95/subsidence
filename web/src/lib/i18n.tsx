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
  swipeLeftC: { tr: "C-band olsaydı (simülasyon)", en: "If it were C-band (simulation)" },
  simChip: { tr: "Simülasyon: aynı hareket, C-band dalga boyuyla", en: "Simulation: same motion, C-band wavelength" },
  bandLabel: { tr: "Dalga boyu", en: "Wavelength" },
  bandL: { tr: "NISAR L-band", en: "NISAR L-band" },
  bandC: { tr: "C-band olsaydı", en: "If C-band" },
  storyTitleL: { tr: "Radar hareketi halkalarla görür", en: "Radar sees motion as fringes" },
  storyTitleC: { tr: "Aynı çökme, Sentinel-1'in dalgasıyla", en: "Same sinking, Sentinel-1's wave" },
  storyL: {
    tr: "Her renk turu bir halka. NISAR'ın 24 cm'lik dalgasında bir halka, uyduya doğru yaklaşık 12 cm hareket demek. Şehrin en hızlı yeri bu tarihe kadar {cm} cm uzaklaştı; bu {l} halkaya karşılık geliyor. Halkaları merkezden dışa sayarak çökmenin ne kadar olduğunu buluyoruz.",
    en: "Each colour cycle is one fringe. With NISAR's 24 cm wave, one fringe means about 12 cm of motion along the line of sight. The city's fastest spot has moved {cm} cm away up to this date, which is {l} fringes. Counting fringes from the centre outwards tells us how much the ground sank.",
  },
  storyC: {
    tr: "Sentinel-1'in dalgası 5,5 cm; bir halkası 2,8 cm hareket. Aynı {cm} cm onun dalgasında {c} halkaya karşılık gelir. Biz hareketi 12 günlük adımlarla izlediğimiz için (her adımda yaklaşık 1 cm) iki uydu da bu çöküşü ölçebilir. Halka farkı deprem ve volkan gibi ani, büyük hareketlerde önem kazanır.",
    en: "Sentinel-1's wave is 5.5 cm; one of its fringes is 2.8 cm of motion. The same {cm} cm equals {c} fringes at its wavelength. Because we track the motion in 12-day steps (about 1 cm each), both satellites can measure this sinking. The fringe difference matters for sudden, large motion such as earthquakes and volcanoes.",
  },
  ringsNote: {
    tr: "C-band görüntüsü bir simülasyondur: NISAR'ın ölçtüğü hareket Sentinel-1'in 5,5 cm'lik dalga boyuyla yeniden sarıldı. İki görüntü de aynı şekilde hafifçe yumuşatıldı (~400 m).",
    en: "The C-band view is a simulation: the motion measured by NISAR re-wrapped at Sentinel-1's 5.5 cm wavelength. Both views are smoothed the same way (~400 m).",
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
  chartS1: { tr: "Sentinel-1'in 10 yıllık hızı", en: "Sentinel-1 ten-year rate" },
  chartAria: { tr: "{n}: {a} ile {b} arasında {v} cm", en: "{n}: {v} cm between {a} and {b}" },
  agree: {
    tr: "Dört aylık NISAR ölçümü, Sentinel-1'in on yıllık eğilimiyle örtüşüyor: düşüş yeni değil, sürüyor.",
    en: "Four months of NISAR agree with Sentinel-1's ten-year trend: the drop is not new, it is ongoing.",
  },

  whyTitle: { tr: "Neden çöküyor?", en: "Why is it sinking?" },
  why1: {
    tr: "Aztekler şehri Texcoco gölünün üstüne kurdu. Texcoco, Xochimilco ve Chalco gölleri kurutuldu; geriye yumuşak, suya doymuş kil kaldı.",
    en: "The Aztecs built the city on Lake Texcoco. Lakes Texcoco, Xochimilco and Chalco were drained, leaving soft, water-soaked clay.",
  },
  why2: {
    tr: "Şehrin suyunun yaklaşık %70'i bu kilin altındaki akiferden pompalanıyor. Conagua'ya göre her yıl yaklaşık 990 milyon m³ su çekiliyor, yağmurla geri gelen ise 510 milyon m³: neredeyse iki katı. Su basıncı düşünce kil sıkışıyor ve bir daha geri dönmüyor. Bu mekanizmayı ilk kez 1947'de Nabor Carrillo açıkladı.",
    en: "About 70% of the city's water is pumped from the aquifer below that clay. According to Conagua, about 990 million m³ is withdrawn each year while rain returns about 510 million m³: almost twice as much goes out. As water pressure drops the clay compacts and never springs back. Nabor Carrillo first explained this mechanism in 1947.",
  },
  why3: {
    tr: "Haritamız bunu gösteriyor: kalın kilin üstündeki Xochimilco–Tláhuac yılda 36 cm, Chalco 36 cm, Nezahualcóyotl 29 cm çöküyor. Volkanik kayanın üstündeki Santa Fe, Ciudad Universitaria ve ovanın ortasındaki Peñón Viejo tepesi ise neredeyse hiç kıpırdamıyor (yılda 1 cm'den az).",
    en: "Our map shows this: on thick clay, Xochimilco–Tláhuac sinks 36 cm a year, Chalco 36 cm, Nezahualcóyotl 29 cm. On volcanic rock, Santa Fe, Ciudad Universitaria and the Peñón Viejo hill in the middle of the plain barely move (under 1 cm a year).",
  },
  whyHuman: {
    tr: "Hipotezimiz: neden fiziksel (sıkışan kil), tetikleyici insan (yeraltı suyu pompalama). Ölçtüğümüz hızlı çöken yerlerin hepsi eski göl tabanında, sabit kalanların hepsi kaya zeminde.",
    en: "Our hypothesis: the cause is physical (compacting clay), the trigger is human (groundwater pumping). Every fast-sinking spot we measured is on the old lakebed; every stable one is on rock.",
  },
  whyFast: {
    tr: "Neden bazı mahalleler daha hızlı? Araştırmalara göre hızı en çok kil tabakasının kalınlığı belirliyor (Chaussard ve ark. 2021). Haritamızın en hızlı yerleri Chalco ve Tláhuac, eski Chalco gölünün tabanı. Orada zemin o kadar çöktü ki yeni bir göl oluştu (Tláhuac–Xico).",
    en: "Why do some neighbourhoods sink faster? Research shows the thickness of the clay layer sets the pace (Chaussard et al. 2021). Our fastest spots are Chalco and Tláhuac, the bed of old Lake Chalco. The ground there has sunk so much that a new lake has formed (Tláhuac–Xico).",
  },
  whyEffects: {
    tr: "Sonuçları sokakta görülüyor: Bağımsızlık Anıtı'nın tabanına 14 basamak eklendi, Katedral eğik, Iztapalapa'nın yaklaşık üçte birinde yer çatlakları var. 2024 kuraklığında şehre su getiren Cutzamala barajları tarihî düşüğe inince hükümetin planlarından biri yeni kuyular açmak oldu.",
    en: "The effects show on the street: 14 steps were added to the base of the Angel of Independence, the Cathedral leans, and about a third of Iztapalapa has ground cracks. When the Cutzamala reservoirs that supply the city hit record lows in the 2024 drought, one of the government's plans was to drill new wells.",
  },
  whyJpl: {
    tr: "NASA/JPL da NISAR'ın ilk üç ayından (Ekim 2025 – Ocak 2026) bir Mexico City haritası yayınladı ve ayda birkaç santime varan çökme buldu. Bizim 11 aylık, iki yönlü sonucumuz onunla aynı mertebede.",
    en: "NASA/JPL also published a Mexico City map from NISAR's first three months (Oct 2025 – Jan 2026), finding sinking of up to a few centimetres a month. Our 11-month, two-direction result agrees in magnitude.",
  },
  sourcesLabel: { tr: "Kaynaklar", en: "Sources" },
  whyBlind: {
    tr: "Radarın göremediği yerler de var: eski göl tabanında, havalimanının çevresinde, iki ölçüm arasında yüzey çok değiştiği için sinyal kopuyor. Haritadaki boşluklar 'çökme yok' değil, 'ölçüm yok' demek.",
    en: "There are places the radar cannot see: on the old lakebed around the airport the surface changes too much between passes and the signal breaks up. Gaps on the map mean 'no measurement', not 'no sinking'.",
  },
  whyCheck: {
    tr: "Sonuçlarımız yayınlanmış çalışmalarla aynı mertebede: Sentinel-1 ile Nezahualcóyotl'de yılda yaklaşık 39 cm (Cigna ve Tapete 2021), Chalco'da yılda 35 cm'den fazla (Solano-Rojas ve ark. 2024).",
    en: "Our results match published studies in magnitude: about 39 cm a year at Nezahualcóyotl with Sentinel-1 (Cigna and Tapete 2021), over 35 cm a year at Chalco (Solano-Rojas et al. 2024).",
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
    tr: "Polarizasyon ile dalga boyunu karıştırmamak gerek. NISAR'ın dalgası 24 cm (L-band), Sentinel-1'inki 5,5 cm (C-band). Uzun dalga bitkinin içine daha derin girer. Sentinel-1 ile karşılaştırdık: 12 günlük ölçümlerde şehirde ve tarlada ikisi de çalışıyor; dağlık ormanda NISAR biraz daha az sinyal kaybediyor.",
    en: "Polarization and wavelength are different things. NISAR's wave is 24 cm (L-band), Sentinel-1's is 5.5 cm (C-band). The longer wave reaches deeper into vegetation. We compared the two: over 12 days both work in the city and over fields; in the mountain forest NISAR loses slightly less signal.",
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
