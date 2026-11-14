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
  s1_rate_cm_yr: number | null  // Sentinel-1 uzun dönem hızı; yoksa null
  series: Sample[]
}

export type View = "disp" | "wrap" | "swipe"
export type Backdrop = "map" | "hh" | "hv" | "rgb"

const base = import.meta.env.BASE_URL
export const dataUrl = (path: string) => `${base}data/${path}`
export const frameUrl = (r: Region, kind: "disp" | "wrap", date: string) => dataUrl(`${r.dir}/${kind}_${date}.png`)
export const polUrl = (r: Region, pol: Exclude<Backdrop, "map">) => dataUrl(`${r.dir}/${pol}.png`)

export async function loadAll(): Promise<{ region: Region; points: Point[] }> {
  const regions = await fetch(dataUrl("regions.json")).then((r) => r.json())
  const region: Region = regions.regions[0]
  const pts = await fetch(dataUrl(`${region.dir}/points.json`)).then((r) => r.json())
  return { region, points: pts.points }
}

// Renk ölçekleri — scripts/mock-data.mjs ile birebir aynı olmalı.
export const DISP_STOPS = ["#7a1420", "#c42a2a", "#e8836b", "#f6d7c8", "#f4f4f1", "#d4e2ec", "#a9c7dc"]
export const WRAP_STOPS = ["#d7263d", "#f49d37", "#f4e04d", "#3fa66b", "#2e86ab", "#7b4fa0", "#d7263d"]

function hexToRgb(h: string) {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
}
// 0 cm her zaman beyaz durağa (index 4) düşer; eksi taraf 0..4, artı taraf 4..6 durakları kullanır.
export const dispT = (cm: number, [vmin, vmax]: [number, number]) =>
  cm <= 0 ? ((Math.max(cm, vmin) - vmin) / -vmin) * (4 / 6) : 4 / 6 + (Math.min(cm, vmax) / vmax) * (2 / 6)
export const dispGradient = ([vmin, vmax]: [number, number]) => {
  const zero = (-vmin / (vmax - vmin)) * 100
  const at = (i: number) => (i <= 4 ? (i / 4) * zero : zero + ((i - 4) / 2) * (100 - zero))
  return `linear-gradient(90deg, ${DISP_STOPS.map((c, i) => `${c} ${at(i).toFixed(1)}%`).join(", ")})`
}
export function dispColor(cm: number, range: [number, number]) {
  const stops = DISP_STOPS.map(hexToRgb)
  let t = dispT(cm, range) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t))
  t -= i
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * t))
  return `rgb(${c.join(",")})`
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
