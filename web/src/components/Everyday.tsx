import { useI18n } from "@/lib/i18n"

const STEP_CM = 17 // bir merdiven basamağı
const DOOR_M = 2 // bir kapı

/** Santimetreleri gözde canlandırmak: bu 11 ay kaç basamak, bu hızla 10 yılda bir kapının neresi. */
export function Everyday({ cum, rate }: { cum: number; rate: number }) {
  const { t, lang } = useI18n()
  const loc = lang === "tr" ? "tr-TR" : "en-GB"
  const n1 = (v: number) => v.toLocaleString(loc, { maximumFractionDigits: 1 })
  const tenYearM = (Math.abs(rate) * 10) / 100
  const stable = Math.abs(rate) < 2

  if (stable)
    return (
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-[15px] leading-relaxed">{t("eqStable")}</p>
      </div>
    )

  // Kapı çizimi: 2 m'lik kapı; yanında 10 yılda çöken yükseklik (gerekirse kapıdan uzun)
  const H = 160, top = 20, scale = (H - top - 18) / Math.max(DOOR_M, tenYearM)
  const doorH = DOOR_M * scale, dropH = tenYearM * scale, base = H - 18
  return (
    <div className="mt-5 space-y-3 border-t border-border pt-4">
      <div className="space-y-2">
        <p className="text-[15px] leading-relaxed">{t("eqSteps", { n: n1(Math.abs(cum) / STEP_CM) })}</p>
        <p className="text-[15px] leading-relaxed">
          {t("eqTen", { m: n1(tenYearM) })}{" "}
          <span className="font-semibold text-staff">{tenYearM >= DOOR_M ? t("eqDoorOver") : t("eqDoorPart", { p: Math.round((tenYearM / DOOR_M) * 100) })}</span>
        </p>
      </div>
      <svg viewBox={`0 0 120 ${H}`} className="mx-auto block h-auto w-[150px]" role="img" aria-label={t("eqAria", { m: n1(tenYearM) })}>
        <line x1={0} x2={120} y1={base} y2={base} stroke="var(--color-ink)" strokeWidth={1.5} />
        {/* kapı */}
        <rect x={14} y={base - doorH} width={34} height={doorH} fill="none" stroke="var(--color-ink)" strokeWidth={1.5} />
        <circle cx={42} cy={base - doorH / 2} r={1.8} fill="var(--color-ink)" />
        <text x={31} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[10px]">{t("eqDoor")}</text>
        {/* 10 yıllık çökme */}
        <rect x={68} y={base - dropH} width={30} height={dropH} fill="var(--color-staff)" fillOpacity={0.85} />
        <text x={83} y={base - dropH - 4} textAnchor="middle" className="fill-ink text-[11px] font-semibold tabular-nums">{n1(tenYearM)} m</text>
        <text x={83} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[10px]">{t("eqTenShort")}</text>
      </svg>
    </div>
  )
}
