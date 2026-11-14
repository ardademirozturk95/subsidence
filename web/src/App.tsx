import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { SinkMap } from "@/components/SinkMap"
import { Timeline } from "@/components/Timeline"
import { SeriesChart } from "@/components/SeriesChart"
import { PolCompare } from "@/components/PolCompare"
import { PointPicker } from "@/components/PointPicker"
import { Everyday } from "@/components/Everyday"
import { fmtCm, fmtDate, loadAll, type Backdrop, type Fringes, type Point, type Region, type TiltMeta, type View } from "@/lib/data"
import { I18nProvider, useI18n, type Key } from "@/lib/i18n"

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}

/*
  Yerleşim (masaüstü):
  ┌ başlık ─────────────────────────────────────────────┐
  │ bölge + sayılar │                    │ grafik       │
  │─────────────────│  HARİTA OYNATICI   │──────────────│
  │ polarizasyon    │  (zaman çizgisi)   │ insan etkisi │
  └─────────────────────────────────────────────────────┘
  NISAR'ın geleceği + yöntem (altta, tam genişlik)
  Mobilde sıra: harita, bölge, grafik, hikâye, polarizasyon, gelecek.
*/
function Shell() {
  const { t, lang, setLang } = useI18n()
  const [data, setData] = useState<{ region: Region; points: Point[]; fringes: Fringes | null; tilt: TiltMeta | null } | null>(null)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<View>("disp")
  const backdrop: Backdrop = "map"
  const [selectedId, setSelectedId] = useState("neza")
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  const handleView = (v: View) => {
    setView(v)
    if (v === "tilt") setPlaying(false)
  }
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try { localStorage.setItem("theme", dark ? "dark" : "light") } catch { /* depolama kapalı olabilir */ }
  }, [dark])

  useEffect(() => {
    loadAll()
      .then((d) => {
        setData(d)
        setIndex(d.region.dates.length - 1)
      })
      .catch(() => setError(true))
  }, [])

  const region = data?.region
  const point = data?.points.find((p) => p.id === selectedId)
  const verified = region?.source.status === "verified"

  return (
    <div className="min-h-svh bg-paper text-ink">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 pt-4 lg:px-5 lg:pt-5">
        <div className="flex min-w-0 items-start gap-3">
          <Logo />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[1.9rem] leading-none font-semibold sm:text-[2.2rem]">{t("title")}</h1>
              {region && (
                <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {verified ? t("verified") : t("mock")}, {region.source.maturity}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-[80ch] text-[15px] text-pretty">{t("subtitle")}</p>
            {region && (
              <p className="num mt-1 text-[11px] text-muted-foreground">
                {region.source.sensor}, {region.source.product}, track {region.source.track}, {fmtDate(region.dates[0], lang, true)} – {fmtDate(region.dates[region.dates.length - 1], lang, true)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Dil / Language" className="inline-flex rounded-md border border-border bg-card2 p-0.5">
            {(["tr", "en"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)}
                className={`rounded-[5px] px-2.5 py-1 text-xs font-medium uppercase focus-visible:outline-2 focus-visible:outline-ring ${lang === l ? "bg-ink text-paper" : "text-muted-foreground hover:text-ink"}`}>
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setDark(!dark)} aria-label={t("themeToggle")} title={t("themeToggle")}
            className="grid size-8 place-items-center rounded-md border border-border bg-card2 hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-ring">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="card m-5 border-l-4 border-l-staff p-4">{t("loadError")}</p>}
      {!error && (!data || !region) && <p className="m-5 text-muted-foreground" aria-live="polite">{t("loading")}…</p>}

      {data && region && point && (
        <>
          <main className="grid gap-4 p-4 lg:p-5 xl:h-[calc(100svh-104px)] xl:grid-cols-[minmax(290px,330px)_minmax(0,1fr)_minmax(310px,360px)] lg:grid-cols-2">
            {/* Orta: harita oynatıcı */}
            <section className="card flex min-h-[80svh] flex-col overflow-hidden lg:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:min-h-0" aria-label={t("mapLabel")}>
              <ViewSwitch view={view} onView={handleView} fringes={data.fringes} date={region.dates[index]} />
              <div className="relative min-h-[56svh] flex-1">
                <SinkMap region={region} points={data.points} date={region.dates[index]} view={view} fringes={data.fringes} tilt={data.tilt}
                  backdrop={backdrop} selectedId={selectedId} onSelect={setSelectedId} dark={dark} />
              </div>
              <div
                aria-disabled={view === "tilt"}
                title={view === "tilt" ? t("tiltStaticHint") : undefined}
                className={`border-t border-border transition-opacity ${view === "tilt" ? "pointer-events-none opacity-40 select-none" : ""}`}
              >
                <Timeline region={region} index={index} onIndex={setIndex} playing={playing} onPlaying={setPlaying} />
              </div>
            </section>

            {/* Sol üst: bölge ve sayılar */}
            <Panel className="xl:col-start-1 xl:row-start-1 xl:overflow-y-auto">
              <RegionPanel points={data.points} point={point} region={region} index={index} onSelect={setSelectedId} />
            </Panel>

            {/* Sağ üst: grafik */}
            <Panel className="xl:col-start-3 xl:row-start-1 xl:overflow-y-auto">
              <h2 className="font-display text-xl leading-tight font-semibold">{t("chartTitle2")}</h2>
              <p className="mb-2 text-sm text-muted-foreground">{t("pointTitle", { n: point.name[lang], k: region.dates.length })}</p>
              <SeriesChart point={point} region={region} index={index} />
            </Panel>

          </main>

          {/* Aşağı kaydırınca: tam genişlikte, iç kaydırmasız bölümler */}
          <div className="space-y-4 px-4 pb-4 lg:px-5 lg:pb-5">
            <section className="card p-5 lg:p-8" aria-labelledby="story-h">
              <Story />
            </section>
            <section className="card p-5 lg:p-8" aria-labelledby="pol-h">
              <PolCompare region={region} />
            </section>
          </div>

          <Footer region={region} />
        </>
      )}
    </div>
  )
}

function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`card p-5 ${className}`}>{children}</section>
}

function ViewSwitch({ view, onView, fringes, date }: { view: View; onView: (v: View) => void; fringes: Fringes | null; date: string }) {
  const { t, lang } = useI18n()
  const fr = fringes?.dates.find((d) => d.date === date)
  const num = (v: number) => v.toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: 1 })
  const opts: [View, Key][] = [["disp", "viewDisp"], ["wrap", "viewWrap"], ["swipe", "viewSwipe"], ["tilt", "viewTilt"]]
  return (
    <div className="border-b border-border px-4 py-2 md:px-5">
      <div role="radiogroup" aria-label={t("viewLabel")} className="inline-flex flex-wrap rounded-md bg-ink/[0.06] p-0.5">
        {opts.map(([v, k]) => (
          <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => onView(v)}
            className={`rounded-[5px] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-staff ${view === v ? "bg-ink text-paper" : "text-ink/75 hover:text-ink"}`}>
            {t(k)}
          </button>
        ))}
      </div>
      {fr && (view === "wrap" || view === "swipe") && (
        <p className="mt-2 max-w-3xl text-sm leading-snug">
          <span className="font-semibold">{t("storyTitleL")}. </span>
          {t("storyL", { cm: num(fr.max_los_cm), l: num(fr.rings_l) })}
        </p>
      )}
      {view === "tilt" && (
        <p className="mt-2 max-w-3xl text-sm leading-snug">
          <span className="font-semibold">{t("tiltStoryTitle")}. </span>
          {t("tiltStory")}
        </p>
      )}
    </div>
  )
}

