import { fmtCm, fmtDate, type Lang } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

/**
 * Ölçü mirası (nivelman mirası). Mira sabit bir röper noktasına çakılı;
 * zemin çöktükçe toprak çizgisi miranın aşağısına iner ve aradaki boşluk görünür olur.
 */
export function Staff({ cm, refDate, maxCm = 15 }: { cm: number; refDate: string; maxCm?: number }) {
  const { t, lang } = useI18n()
  const W = 132, top = 14, px = Math.min(15, 240 / maxCm), H = top + maxCm * px + 40
  const groundY = top + Math.min(maxCm, Math.max(0, -cm)) * px
  const rodX = 22, rodW = 26

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-[132px] shrink-0" role="img"
      aria-label={t("staffLabel", { d: fmtDate(refDate, lang as Lang, true) })}>
      <defs>
        <pattern id="clay" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="var(--color-clay)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-ink)" strokeOpacity="0.22" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Zemin: üst kenarı bugünkü seviye */}
      <g className="staff-ground" style={{ transform: `translateY(${groundY - top}px)` }}>
        <rect x={0} y={top} width={W} height={H} fill="url(#clay)" />
        <line x1={0} x2={W} y1={top} y2={top} stroke="var(--color-ink)" strokeWidth={2} />
      </g>

      {/* Mira: her santim bir blok, kırmızı ve beyaz */}
      <rect x={rodX} y={top - 8} width={rodW} height={maxCm * px + 48} fill="#fff" stroke="var(--color-ink)" strokeWidth={1.5} />
      {Array.from({ length: maxCm + 2 }, (_, i) => (
        <g key={i}>
          {i % 2 === 0 && <rect x={rodX + 1} y={top + i * px} width={rodW / 2} height={px} fill="var(--color-staff)" />}
          {i % 5 === 0 && i <= maxCm && (
            <text x={rodX + rodW - 3} y={top + i * px + 9} textAnchor="end" className="fill-ink text-[10px] font-semibold tabular-nums">{i}</text>
          )}
        </g>
      ))}

      {/* Referans seviye */}
      <line x1={rodX - 6} x2={W} y1={top} y2={top} stroke="var(--color-ink)" strokeDasharray="4 3" strokeWidth={1.2} />
      <text x={rodX + rodW + 6} y={top - 4} className="fill-muted-foreground text-[10px]">{t("groundThen", { d: fmtDate(refDate, lang as Lang) })}</text>

      {/* Bugün */}
      <g className="staff-ground" style={{ transform: `translateY(${groundY - top}px)` }}>
        <text x={rodX + rodW + 6} y={top + 13} className="fill-ink text-[11px] font-bold tabular-nums">
          {fmtCm(cm, lang as Lang)} cm
        </text>
      </g>
    </svg>
  )
}
