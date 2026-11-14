// ÖRNEK VERİ ÜRETİCİ — gerçek NISAR GUNW/GCOV çıktısı gelene kadar arayüzü beslemek için.
// Çalıştır:  node scripts/mock-data.mjs
// Çıktı:     web/public/data/  (regions.json, cdmx/points.json, cdmx/*.png)
//
// Mert/Yağız için: gerçek veriyi AYNI dosya adları ve AYNI JSON şemasıyla üretin,
// arayüz hiçbir değişiklik gerektirmeden gerçek veriyi gösterir.
// PNG kuralları:
//   disp_<YYYY-MM-DD>.png : referans tarihten o tarihe kadar birikmiş DİKEY hareket (cm),
//                           DISP_STOPS renk ölçeği, vmin..vmax arası; veri yoksa alfa=0
//   wrap_<YYYY-MM-DD>.png : aynı hareketin sarılı fazı (L-band, bir renk turu = λ/2 ≈ 11.9 cm LOS),
//                           WRAP_STOPS döngüsel renk ölçeği
//   hh.png / hv.png / rgb.png : GCOV geri saçılım (dB), gri ton; rgb = R:HH G:HV B:HH/HV
import { mkdirSync, writeFileSync } from "node:fs"
import { deflateSync } from "node:zlib"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "public", "data")
const DIR = join(OUT, "cdmx")
mkdirSync(DIR, { recursive: true })

// ---------- Küçük PNG yazıcı (RGBA) ----------
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
  ])
}

// ---------- Renk ölçekleri (web/src/lib/data.ts ile aynı) ----------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const DISP_STOPS = ["#7a1420", "#c42a2a", "#e8836b", "#f6d7c8", "#f4f4f1", "#a9c7dc", "#2d6a8f"].map(hex)
const WRAP_STOPS = ["#d7263d", "#f49d37", "#f4e04d", "#3fa66b", "#2e86ab", "#7b4fa0", "#d7263d"].map(hex)
function ramp(stops, t) {
  t = Math.min(1, Math.max(0, t)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i
  return stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f))
}

// ---------- Basit tekrarlanabilir gürültü ----------
let seed = 7
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd())
function valueNoise(w, h, cell) {
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2
  const g = Array.from({ length: gw * gh }, () => rnd() * 2 - 1)
  const s = (t) => t * t * (3 - 2 * t)
  return (x, y) => {
    const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy)
    const fx = s(gx - x0), fy = s(gy - y0), at = (i, j) => g[j * gw + i]
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx
    return a + (b - a) * fy
  }
}

// ---------- Bölge ve model ----------
const B = { south: 19.15, north: 19.6, west: -99.3, east: -98.85 }
const W = 450, H = 450
const lonOf = (x) => B.west + ((x + 0.5) / W) * (B.east - B.west)
const latOf = (y) => B.north - ((y + 0.5) / H) * (B.north - B.south)
const g2 = (lat, lon, clat, clon, r) => Math.exp(-(((lat - clat) / r) ** 2 + ((lon - clon) / r) ** 2))

// Çökme çanakları (cm/yıl, eksi = çöküyor). Literatürdeki genel deseni taklit eder, ölçüm DEĞİLDİR.
const BOWLS = [
  [19.405, -99.02, 0.05, -36], // Nezahualcóyotl / eski Texcoco kıyısı
  [19.435, -99.075, 0.035, -27], // havalimanı
  [19.355, -99.06, 0.04, -29], // Iztapalapa
  [19.265, -98.93, 0.045, -30], // Chalco
  [19.265, -99.1, 0.035, -19], // Xochimilco
  [19.43, -99.135, 0.03, -11], // tarihi merkez
]
// Göl havzası (kil) maskesi: dışında zemin volkanik kaya, hareket yok
const basin = (lat, lon) => {
  const e = ((lat - 19.38) / 0.2) ** 2 + ((lon + 99.04) / 0.2) ** 2
  const santaCatarina = g2(lat, lon, 19.31, -98.99, 0.03) // volkanik sıradağ, havza içinde sabit ada
  const cerroEstrella = g2(lat, lon, 19.343, -99.09, 0.012)
  const west = lon < -99.2 ? Math.exp(-(((lon + 99.2) / 0.025) ** 2)) : 1
  return Math.max(0, Math.min(1, (1.25 - e) * 2)) * west * (1 - santaCatarina) * (1 - cerroEstrella)
}
const nVel = valueNoise(W, H, 18)
const velAt = (lat, lon, nx = 0) => {
  let v = 0
  for (const [a, b, r, rate] of BOWLS) v += rate * g2(lat, lon, a, b, r)
  const m = basin(lat, lon)
  return v * (0.85 + 0.15 * nx) * m - 0.6 * m
}