function RegionPanel({ points, point, region, index, onSelect }: { points: Point[]; point: Point; region: Region; index: number; onSelect: (id: string) => void }) {
  const { t, lang, pick } = useI18n()
  void pick
  const cur = point.series[index]?.disp_cm ?? 0
  const stable = Math.abs(point.rate_cm_yr) < 2
  const nf = (v: number, d = 1) => Math.abs(v).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })
  const p1 = (region as Region & { stats?: { vertical_rate_p1_cm_yr?: number } }).stats?.vertical_rate_p1_cm_yr
  return (
    <div aria-live="polite">
      <PointPicker points={points} value={point.id} region={region} onSelect={onSelect} />
      <p className="mt-2 text-sm text-ink/75">{pick(point.note)}</p>

      <div className="mt-4">
        <div className={`font-display text-6xl leading-none font-semibold tabular-nums ${stable ? "text-ink" : "text-staff"}`}>
          {fmtCm(cur, lang)}<span className="ml-1 text-3xl">cm</span>
        </div>
        <div className="mt-1 text-sm">{t("statSince", { d: fmtDate(region.dates[0], lang, true) })}, {fmtDate(region.dates[index], lang, true)}</div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t("statRate")}</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{nf(point.rate_cm_yr)} <span className="text-base font-bold">cm</span></dd>
        </div>
        {p1 != null && (
          <div>
            <dt className="text-xs text-muted-foreground">{t("statMap")}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{nf(p1)} <span className="text-base font-bold">cm</span></dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted-foreground">{t("statPasses")}</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{region.dates.length}</dd>
        </div>
      </dl>
      <Everyday rate={point.rate_cm_yr} />
    </div>
  )
}

