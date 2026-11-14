import { useState } from "react"
import { BACKSCATTER, polUrl, type Backdrop, type Region } from "@/lib/data"
import { useI18n, type Key } from "@/lib/i18n"

/** HH / HV karşılaştırıcı: aynı NISAR GCOV sahnesi, ortadaki çizgiyi kaydırarak iki polarizasyon. */
export function PolCompare({ region, backdrop, onBackdrop }: { region: Region; backdrop: Backdrop; onBackdrop: (b: Backdrop) => void }) {
  const { t, pick } = useI18n()
  const [split, setSplit] = useState(50)
  const opts: [Backdrop, string][] = [["map", t("bdMap")], ["hh", "HH"], ["hv", "HV"], ["rgb", "RGB"]]
  const text: Record<Backdrop, Key | null> = { map: null, hh: "polHH", hv: "polHV", rgb: "polRGB" }
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
      {/* Büyük karşılaştırıcı: sol HH, sağ HV */}
      <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden rounded-md bg-ink select-none">
        <img src={polUrl(region, "hv")} alt="HV" className="absolute inset-0 size-full object-cover" draggable={false} />
        <img src={polUrl(region, "hh")} alt="HH" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} draggable={false} />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${split}%` }} />
        <div className="pointer-events-none absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/70 text-white" style={{ left: `${split}%` }} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="size-4"><path d="M7 5 2 10l5 5M13 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        </div>
        <span className="map-chip pointer-events-none absolute top-3 left-3">{t("polLeft")}</span>
        <span className="map-chip pointer-events-none absolute right-3 bottom-3">{t("polRight")}</span>
        <input
          type="range" min={0} max={100} value={split}
          onChange={(e) => setSplit(+e.target.value)}
          aria-label={t("polSlider")}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>

      {/* Açıklama */}
      <div className="space-y-4">
        <h2 id="pol-h" className="font-display text-3xl leading-tight font-semibold lg:text-4xl">{t("polTitle")}</h2>
        <p className="text-base leading-relaxed text-ink/80">{t("radarIntro")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-t-2 border-ink pt-2">
            <h3 className="text-sm font-semibold">HH</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t("polHH")}</p>
          </div>
          <div className="border-t-2 border-lake pt-2">
            <h3 className="text-sm font-semibold">HV</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t("polHV")}</p>
          </div>
        </div>
        <div>
          <DotPlot pick={pick} label={t("dotAria")} />
          <p className="mt-1 text-xs text-muted-foreground">{t("dotNote")}</p>
        </div>
        <p className="text-sm leading-relaxed">{t("lband")}</p>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">{t("polOnMap")}</span>
          <div role="radiogroup" aria-label={t("polOnMap")} className="inline-flex rounded-md bg-ink/[0.06] p-0.5">
            {opts.map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={backdrop === v} onClick={() => onBackdrop(v)}
                className={`rounded-[5px] px-2.5 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-staff ${backdrop === v ? "bg-ink text-paper" : "text-ink/75 hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {text[backdrop] && backdrop === "rgb" && <p className="text-sm leading-relaxed text-ink/80">{t(text[backdrop]!)}</p>}
      </div>
    </div>
  )
}

function DotPlot({ pick, label }: { pick: (v: { tr: string; en: string }) => string; label: string }) {
  const x0 = 108, x1 = 312, lo = -25, hi = 0
  const x = (v: number) => x0 + ((x1 - x0) * (v - lo)) / (hi - lo)
  const rows = BACKSCATTER.length
  return (
    <svg viewBox={`0 0 320 ${rows * 24 + 42}`} className="h-auto w-full" role="img" aria-label={label}>
      {[-20, -15, -10, -5, 0].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={4} y2={rows * 24 + 6} stroke="var(--color-ink)" strokeOpacity={0.1} />
          <text x={x(v)} y={rows * 24 + 18} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">{v} dB</text>
        </g>
      ))}
      {BACKSCATTER.map((r, i) => {
        const yy = 15 + i * 24
        return (
          <g key={r.cls.en}>
            <text x={0} y={yy + 4} className="fill-ink text-[11.5px]">{pick(r.cls)}</text>
            <line x1={x(r.hv)} x2={x(r.hh)} y1={yy} y2={yy} stroke="var(--color-ink)" strokeOpacity={0.3} strokeWidth={2} />
            <circle cx={x(r.hh)} cy={yy} r={5.5} fill="var(--color-ink)" />
            <circle cx={x(r.hv)} cy={yy} r={5} fill="var(--color-paper)" stroke="var(--color-lake)" strokeWidth={2.2} />
          </g>
        )
      })}
      <g transform={`translate(${x0}, ${rows * 24 + 33})`}>
        <circle cx={4} cy={0} r={4.5} fill="var(--color-ink)" />
        <text x={13} y={4} className="fill-ink text-[11px] font-semibold">HH</text>
        <circle cx={52} cy={0} r={4} fill="var(--color-paper)" stroke="var(--color-lake)" strokeWidth={2} />
        <text x={61} y={4} className="fill-ink text-[11px] font-semibold">HV</text>
      </g>
    </svg>
  )
}
