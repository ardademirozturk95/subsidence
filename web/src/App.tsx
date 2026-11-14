import { useEffect, useState } from "react"
import { SinkMap } from "@/components/SinkMap"
import { Timeline } from "@/components/Timeline"
import { Staff } from "@/components/Staff"
import { SeriesChart } from "@/components/SeriesChart"
import { RadarCard } from "@/components/RadarCard"
import { fmtCm, fmtDate, loadAll, type Backdrop, type Band, type Fringes, type Point, type Region, type View } from "@/lib/data"
import { I18nProvider, useI18n } from "@/lib/i18n"

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}

function Shell() {
  const { t, lang, setLang } = useI18n()
  const [data, setData] = useState<{ region: Region; points: Point[]; fringes: Fringes | null } | null>(null)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<View>("disp")
  const [band, setBand] = useState<Band>("L")
  const [backdrop, setBackdrop] = useState<Backdrop>("map")
  const [selectedId, setSelectedId] = useState("neza")

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
  const mock = region?.source.status !== "verified"

  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink lg:h-svh">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink/15 px-4 py-3 md:px-5">
        <Logo />
        <h1 className="font-display text-[1.75rem] leading-none font-extrabold">{t("title")}</h1>
        <span className="text-sm text-muted-foreground max-md:hidden">{lang === "tr" ? "NISAR L-band, Kas 2025 – Eki 2026" : "NISAR L-band, Nov 2025 – Oct 2026"}</span>
        <div className="ml-auto flex items-center gap-3">
          {region && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${mock ? "bg-staff/10 text-staff" : "bg-lake/10 text-lake"}`}
              title={mock ? t("mockHint") : undefined}
            >
              <span className={`size-1.5 rounded-full ${mock ? "bg-staff" : "bg-lake"}`} />
              {mock ? t("mock") : t("verified")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            lang={lang === "tr" ? "en" : "tr"}
            className="rounded-md border border-ink/25 px-3 py-1.5 text-sm font-semibold hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff"
          >
            {t("langSwitch")}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="m-5 border-l-4 border-staff bg-white p-4">{t("loadError")}</p>}
      {!error && (!data || !region) && <p className="m-5 text-muted-foreground" aria-live="polite">{t("loading")}…</p>}

      {data && region && (
        <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(360px,420px)_1fr]">
          <section className="flex min-h-[78svh] flex-col border-ink/15 lg:order-2 lg:min-h-0 lg:border-l">
            <ViewSwitch view={view} onView={setView} band={band} onBand={setBand} fringes={data.fringes} date={region.dates[index]} />
            <div className="relative min-h-[56svh] flex-1">
              <SinkMap
                region={region}
                points={data.points}
                date={region.dates[index]}
                view={view}
                band={band}
                fringes={data.fringes}
                backdrop={backdrop}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div className="border-t border-ink/15 bg-white/60">
              <Timeline region={region} index={index} onIndex={setIndex} playing={playing} onPlaying={setPlaying} />
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto lg:order-1">
            <div className="space-y-8 px-4 py-6 md:px-6">
              <p className="max-w-prose text-[15px] leading-relaxed">{t("lede")}</p>
              {point ? <PointPanel point={point} region={region} index={index} /> : <p className="text-muted-foreground">{t("pickPoint")}</p>}
              <Why />
              <RadarCard backdrop={backdrop} onBackdrop={setBackdrop} />
              <Future />
              <How region={region} />
            </div>
          </aside>
        </main>
      )}
    </div>
  )
}

type VSProps = { view: View; onView: (v: View) => void; band: Band; onBand: (b: Band) => void; fringes: Fringes | null; date: string }
function ViewSwitch({ view, onView, band, onBand, fringes, date }: VSProps) {
  const { t, lang } = useI18n()
  const fr = fringes?.dates.find((d) => d.date === date)
  const num = (v: number) => v.toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { maximumFractionDigits: 1 })
  const opts: [View, Parameters<typeof t>[0]][] = [["disp", "viewDisp"], ["wrap", "viewWrap"], ["swipe", "viewSwipe"]]
  return (
    <div className="border-b border-ink/15 px-4 py-2 md:px-5">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div role="radiogroup" aria-label={t("viewLabel")} className="inline-flex flex-wrap rounded-md bg-ink/[0.06] p-0.5">
        {opts.map(([v, k]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={view === v}
            onClick={() => onView(v)}
            className={`rounded-[5px] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-staff ${view === v ? "bg-ink text-white" : "text-ink/75 hover:text-ink"}`}
          >
            {t(k)}
          </button>
        ))}
      </div>
      {fringes && view !== "disp" && (
        <div role="radiogroup" aria-label={t("bandLabel")} className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("bandLabel")}</span>
          <span className="inline-flex rounded-md bg-ink/[0.06] p-0.5">
            {(["L", "C"] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={band === b}
                onClick={() => onBand(b)}
                className={`rounded-[5px] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-staff ${band === b ? (b === "C" ? "bg-staff text-white" : "bg-ink text-white") : "text-ink/75 hover:text-ink"}`}
              >
                {t(b === "L" ? "bandL" : "bandC")}
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
      {fringes && fr && view !== "disp" && (
        <div className={`mt-2 max-w-3xl border-l-4 pl-3 ${band === "C" ? "border-staff" : "border-ink"}`}>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="font-display text-lg font-extrabold">{t(band === "C" ? "storyTitleC" : "storyTitleL")}</h2>
            <span className="font-display text-lg font-extrabold tabular-nums">
              <span className={band === "L" ? "" : "text-ink/40"}>{num(fr.rings_l)}</span>
              <span className="mx-1.5 text-sm font-semibold text-muted-foreground">{lang === "tr" ? "halka /" : "fringes /"}</span>
              <span className={band === "C" ? "text-staff" : "text-ink/40"}>{num(fr.rings_c)}</span>
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-snug">
            {t(band === "C" ? "storyC" : "storyL", { cm: num(fr.max_los_cm), l: num(fr.rings_l), c: num(fr.rings_c) })}
          </p>
          {band === "C" && <p className="mt-1 text-xs text-muted-foreground">{t("ringsNote")}</p>}
        </div>
      )}
    </div>
  )
}

function PointPanel({ point, region, index }: { point: Point; region: Region; index: number }) {
  const { t, lang, pick } = useI18n()
  const cur = point.series[index]?.disp_cm ?? 0
  const close = point.s1_rate_cm_yr != null && Math.abs(point.s1_rate_cm_yr - point.rate_cm_yr) <= Math.max(2, Math.abs(point.rate_cm_yr) * 0.15)
  return (
    <section aria-labelledby="pt-h" aria-live="polite" className="space-y-4">
      <div>
        <h2 id="pt-h" className="font-display text-[2rem] leading-tight font-extrabold">{pick(point.name)}</h2>
        <p className="mt-1 text-sm text-ink/75">{pick(point.note)}</p>
      </div>
      <div className="flex items-start gap-5">
        <Staff cm={cur} refDate={region.dates[0]} maxCm={Math.abs(region.disp_range_cm[0])} />
        <div className="space-y-3 pt-1">
          <div>
            <div className="font-display text-5xl leading-none font-extrabold tabular-nums text-staff">
              {fmtCm(cur, lang)}
              <span className="ml-1 text-2xl">cm</span>
            </div>
            <div className="mt-1.5 text-sm">
              {t("sunk")}, {t("since", { d: fmtDate(region.dates[0], lang, true) })}
            </div>
          </div>
          <p className="text-sm text-ink/75">{t("perYear", { v: Math.abs(point.rate_cm_yr).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB") })}</p>
        </div>
      </div>
      <SeriesChart point={point} region={region} index={index} />
      {close && Math.abs(point.rate_cm_yr) > 5 && <p className="text-sm leading-relaxed">{t("agree")}</p>}
    </section>
  )
}

// Ayrıntılı, kaynaklı anlatım: docs/neden-cokuyor-kaynaklar.md
const SOURCES: [string, string][] = [
  ["Carrillo 1947, Influence of Artesian Wells in the Sinking of Mexico City", "https://www.semanticscholar.org/paper/Influence-of-Artesian-Wells-in-the-Sinking-of-City-Carrillo/bb4a5a13383dcfdfbee711f82b894f021c5c8e25"],
  ["Chaussard et al. 2021, JGR Solid Earth", "https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020JB020648"],
  ["Cigna & Tapete 2021, Remote Sensing of Environment", "https://doi.org/10.1016/j.rse.2020.112161"],
  ["Solano-Rojas et al. 2024, Scientific Reports", "https://doi.org/10.1038/s41598-024-53525-y"],
  ["Managed aquifer recharge in Mexico City (review), PMC", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9543496/"],
  ["NASA/JPL 2026, US-Indian spacecraft captures Mexico City subsidence", "https://www.jpl.nasa.gov/images/pia26709-us-indian-spacecraft-captures-mexico-city-subsidence/"],
  ["La Silla Rota 2025 (Conagua recarga/extracción)", "https://lasillarota.com/metropoli/2025/9/6/cdmx-hundimiento-alcanza-42-cm-anuales-por-extraccion-de-agua-467591.html"],
  ["Infobae 2025, grietas en la CDMX", "https://www.infobae.com/mexico/2025/06/27/sobreexplotacion-del-acuifero-agrava-grietas-en-la-cdmx-hay-seguimiento-permanente-advierte-sheinbaum/"],
  ["Milenio, resurge lago en Chalco", "https://amp.milenio.com/estados/resurge-lago-chalco-pone-riesgo-80-mil"],
]

function Why() {
  const { t } = useI18n()
  return (
    <section aria-labelledby="why-h" className="space-y-3">
      <h2 id="why-h" className="font-display text-xl font-extrabold">{t("whyTitle")}</h2>
      <p className="text-sm leading-relaxed">{t("why1")}</p>
      <p className="text-sm leading-relaxed">{t("why2")}</p>
      <p className="text-sm leading-relaxed">{t("why3")}</p>
      <p className="border-l-2 border-staff pl-3 text-sm leading-relaxed font-medium">{t("whyHuman")}</p>
      <p className="text-sm leading-relaxed">{t("whyFast")}</p>
      <p className="text-sm leading-relaxed">{t("whyEffects")}</p>
      <p className="text-sm leading-relaxed text-ink/80">{t("whyBlind")}</p>
      <p className="text-sm leading-relaxed">{t("whyJpl")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("whyCheck")}</p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-ink/70">{t("sourcesLabel")}</summary>
        <ul className="mt-2 space-y-1">
          {SOURCES.map(([label, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">{label}</a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}

function Future() {
  const { t } = useI18n()
  return (
    <section aria-labelledby="future-h" className="space-y-3">
      <h2 id="future-h" className="font-display text-xl font-extrabold">{t("futureTitle")}</h2>
      <p className="text-sm leading-relaxed">{t("future1")}</p>
      <p className="text-sm leading-relaxed">{t("future2")}</p>
      <p className="text-sm leading-relaxed">{t("future3")}</p>
    </section>
  )
}

function How({ region }: { region: Region }) {
  const { t, lang } = useI18n()
  return (
    <section aria-labelledby="how-h" className="space-y-3 border-t border-ink/15 pt-6">
      <h2 id="how-h" className="font-display text-lg font-extrabold">{t("howTitle")}</h2>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed marker:font-semibold marker:text-ink/60">
        <li>{t("how1")}</li>
        <li>{t("how2")}</li>
        <li>{t("how3")}</li>
        <li>{t("how4")}</li>
      </ol>
      <p className="text-xs text-muted-foreground">
        {t("sourceLine", { sensor: region.source.sensor, product: region.source.product, maturity: region.source.maturity, track: region.source.track, g0: fmtDate(region.gap[0], lang), g1: fmtDate(region.gap[1], lang) })}
      </p>
    </section>
  )
}

/** Mira (nivelman çubuğu) logosu: kırmızı-beyaz bloklar, altında zemin çizgisi. */
function Logo() {
  return (
    <svg viewBox="0 0 24 32" className="h-8 w-6 shrink-0" aria-hidden="true">
      <rect x="7" y="1" width="10" height="26" fill="#fff" stroke="var(--color-ink)" strokeWidth="1.5" />
      {[0, 2, 4].map((i) => <rect key={i} x="7.75" y={1.75 + i * 5} width="4.5" height="5" fill="var(--color-staff)" />)}
      <path d="M0 29h24" stroke="var(--color-ink)" strokeWidth="2" />
      <path d="M2 31.5h20" stroke="var(--color-ink)" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  )
}