const SOURCES: [string, string][] = [
  ["Carrillo 1947, Influence of Artesian Wells in the Sinking of Mexico City", "https://www.semanticscholar.org/paper/Influence-of-Artesian-Wells-in-the-Sinking-of-City-Carrillo/bb4a5a13383dcfdfbee711f82b894f021c5c8e25"],
  ["Chaussard et al. 2021, JGR Solid Earth", "https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020JB020648"],
  ["Cigna & Tapete 2021, Remote Sensing of Environment", "https://doi.org/10.1016/j.rse.2020.112161"],
  ["Solano-Rojas et al. 2024, Scientific Reports", "https://doi.org/10.1038/s41598-024-53525-y"],
  ["Managed aquifer recharge in Mexico City (review), PMC", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9543496/"],
  ["NASA/JPL 2026, US-Indian spacecraft captures Mexico City subsidence", "https://www.jpl.nasa.gov/images/pia26709-us-indian-spacecraft-captures-mexico-city-subsidence/"],
  ["Conagua, acuífero 0901 Zona Metropolitana de la Cd. de México (recarga, extracción, disponibilidad)", "https://www.gob.mx/conagua/acciones-y-programas/c"],
  ["Conagua, DR_0901 disponibilidad media anual (documento técnico)", "https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/cmdx/DR_0901.pdf"],
  ["Milenio (Conagua: acuífero más crítico)", "https://amp.milenio.com/comunidad/entre-eficiencia-y-trasvases-alternativa-contra-crisis-hidrica-en-cdmx"],
  ["Infobae 2025, grietas en Iztapalapa", "https://www.infobae.com/mexico/2025/06/27/sobreexplotacion-del-acuifero-agrava-grietas-en-la-cdmx-hay-seguimiento-permanente-advierte-sheinbaum/"],
  ["Milenio, resurge lago en Chalco", "https://amp.milenio.com/estados/resurge-lago-chalco-pone-riesgo-80-mil"],
]

/** Çökmenin nedeni: insan etkisini öne çıkaran neden-sonuç zinciri. Gerçekten bir sıra olduğu için numaralı. */
function Story() {
  const { t } = useI18n()
  const steps: [Key, Key, Key, Key][] = [
    ["sf1", "sfl1", "st1T", "st1"], ["sf2", "sfl2", "st2T", "st2"], ["sf3", "sfl3", "st3T", "st3"],
    ["sf4", "sfl4", "st4T", "st4"], ["sf5", "sfl5", "st5T", "st5"],
  ]
  return (
    <div>
      <div className="max-w-3xl">
        <h2 id="story-h" className="font-display text-3xl leading-tight font-semibold lg:text-4xl">{t("storyTitle")}</h2>
        <p className="mt-2 text-base leading-relaxed text-ink/80">{t("storyIntro")}</p>
      </div>
      <ol className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {steps.map(([fig, figL, h, b], i) => (
          <li key={h} className="flex flex-col border-t-2 border-staff pt-3">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="font-display mt-1 text-4xl leading-none font-semibold tabular-nums text-staff">{t(fig)}</span>
            <span className="mt-1 text-xs text-muted-foreground">{t(figL)}</span>
            <h3 className="mt-3 text-[15px] leading-snug font-semibold">{t(h)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t(b)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 grid gap-6 border-t border-border pt-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="border-l-2 border-staff pl-3 text-base leading-relaxed font-medium">{t("storyMap")}</p>
          <p className="text-sm leading-relaxed text-ink/80">{t("whyBlind")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("storyJpl")} {t("whyCheck")}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <h3 className="text-sm font-semibold text-ink/80">{t("sourcesLabel")}</h3>
          <ul className="mt-2 space-y-1.5">
            {SOURCES.map(([label, href]) => (
              <li key={href}><a href={href} target="_blank" rel="noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Footer({ region }: { region: Region }) {
  const { t, lang } = useI18n()
  return (
    <footer className="px-4 pb-6 lg:px-5">
      <div className="card grid gap-x-8 gap-y-6 p-5 lg:grid-cols-[1fr_1fr_1fr_minmax(280px,1.1fr)]">
        <h2 className="font-display text-2xl leading-tight font-semibold lg:col-span-4">{t("futureTitle")}</h2>
        <p className="text-sm leading-relaxed">{t("future1")}</p>
        <p className="text-sm leading-relaxed">{t("future2")}</p>
        <p className="text-sm leading-relaxed">{t("future3")}</p>
        <div className="space-y-2 lg:border-l lg:border-border lg:pl-6">
          <h3 className="text-sm font-bold">{t("howTitle")}</h3>
          <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed marker:font-semibold marker:text-ink/60">
            <li>{t("how1")}</li>
            <li>{t("how2")}</li>
            <li>{t("how3")}</li>
            <li>{t("how4")}</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            {t("sourceLine", { sensor: region.source.sensor, product: region.source.product, maturity: region.source.maturity, track: region.source.track, g0: fmtDate(region.gap[0], lang), g1: fmtDate(region.gap[1], lang) })}
          </p>
        </div>
      </div>
    </footer>
  )
}

/** Mira (nivelman çubuğu) logosu: kırmızı-beyaz bloklar, altında zemin çizgisi. */
function Logo() {
  return (
    <svg viewBox="0 0 24 32" className="h-8 w-6 shrink-0" aria-hidden="true">
      <rect x="7" y="1" width="10" height="26" fill="var(--color-card2)" stroke="var(--color-ink)" strokeWidth="1.5" />
      {[0, 2, 4].map((i) => <rect key={i} x="7.75" y={1.75 + i * 5} width="4.5" height="5" fill="var(--color-staff)" />)}
      <path d="M0 29h24" stroke="var(--color-ink)" strokeWidth="2" />
      <path d="M2 31.5h20" stroke="var(--color-ink)" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  )
}