// Tarihler: NISAR 12 günlük tekrar; 27 Tem – 10 Ağu veri boşluğu (04 Ağu yok)
const DATES = ["2026-06-17", "2026-06-29", "2026-07-11", "2026-07-23", "2026-08-16", "2026-08-28", "2026-09-09", "2026-09-21", "2026-10-03", "2026-10-15"]
const days = (d) => (new Date(d) - new Date(DATES[0])) / 864e5
const VMIN = -15, VMAX = 3
const HALF_WAVE_CM = 11.9, COS_INC = 0.8
// 0 cm her zaman ölçeğin beyaz durağına (4. durak) denk gelsin: eksi taraf 0..4, artı taraf 4..6
const dispT = (cm) => (cm <= 0 ? (Math.max(cm, VMIN) - VMIN) / -VMIN * (4 / 6) : 4 / 6 + (Math.min(cm, VMAX) / VMAX) * (2 / 6))

const vel = new Float32Array(W * H), mask = new Float32Array(W * H)
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const lat = latOf(y), lon = lonOf(x)
    vel[y * W + x] = velAt(lat, lon, nVel(x, y))
    mask[y * W + x] = basin(lat, lon)
  }

for (const date of DATES) {
  const t = days(date) / 365
  const nAtm = valueNoise(W, H, 60) // atmosferik/iyonosferik artık gürültü
  const disp = Buffer.alloc(W * H * 4), wrap = Buffer.alloc(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = (i / W) | 0
    const d = vel[i] * t + (t > 0 ? 0.35 * nAtm(x, y) : 0)
    const visible = mask[i] > 0.04 || rnd() > 0.35 // havza dışında da seyrek, sabit pikseller
    const a = visible ? 255 : 0
    const c = ramp(DISP_STOPS, dispT(d))
    disp.set([...c, a], i * 4)
    const phase = (((-d * COS_INC) / HALF_WAVE_CM) % 1 + 1) % 1
    const w = ramp(WRAP_STOPS, phase)
    wrap.set([...w, a], i * 4)
  }
  writeFileSync(join(DIR, `disp_${date}.png`), png(W, H, disp))
  writeFileSync(join(DIR, `wrap_${date}.png`), png(W, H, wrap))
}

// ---------- GCOV polarizasyon (HH, HV, kompozit) ----------
const CLASSES = {
  urban: { hh: -4, hv: -13 }, forest: { hh: -8, hv: -13.5 }, crop: { hh: -11, hv: -18 },
  lakebed: { hh: -16, hv: -27 }, water: { hh: -25, hv: -32 },
}
const nLand = valueNoise(W, H, 25)
function landAt(lat, lon, x, y) {
  if (g2(lat, lon, 19.465, -98.965, 0.012) > 0.5) return "water" // Nabor Carrillo gölü
  if (g2(lat, lon, 19.5, -98.99, 0.05) > 0.45) return "lakebed" // kuru Texcoco tabanı
  const m = basin(lat, lon)
  if (m < 0.25) return nLand(x, y) > -0.2 ? "forest" : "crop"
  if (g2(lat, lon, 19.265, -98.93, 0.06) > 0.35 || g2(lat, lon, 19.255, -99.06, 0.04) > 0.5) return nLand(x, y) > 0.35 ? "urban" : "crop"
  return "urban"
}
const hh = Buffer.alloc(W * H * 4), hv = Buffer.alloc(W * H * 4), rgb = Buffer.alloc(W * H * 4)
const toGrey = (db) => Math.round(Math.min(1, Math.max(0, (db + 30) / 28)) * 255)
for (let i = 0; i < W * H; i++) {
  const x = i % W, y = (i / W) | 0
  const c = CLASSES[landAt(latOf(y), lonOf(x), x, y)]
  const speckle = () => 2.2 * gauss()
  const h = c.hh + speckle(), v = c.hv + speckle()
  const gh = toGrey(h), gv = toGrey(v + 6)
  hh.set([gh, gh, gh, 255], i * 4)
  hv.set([gv, gv, gv, 255], i * 4)
  const ratio = Math.round(Math.min(1, Math.max(0, (h - v - 4) / 14)) * 255)
  rgb.set([gh, gv, ratio, 255], i * 4)
}
writeFileSync(join(DIR, "hh.png"), png(W, H, hh))
writeFileSync(join(DIR, "hv.png"), png(W, H, hv))
writeFileSync(join(DIR, "rgb.png"), png(W, H, rgb))

