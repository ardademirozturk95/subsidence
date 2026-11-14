import { BACKSCATTER, type Backdrop } from "@/lib/data"
import { useI18n, type Key } from "@/lib/i18n"

const OPTIONS: { v: Backdrop; label: string | Key }[] = [
  { v: "map", label: "bdMap" },
  { v: "hh", label: "HH" },
  { v: "hv", label: "HV" },
  { v: "rgb", label: "RGB" },
]
const TEXT: Record<Backdrop, Key | null> = { map: null, hh: "polHH", hv: "polHV", rgb: "polRGB" }

/** HH / HV / kompozit: seçim haritanın arka planını değiştirir. */
export function RadarCard({ backdrop, onBackdrop }: { backdrop: Backdrop; onBackdrop: (b: Backdrop) => void }) {
  const { t, pick } = useI18n()
  const text = TEXT[backdrop]
  return (
    <section aria-labelledby="radar-h" className="space-y-3">
      <h2 id="radar-h" className="font-display text-xl font-extrabold">{t("radarTitle")}</h2>
      <p className="text-sm leading-relaxed text-ink/80">{t("radarIntro")}</p>
      <div role="radiogroup" aria-label={t("backdrop")} className="inline-flex rounded-md bg-ink/[0.06] p-0.5">
        {OPTIONS.map((o) => {
          const on = backdrop === o.v
          return (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onBackdrop(o.v)}
              className={`rounded-[5px] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-staff ${on ? "bg-ink text-white" : "text-ink/75 hover:text-ink"}`}
            >
              {o.label === "HH" || o.label === "HV" || o.label === "RGB" ? o.label : t(o.label as Key)}
            </button>
          )
        })}
      </div>
      {text && <p className="min-h-[4.5em] text-sm leading-relaxed">{t(text)}</p>}
      <DotPlot backdrop={backdrop} pick={pick} label={t("dotAria")} />
      <p className="text-xs text-muted-foreground">{t("dotNote")}</p>
      <p className="border-l-2 border-lake pl-3 text-sm leading-relaxed">{t("lband")}</p>
    </section>
  )
}

function DotPlot({ backdrop, pick, label }: { backdrop: Backdrop; pick: (v: { tr: string; en: string }) => string; label: string }) {
  const x0 = 108, x1 = 312, lo = -25, hi = 0
  const x = (v: number) => x0 + ((x1 - x0) * (v - lo)) / (hi - lo)
  const hhOn = backdrop !== "hv", hvOn = backdrop !== "hh"
  const rows = BACKSCATTER.length
  return (
    <svg viewBox={`0 0 320 ${rows * 26 + 44}`} className="h-auto w-full" role="img" aria-label={label}>
      {[-20, -15, -10, -5, 0].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={4} y2={rows * 26 + 6} stroke="var(--color-ink)" strokeOpacity={0.1} />
          <text x={x(v)} y={rows * 26 + 18} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">{v} dB</text>
        </g>
      ))}
      {BACKSCATTER.map((r, i) => {
        const yy = 16 + i * 26
        return (
          <g key={r.cls.en}>
            <text x={0} y={yy + 4} className="fill-ink text-[11.5px]">{pick(r.cls)}</text>
            <line x1={x(r.hv)} x2={x(r.hh)} y1={yy} y2={yy} stroke="var(--color-ink)" strokeOpacity={0.3} strokeWidth={2} />
            <circle cx={x(r.hh)} cy={yy} r={5.5} fill="var(--color-ink)" fillOpacity={hhOn ? 1 : 0.18} />
            <circle cx={x(r.hv)} cy={yy} r={5} fill="var(--color-paper)" stroke="var(--color-lake)" strokeWidth={2.2} strokeOpacity={hvOn ? 1 : 0.25} />
          </g>
        )
      })}
      <g transform={`translate(${x0}, ${rows * 26 + 34})`}>
        <circle cx={4} cy={0} r={4.5} fill="var(--color-ink)" />
        <text x={13} y={4} className="fill-ink text-[11px] font-semibold">HH</text>
        <circle cx={52} cy={0} r={4} fill="var(--color-paper)" stroke="var(--color-lake)" strokeWidth={2} />
        <text x={61} y={4} className="fill-ink text-[11px] font-semibold">HV</text>
      </g>
    </svg>
  )
}
