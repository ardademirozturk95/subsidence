import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { SinkMap } from "@/components/SinkMap"
import { Timeline } from "@/components/Timeline"
import { SeriesChart } from "@/components/SeriesChart"
import { PolCompare } from "@/components/PolCompare"
import { fmtCm, fmtDate, loadAll, type Backdrop, type Fringes, type Point, type Region, type View } from "@/lib/data"
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
  const [data, setData] = useState<{ region: Region; points: Point[]; fringes: Fringes | null } | null>(null)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<View>("disp")
  const [backdrop, setBackdrop] = useState<Backdrop>("map")
  const [selectedId, setSelectedId] = useState("neza")
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
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
          <main className="grid gap-4 p-4 lg:h-[calc(100svh-104px)] lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(320px,380px)] lg:grid-rows-[minmax(0,auto)_minmax(0,1fr)] lg:p-5">
            {/* Orta: harita oynatıcı */}
            <section className="card flex min-h-[80svh] flex-col overflow-hidden lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0" aria-label={t("mapLabel")}>
              <ViewSwitch view={view} onView={setView} fringes={data.fringes} date={region.dates[index]} />
              <div className="relative min-h-[56svh] flex-1">
                <SinkMap region={region} points={data.points} date={region.dates[index]} view={view} fringes={data.fringes}
                  backdrop={backdrop} selectedId={selectedId} onSelect={setSelectedId} dark={dark} />
              </div>
              <div className="border-t border-border">
                <Timeline region={region} index={index} onIndex={setIndex} playing={playing} onPlaying={setPlaying} />
              </div>
            </section>

            {/* Sol üst: bölge ve sayılar */}
            <Panel className="lg:col-start-1 lg:row-start-1">
              <RegionPanel points={data.points} point={point} region={region} index={index} onSelect={setSelectedId} />
            </Panel>

            {/* Sağ üst: grafik */}
            <Panel className="lg:col-start-3 lg:row-start-1">
              <h2 className="font-display text-xl leading-tight font-semibold">{t("chartTitle2")}</h2>
              <p className="mb-2 text-sm text-muted-foreground">{t("pointTitle", { n: point.name[lang], k: region.dates.length })}</p>
              <SeriesChart point={point} region={region} index={index} />
            </Panel>

            {/* Sağ alt: insan etkisi hikâyesi */}
            <Panel className="lg:col-start-3 lg:row-start-2 lg:overflow-y-auto">
              <Story />
            </Panel>

            {/* Sol alt: polarizasyon karşılaştırıcı */}
            <Panel className="lg:col-start-1 lg:row-start-2 lg:overflow-y-auto">
              <PolCompare region={region} backdrop={backdrop} onBackdrop={setBackdrop} />
            </Panel>
          </main>

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
  const opts: [View, Key][] = [["disp", "viewDisp"], ["wrap", "viewWrap"], ["swipe", "viewSwipe"]]
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
      {fr && view !== "disp" && (
        <p className="mt-2 max-w-3xl text-sm leading-snug">
          <span className="font-semibold">{t("storyTitleL")}. </span>
          {t("storyL", { cm: num(fr.max_los_cm), l: num(fr.rings_l) })}
        </p>
      )}
    </div>
  )
}

function RegionPanel({ points, point, region, index, onSelect }: { points: Point[]; point: Point; region: Region; index: number; onSelect: (id: string) => void }) {
  const { t, lang, pick } = useI18n()
  const cur = point.series[index]?.disp_cm ?? 0
  const stable = Math.abs(point.rate_cm_yr) < 2
  const nf = (v: number, d = 1) => Math.abs(v).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })
  const p1 = (region as Region & { stats?: { vertical_rate_p1_cm_yr?: number } }).stats?.vertical_rate_p1_cm_yr
  return (
    <div aria-live="polite">
      <label className="block">
        <span className="sr-only">{t("regionPick")}</span>
        <select
          value={point.id}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-md border border-border bg-card2 bg-[length:14px] bg-[right_10px_center] bg-no-repeat py-1.5 pr-8 pl-2.5 font-display text-2xl leading-tight font-semibold focus-visible:outline-2 focus-visible:outline-staff"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 6l5 5 5-5' fill='none' stroke='%236a675f' stroke-width='2'/%3E%3C/svg%3E\")" }}
        >
          {points.map((p) => <option key={p.id} value={p.id}>{pick(p.name)}</option>)}
        </select>
      </label>
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
      {stable && <p className="mt-3 text-sm font-medium">{t("statStable")}</p>}
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
  ["La Silla Rota 2025 (Conagua: recarga y extracción)", "https://lasillarota.com/metropoli/2025/9/6/cdmx-hundimiento-alcanza-42-cm-anuales-por-extraccion-de-agua-467591.html"],
  ["Milenio (Conagua: acuífero más crítico)", "https://amp.milenio.com/comunidad/entre-eficiencia-y-trasvases-alternativa-contra-crisis-hidrica-en-cdmx"],
  ["Infobae 2025, grietas en Iztapalapa", "https://www.infobae.com/mexico/2025/06/27/sobreexplotacion-del-acuifero-agrava-grietas-en-la-cdmx-hay-seguimiento-permanente-advierte-sheinbaum/"],
  ["Milenio, resurge lago en Chalco", "https://amp.milenio.com/estados/resurge-lago-chalco-pone-riesgo-80-mil"],
]

/** Sağ alt: çökmenin nedeni, insan etkisini öne çıkaran neden-sonuç zinciri (gerçekten bir sıra olduğu için numaralı). */
function Story() {
  const { t } = useI18n()
  const steps: [Key, Key][] = [["st1T", "st1"], ["st2T", "st2"], ["st3T", "st3"], ["st4T", "st4"], ["st5T", "st5"]]
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl leading-tight font-semibold">{t("storyTitle")}</h2>
      <p className="text-sm leading-relaxed">{t("storyIntro")}</p>
      <ol className="space-y-3">
        {steps.map(([h, b], i) => (
          <li key={h} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
            <span className="font-display text-xl leading-none font-semibold text-staff tabular-nums">{i + 1}</span>
            <div>
              <h3 className="text-sm font-bold">{t(h)}</h3>
              <p className="text-sm leading-relaxed text-ink/85">{t(b)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-l-2 border-staff pl-3 text-sm leading-relaxed font-medium">{t("storyMap")}</p>
      <p className="text-sm leading-relaxed text-ink/80">{t("whyBlind")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("storyJpl")} {t("whyCheck")}</p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-ink/70">{t("sourcesLabel")}</summary>
        <ul className="mt-2 space-y-1">
          {SOURCES.map(([label, href]) => (
            <li key={href}><a href={href} target="_blank" rel="noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">{label}</a></li>
          ))}
        </ul>
      </details>
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
