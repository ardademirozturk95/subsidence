import { useEffect, useState } from "react"
import { SinkMap } from "@/components/SinkMap"
import { Timeline } from "@/components/Timeline"
import { Staff } from "@/components/Staff"
import { SeriesChart } from "@/components/SeriesChart"
import { RadarCard } from "@/components/RadarCard"
import { fmtCm, fmtDate, loadAll, type Backdrop, type Point, type Region, type View } from "@/lib/data"
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
  const [data, setData] = useState<{ region: Region; points: Point[] } | null>(null)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<View>("disp")
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
        <span className="text-sm text-muted-foreground max-md:hidden">NISAR L-band, 2026</span>
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
            <ViewSwitch view={view} onView={setView} />
            <div className="relative min-h-[56svh] flex-1">
              <SinkMap
                region={region}
                points={data.points}
                date={region.dates[index]}
                view={view}
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
              <How region={region} />
            </div>
          </aside>
        </main>
      )}
    </div>
  )
}

function ViewSwitch({ view, onView }: { view: View; onView: (v: View) => void }) {
  const { t } = useI18n()
  const opts: [View, Parameters<typeof t>[0]][] = [["disp", "viewDisp"], ["wrap", "viewWrap"], ["swipe", "viewSwipe"]]
  return (
    <div className="flex items-center gap-3 border-b border-ink/15 px-4 py-2 md:px-5">
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
    </div>
  )
}

function PointPanel({ point, region, index }: { point: Point; region: Region; index: number }) {
  const { t, lang, pick } = useI18n()
  const cur = point.series[index]?.disp_cm ?? 0
  const close = Math.abs(point.s1_rate_cm_yr - point.rate_cm_yr) <= Math.max(2, Math.abs(point.rate_cm_yr) * 0.15)
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

function Why() {
  const { t } = useI18n()
  return (
    <section aria-labelledby="why-h" className="space-y-3">
      <h2 id="why-h" className="font-display text-xl font-extrabold">{t("whyTitle")}</h2>
      <p className="text-sm leading-relaxed">{t("why1")}</p>
      <p className="text-sm leading-relaxed">{t("why2")}</p>
      <p className="text-sm leading-relaxed">{t("why3")}</p>
      <p className="border-l-2 border-staff pl-3 text-sm leading-relaxed font-medium">{t("whyHuman")}</p>
    </section>
  )
}

function How({ region }: { region: Region }) {
  const { t } = useI18n()
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
        {t("sourceLine", { sensor: region.source.sensor, product: region.source.product, maturity: region.source.maturity })}
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