// ---------- Noktalar ----------
const POINTS = [
  { id: "neza", name: "Nezahualcóyotl", lat: 19.4, lon: -99.015, note: { tr: "Eski Texcoco gölünün kıyısında, kalın kil üstünde kurulu", en: "Built on thick clay at the edge of former Lake Texcoco" } },
  { id: "aicm", name: { tr: "Havalimanı (AICM)", en: "Airport (AICM)" }, lat: 19.436, lon: -99.072, note: { tr: "Pistler her yıl yeniden düzleştiriliyor", en: "Runways need regular re-levelling" } },
  { id: "iztapalapa", name: "Iztapalapa", lat: 19.357, lon: -99.058, note: { tr: "Yoğun kuyu alanı; yollarda ve evlerde çatlaklar", en: "Dense well field; cracks in roads and homes" } },
  { id: "chalco", name: "Chalco", lat: 19.265, lon: -98.93, note: { tr: "Çöken zeminde 1980'lerden beri yeni bir göl oluştu", en: "A new lake has formed on the sinking ground since the 1980s" } },
  { id: "xochimilco", name: "Xochimilco", lat: 19.262, lon: -99.1, note: { tr: "Kanallar ve tarlalar; kuyular şehre su veriyor", en: "Canals and fields; wells here supply the city" } },
  { id: "zocalo", name: { tr: "Zócalo (tarihi merkez)", en: "Zócalo (historic centre)" }, lat: 19.433, lon: -99.133, note: { tr: "Katedral bir yana eğik; onlarca yıldır destekleniyor", en: "The cathedral leans; it has been shored up for decades" } },
  { id: "angel", name: { tr: "Bağımsızlık Anıtı", en: "Angel of Independence" }, lat: 19.427, lon: -99.168, note: { tr: "Zemin çöktükçe anıtın tabanına 14 basamak eklendi", en: "14 steps were added to its base as the ground sank around it" } },
  { id: "santafe", name: "Santa Fe", lat: 19.36, lon: -99.26, note: { tr: "Havza dışında, kaya zemin: neredeyse sabit", en: "Outside the basin, on rock: nearly stable" } },
]
const points = POINTS.map((p) => {
  const rate = velAt(p.lat, p.lon, 0.3)
  const series = DATES.map((date) => {
    const t = days(date) / 365
    return { date, disp_cm: +(t === 0 ? 0 : rate * t + 0.25 * gauss()).toFixed(2) }
  })
  const name = typeof p.name === "string" ? { tr: p.name, en: p.name } : p.name
  return { ...p, name, rate_cm_yr: +rate.toFixed(1), s1_rate_cm_yr: +(rate * (0.93 + 0.12 * rnd())).toFixed(1), series }
})
writeFileSync(join(DIR, "points.json"), JSON.stringify({ note: "ÖRNEK VERİ / MOCK DATA", points }, null, 1))

const regions = [
  {
    id: "cdmx",
    name: { tr: "Mexico City", en: "Mexico City" },
    center: [19.38, -99.08],
    zoom: 11,
    bounds: [[B.south, B.west], [B.north, B.east]],
    source: { status: "mock", sensor: "NISAR L-band HH", product: "L2 GUNW + L2 GCOV", maturity: "provisional", track: "—" },
    dates: DATES,
    gap: ["2026-07-27", "2026-08-10"],
    disp_range_cm: [VMIN, VMAX],
    half_wave_cm: HALF_WAVE_CM,
    dir: "cdmx",
  },
]
writeFileSync(join(OUT, "regions.json"), JSON.stringify({ note: "ÖRNEK VERİ / MOCK DATA", regions }, null, 1))
console.log(`OK: ${DATES.length * 2 + 3} PNG, points.json, regions.json -> ${OUT}`)
