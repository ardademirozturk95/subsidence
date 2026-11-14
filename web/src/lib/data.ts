// Veri tipleri, yükleyiciler ve renk ölçekleri.
// public/data/ altındaki dosyalar GERÇEK NISAR verisi (backend/export_web.py, backend/gcov_subset.py).
// Mert ve Yağız gerçek NISAR çıktısını AYNI şemayla koyunca arayüz değişmeden çalışır.

export type Lang = "tr" | "en"
export type L10n = Record<Lang, string>

export type Region = {
  id: string
  name: L10n
  center: [number, number]
  zoom: number
  bounds: [[number, number], [number, number]]
  source: { status: "mock" | "verified"; sensor: string; product: string; maturity: string; track: string }
  dates: string[]
  gap: [string, string]
  disp_range_cm: [number, number]
  half_wave_cm: number
  colors?: { disp_stops_cm: [number, string][]; wrap_stops: [number, string][] }
  dir: string
}

export type Sample = { date: string; disp_cm: number }
export type Point = {
  id: string
  name: L10n
  note: L10n
  lat: number
  lon: number
  rate_cm_yr: number
  series: Sample[]
}

export type View = "disp" | "wrap" | "swipe"
export type Fringes = {
  l_half_wave_cm: number
  dates: { date: string; max_los_cm: number; rings_l: number }[]
}
export type Backdrop = "map" | "hh" | "hv" | "rgb"

const base = import.meta.env.BASE_URL
export const dataUrl = (path: string) => `${base}data/${path}`
export const frameUrl = (r: Region, kind: "disp" | "lwrap", date: string) => dataUrl(`${r.dir}/${kind}_${date}.png`)
export const polUrl = (r: Region, pol: Exclude<Backdrop, "map">) => dataUrl(`${r.dir}/${pol}.png`)

export async function loadAll(): Promise<{ region: Region; points: Point[]; fringes: Fringes | null }> {
  const regions = await fetch(dataUrl("regions.json")).then((r) => r.json())
  const region: Region = regions.regions[0]
  const pts = await fetch(dataUrl(`${region.dir}/points.json`)).then((r) => r.json())
  // Halka simülasyonu isteğe bağlı: dosya yoksa site yine çalışır
  const raw = await fetch(dataUrl(`${region.dir}/fringes.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  return { region, points: pts.points, fringes: normalizeFringes(raw, region) }
}

// fringes.json iki biçimde gelebilir: bizim {dates:[{date,max_los_cm,rings_l}]} ya da
// backend/export_web.py'nin {series:[{L, los_cm}]} (tarihler regions.json ile aynı sırada). İkisini tek biçime çevir.
function normalizeFringes(raw: unknown, region: Region): Fringes | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { dates?: Fringes["dates"]; series?: { L: number; los_cm: number }[]; l_half_wave_cm?: number }
  if (Array.isArray(r.dates)) return { l_half_wave_cm: r.l_half_wave_cm ?? region.half_wave_cm, dates: r.dates }
  if (Array.isArray(r.series))
    return {
      l_half_wave_cm: region.half_wave_cm,
      dates: r.series.map((s, i) => ({ date: region.dates[i], max_los_cm: Math.abs(s.los_cm), rings_l: s.L })),
    }
  return null
}

// Renk ölçekleri — scripts/mock-data.mjs ile birebir aynı olmalı.
export const DISP_STOPS = ["#7a1420", "#c42a2a", "#e8836b", "#f6d7c8", "#f4f4f1", "#d4e2ec", "#a9c7dc"]
export const WRAP_STOPS = ["#d7263d", "#f49d37", "#f4e04d", "#3fa66b", "#2e86ab", "#7b4fa0", "#d7263d"]

function hexToRgb(h: string) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
}
// Renk ölçeği regions.json > colors > disp_stops_cm'ten (cm konumlu duraklar). Yoksa eski sabit duraklar.
function stopsOf(r: Region): [number, string][] {
  if (r.colors?.disp_stops_cm?.length) return r.colors.disp_stops_cm
  const [vmin, vmax] = r.disp_range_cm
  return DISP_STOPS.map((c, i) => [i <= 4 ? vmin * (1 - i / 4) : (vmax * (i - 4)) / 2, c] as [number, string])
}
export const dispGradient = (r: Region) => {
  const [vmin, vmax] = r.disp_range_cm
  return `linear-gradient(90deg, ${stopsOf(r).map(([cm, c]) => `${c} ${(((cm - vmin) / (vmax - vmin)) * 100).toFixed(1)}%`).join(", ")})`
}
export const wrapGradient = (r: Region, kind: "linear" | "conic" = "conic") => {
  const st = r.colors?.wrap_stops?.length ? r.colors.wrap_stops : WRAP_STOPS.map((c, i) => [i / (WRAP_STOPS.length - 1), c] as [number, string])
  return `${kind}-gradient(${kind === "linear" ? "90deg, " : ""}${st.map(([t, c]) => `${c} ${(t * 100).toFixed(1)}%`).join(", ")})`
}
export function dispColor(cm: number, r: Region) {
  const st = stopsOf(r)
  if (cm <= st[0][0]) return st[0][1]
  if (cm >= st[st.length - 1][0]) return st[st.length - 1][1]
  const k = st.findIndex(([v]) => v >= cm)
  const [a, ca] = st[k - 1], [b, cb] = st[k]
  const f = (cm - a) / (b - a)
  const A = hexToRgb(ca), B = hexToRgb(cb)
  return `rgb(${A.map((v, n) => Math.round(v + (B[n] - v) * f)).join(",")})`
}

export const days = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 864e5

export const fmtDate = (d: string, lang: Lang, long = false) =>
  new Date(d + "T12:00:00Z").toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: long ? "long" : "short",
    ...(long ? { year: "numeric" } : {}),
  })

export const fmtCm = (v: number, lang: Lang, digits = 1) =>
  (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(v).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits })

// GERÇEK ÖLÇÜM: NISAR L2 GCOV, track 19, 13 Eki 2026 (backend/out/gcov_cdmx.npz), dB ortanca.
// Pencere ±0,005° (~1 km), su için ±0,002°. Merkezler: şehir Zócalo 19,433/−99,133; orman Ajusco eteği 19,20/−99,25;
// tarla Chalco 19,23/−98,90; kuru göl tabanı Texcoco 19,50/−98,99; su Nabor Carrillo gölü 19,465/−98,965.
export const BACKSCATTER: { cls: L10n; hh: number; hv: number }[] = [
  { cls: { tr: "Şehir", en: "City" }, hh: -1.9, hv: -8.0 },
  { cls: { tr: "Orman", en: "Forest" }, hh: -3.9, hv: -9.2 },
  { cls: { tr: "Tarla", en: "Fields" }, hh: -7.4, hv: -13.0 },
  { cls: { tr: "Kuru göl tabanı", en: "Dry lakebed" }, hh: -9.3, hv: -16.6 },
  { cls: { tr: "Su", en: "Water" }, hh: -15.7, hv: -21.5 },
]
