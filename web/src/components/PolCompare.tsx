import { useState } from "react"
import { BACKSCATTER, polUrl, type Region } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

type Mode = "swipe" | "hh" | "hv" | "rgb"

/**
 * HH / HV karşılaştırıcı: aynı NISAR GCOV sahnesi.
 * "Karşılaştır": sol yarı HH, sağ yarı HV; çizgi sürüklenir. "HH" / "HV" / "RGB": tek görüntü tam boy.
 */
export function PolCompare({ region }: { region: Region }) {
  const { t, pick } = useI18n()
  const [mode, setMode] = useState<Mode>("swipe")
  const [split, setSplit] = useState(50)
  const opts: [Mode, string][] = [["swipe", t("polModeSwipe")], ["hh", "HH"], ["hv", "HV"], ["rgb", t("polModeRgb")]]
  const single = mode !== "swipe" ? mode : null

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
      <div className="mx-auto w-full max-w-[640px]">
        {/* Görünüm seçimi: görüntünün hemen üstünde, ne yaptığı belli */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label={t("polView")} className="inline-flex rounded-md bg-ink/[0.06] p-0.5">
            {opts.map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
                className={`rounded-[5px] px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-staff ${mode === v ? "bg-ink text-paper" : "text-ink/75 hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-ink select-none">
          {single ? (
            <img src={polUrl(region, single)} alt={single.toUpperCase()} className="absolute inset-0 size-full object-cover" draggable={false} />
          ) : (
            <>
              <img src={polUrl(region, "hv")} alt="HV" className="absolute inset-0 size-full object-cover" draggable={false} />
              <img src={polUrl(region, "hh")} alt="HH" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} draggable={false} />
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${split}%` }} />
              <div className="pointer-events-none absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/75 text-white" style={{ left: `${split}%` }} aria-hidden="true">
                <svg viewBox="0 0 20 20" className="size-4"><path d="M7 5 2 10l5 5M13 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </div>
              {/* Taraf etiketleri: hangi yarı hangisi, iki üst köşede aynı biçimde */}
              <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/75 px-2.5 py-1.5 text-white">
                <span className="block text-base leading-none font-bold">◀ HH</span>
                <span className="mt-0.5 block text-[11px] text-white/80">{t("polHHShort")}</span>
              </span>
              <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-black/75 px-2.5 py-1.5 text-right text-white">
                <span className="block text-base leading-none font-bold">HV ▶</span>
                <span className="mt-0.5 block text-[11px] text-white/80">{t("polHVShort")}</span>
              </span>
              <input
                type="range" min={0} max={100} value={split}
                onChange={(e) => setSplit(+e.target.value)}
                aria-label={t("polSlider")}
                className="absolute inset-0 size-full cursor-ew-resize opacity-0"
              />
            </>
          )}
          {single && (
            <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/75 px-2.5 py-1.5 text-white">
              <span className="block text-base leading-none font-bold">{single === "rgb" ? t("polModeRgb") : single.toUpperCase()}</span>
              <span className="mt-0.5 block text-[11px] text-white/80">{single === "hh" ? t("polHHShort") : single === "hv" ? t("polHVShort") : t("polRgbShort")}</span>
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "swipe" ? t("polSwipeHint") : t("polSingleHint")}</p>
      </div>

      {/* Açıklama */}
      <div className="space-y-4">
        <h2 id="pol-h" className="font-display text-3xl leading-tight font-semibold lg:text-4xl">{t("polTitle")}</h2>
        <p className="text-base leading-relaxed text-ink/80">{t("polIntro2")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`border-t-2 pt-2 transition-opacity ${mode === "hv" ? "opacity-45" : ""} border-ink`}>
            <h3 className="text-sm font-semibold">{t("polHHName")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t("polHH")}</p>
          </div>
          <div className={`border-t-2 pt-2 transition-opacity ${mode === "hh" ? "opacity-45" : ""} border-lake`}>
            <h3 className="text-sm font-semibold">{t("polHVName")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{t("polHV")}</p>
          </div>
        </div>
        {mode === "rgb" && <p className="text-sm leading-relaxed text-ink/80">{t("polRGB")}</p>}
        <div>
          <DotPlot pick={pick} label={t("dotAria")} />
          <p className="mt-1 text-xs text-muted-foreground">{t("dotNote")}</p>
        </div>
        <p className="border-t border-border pt-4 text-sm leading-relaxed">{t("lband")}</p>
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
