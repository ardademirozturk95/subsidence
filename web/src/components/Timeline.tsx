import { useEffect } from "react"
import { Pause, Play } from "lucide-react"
import { days, fmtDate, type Region } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

type Props = { region: Region; index: number; onIndex: (i: number) => void; playing: boolean; onPlaying: (p: boolean) => void }

/** Tarih ekseni gerçek zamana göre ölçekli; veri boşluğu taralı bant olarak görünür. */
export function Timeline({ region, index, onIndex, playing, onPlaying }: Props) {
  const { t, lang } = useI18n()
  const { dates, gap } = region
  const total = days(dates[0], dates[dates.length - 1])
  const pos = (d: string) => (days(dates[0], d) / total) * 100

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      onIndex(index >= dates.length - 1 ? 0 : index + 1)
    }, 750)
    return () => clearInterval(id)
  }, [playing, index, dates.length, onIndex])

  const step = (d: number) => {
    onPlaying(false)
    onIndex(Math.min(dates.length - 1, Math.max(0, index + d)))
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 md:px-5">
      <button
        type="button"
        onClick={() => {
          if (!playing && index === dates.length - 1) onIndex(0)
          onPlaying(!playing)
        }}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-white hover:bg-ink/85 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-staff"
        aria-label={playing ? t("pause") : t("play")}
      >
        {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
      </button>

      <div className="w-[7.5rem] shrink-0">
        <div className="font-display text-2xl leading-none font-extrabold tabular-nums">{fmtDate(dates[index], lang)}</div>
        <div className="mt-1 text-xs text-muted-foreground">2026</div>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={t("timeline")}
        aria-valuemin={0}
        aria-valuemax={dates.length - 1}
        aria-valuenow={index}
        aria-valuetext={fmtDate(dates[index], lang, true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); step(-1) }
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); step(1) }
          if (e.key === "Home") { e.preventDefault(); onPlaying(false); onIndex(0) }
          if (e.key === "End") { e.preventDefault(); onPlaying(false); onIndex(dates.length - 1) }
        }}
        className="relative h-12 min-w-0 flex-1 rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-staff"
      >
        <div className="absolute inset-x-0 top-5 h-px bg-ink/30" />
        <div
          className="absolute top-2 h-7 rounded-sm"
          style={{
            left: `${pos(gap[0])}%`,
            width: `${pos(gap[1]) - pos(gap[0])}%`,
            background: "repeating-linear-gradient(135deg, rgb(35 43 40 / 0.16) 0 3px, transparent 3px 7px)",
          }}
          title={t("noData")}
        >
          <span className="absolute top-full mt-0.5 w-full text-center text-[11px] whitespace-nowrap text-muted-foreground max-sm:hidden">{t("noData")}</span>
        </div>
        <div className="absolute top-5 h-0.5 -translate-y-1/2 bg-staff" style={{ left: 0, width: `${pos(dates[index])}%` }} />
        {dates.map((d, i) => (
          <button
            key={d}
            type="button"
            tabIndex={-1}
            onClick={() => { onPlaying(false); onIndex(i) }}
            className="group absolute top-0 h-10 w-6 -translate-x-1/2"
            style={{ left: `${pos(d)}%` }}
            aria-label={fmtDate(d, lang, true)}
          >
            <span
              className={`absolute top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[width,height] ${
                i === index ? "size-4 border-staff bg-staff" : i < index ? "size-2.5 border-staff bg-staff" : "size-2.5 border-ink/50 bg-paper group-hover:border-ink"
              }`}
            />
            {(i === 0 || i === dates.length - 1) && (
              <span className={`absolute top-8 text-[11px] whitespace-nowrap text-muted-foreground ${i === 0 ? "left-0" : "right-0"}`}>{fmtDate(d, lang)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
