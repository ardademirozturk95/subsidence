import { days, fmtCm, fmtDate, type Point, type Region } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

/** Birikmiş dikey hareket: NISAR ölçümleri (noktalar) + aynı ölçümlere uydurulan yıllık eğilim (kesikli). */
export function SeriesChart({ point, region, index }: { point: Point; region: Region; index: number }) {
  const { t, lang, pick } = useI18n()
  const W = 320, H = 190, pl = 34, pr = 8, pt = 10, pb = 24
  const { dates, gap } = region
  const total = days(dates[0], dates[dates.length - 1])
  const trendEnd = (point.rate_cm_yr * total) / 365
  const lo = Math.min(-2, ...point.series.map((s) => s.disp_cm), trendEnd)
  const yMin = Math.floor(lo / 2) * 2 - 1
  const x = (d: string) => pl + ((W - pl - pr) * days(dates[0], d)) / total
  const y = (v: number) => pt + ((H - pt - pb) * (0 - v)) / (0 - yMin)
  const ticks: number[] = []
  const stepT = yMin < -20 ? 10 : yMin < -10 ? 4 : 2
  for (let v = 0; v >= yMin; v -= stepT) ticks.push(v)

  let path = ""
  point.series.forEach((s, i) => {
    const jump = i > 0 && days(point.series[i - 1].date, s.date) > 13
    path += `${i === 0 || jump ? "M" : "L"}${x(s.date).toFixed(1)} ${y(s.disp_cm).toFixed(1)} `
  })
  const last = point.series[point.series.length - 1]
  const cur = point.series[index]

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={t("chartAria", { n: pick(point.name), a: fmtDate(dates[0], lang), b: fmtDate(last.date, lang), v: fmtCm(last.disp_cm, lang) })}>
        <defs>
          <pattern id="gapHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-ink)" strokeOpacity="0.14" strokeWidth="3" />
          </pattern>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--color-ink)" strokeOpacity={v === 0 ? 0.5 : 0.1} />
            <text x={pl - 6} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">{v === 0 ? "0" : fmtCm(v, lang, 0)}</text>
          </g>
        ))}
        <text x={pl - 6} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[10px]">cm</text>
        <rect x={x(gap[0])} y={pt} width={x(gap[1]) - x(gap[0])} height={H - pt - pb} fill="url(#gapHatch)" />
        <line x1={x(dates[0])} y1={y(0)} x2={x(last.date)} y2={y(trendEnd)} stroke="var(--color-staff)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" />
        {point.series.map((s, i) => (
          <circle key={s.date} cx={x(s.date)} cy={y(s.disp_cm)} r={i === index ? 5 : 2.6}
            fill={i === index ? "var(--color-staff)" : "var(--color-ink)"} stroke={i === index ? "var(--color-card2)" : "none"} strokeWidth={1.5} />
        ))}
        {cur && <line x1={x(cur.date)} x2={x(cur.date)} y1={pt} y2={H - pb} stroke="var(--color-staff)" strokeOpacity={0.45} />}
        <text x={pl} y={H - 6} className="fill-muted-foreground text-[10px]">{fmtDate(dates[0], lang)}</text>
        <text x={W - pr} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[10px]">{fmtDate(last.date, lang)}</text>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><svg width="18" height="8" aria-hidden="true"><line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-ink)" strokeWidth="2" /><circle cx="9" cy="4" r="2.6" fill="var(--color-ink)" /></svg>{t("chartNisar")}</span>
        <span className="inline-flex items-center gap-1.5"><svg width="18" height="8" aria-hidden="true"><line x1="0" x2="18" y1="4" y2="4" stroke="var(--color-staff)" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="5 3" /></svg>{t("chartTrend")}</span>
      </figcaption>
    </figure>
  )
}
