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
    tr: "Aztekler şehri Texcoco gölünün üstüne kurdu. Göl kurutuldu, geriye yumuşak, suya doymuş kil kaldı.",
    en: "The Aztecs built the city on Lake Texcoco. The lake was drained, leaving soft, water-soaked clay.",
  },
  why2: {
    tr: "Şehrin suyunun büyük kısmı bu kilin altındaki akiferden pompalanıyor. Su gidince kil sıkışıyor ve bir daha eski haline dönmüyor.",
    en: "Most of the city's water is pumped from the aquifer below that clay. When the water leaves, the clay compacts and does not spring back.",
  },
  why3: {
    tr: "Havzayı çevreleyen volkanik kayalık tepelerde, örneğin Santa Fe'de, zemin neredeyse kıpırdamıyor. Çökme kilin olduğu yerde.",
    en: "On the volcanic rock around the basin, Santa Fe for example, the ground barely moves. Sinking follows the clay.",
  },
  whyHuman: {
    tr: "Bizim hipotezimiz: neden fiziksel (kil), tetikleyici insan (pompalama). Kaya zemindeki Peñón Viejo, Ciudad Universitaria ve Santa Fe'nin sabit kalması bunu destekliyor.",
    en: "Our hypothesis: the cause is physical (clay), the trigger is human (pumping). Rock sites such as Peñón Viejo, Ciudad Universitaria and Santa Fe staying put supports this.",
  },

  radarTitle: { tr: "Radar ne görüyor?", en: "What does the radar see?" },
  radarIntro: {
    tr: "NISAR yere mikrodalga gönderir ve geri dönen yankıyı iki şekilde dinler. Seçtiğin görüntü haritanın arka planına gelir.",
    en: "NISAR sends microwaves to the ground and listens to the echo in two ways. The view you pick becomes the map background.",
  },
  polHH: {
    tr: "HH binalara ve sert yüzeylere duyarlı. Şehir parlak, düz göl tabanı ve su koyu. Çökmeyi ölçtüğümüz faz da bu kanaldan geliyor.",
    en: "HH responds to buildings and hard surfaces. The city is bright, the flat lakebed and water are dark. The phase we use to measure sinking comes from this channel.",
  },
  polHV: {
    tr: "HV, sinyali karıştıran hacimleri öne çıkarır: ağaç taçları, ekinler. Dağlardaki orman ve Chalco tarlaları parlar, düz göl tabanı neredeyse kaybolur.",
    en: "HV highlights things that scramble the signal: tree crowns, crops. Mountain forest and the Chalco fields glow, the flat lakebed almost disappears.",
  },
  polRGB: {
    tr: "Kırmızı HH, yeşil HV, mavi HH/HV oranı. Kurumuş göl tabanı ve su koyu lacivert, düzenli sıralı bina blokları pembe, bitki ve karışık şehir dokusu yeşil görünür. Görüntü 13 Ekim 2026 tarihli gerçek NISAR GCOV verisi.",
    en: "Red is HH, green is HV, blue is the HH/HV ratio. The dry lakebed and water look dark navy, regularly aligned building blocks pink, vegetation and mixed city fabric green. Real NISAR GCOV data from 13 October 2026.",
  },
  lband: {
    tr: "NISAR'ın L-band dalgası yaklaşık 24 cm. Bitki örtüsünün içinden geçip zemine ulaştığı için tarlalarda da ölçüm kopmuyor.",
    en: "NISAR's L-band wave is about 24 cm long. It passes through vegetation to the ground, so measurements hold up over fields too.",
  },
  dotAria: { tr: "Şehir, orman, tarla, kuru göl tabanı ve su için tipik HH ve HV değerleri", en: "Typical HH and HV values for city, forest, fields, dry lakebed and water" },
  dotNote: { tr: "Tipik L-band değerleri, yaklaşık.", en: "Typical L-band values, approximate." },

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
