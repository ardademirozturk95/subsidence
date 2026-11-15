import { LITERATURE, type Point } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

/**
 * Doğrulama: bizim NISAR hızlarımız, aynı bölgeler için yayımlanmış Sentinel-1 değerlerinin yanında,
 * ve kaya zemindeki kontrol noktaları (sıfıra yakın olmalı). Sayılar points.json ve data.ts > LITERATURE'den.
 */
export function Validation({ points, selectedId, onSelect }: { points: Point[]; selectedId: string; onSelect: (id: string) => void }) {
  const { t, lang, pick } = useI18n()
  const rows = LITERATURE.flatMap((l) => {
    const p = points.find((q) => q.id === l.id)
    return p ? [{ l, p }] : []
  })
  const rock = points.filter((p) => Math.abs(p.rate_cm_yr) < 2)
  const loc = lang === "tr" ? "tr-TR" : "en-GB"
  const abs1 = (v: number) => Math.abs(v).toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const signed = (v: number) => (v < 0 ? "−" : "+") + abs1(v)
  const short = (name: string) => name.replace(/\s*\(.*\)\s*$/, "")

  const W = 320, x0 = 112, x1 = 306, max = 40, rh = 21, top = 6
  const x = (v: number) => x0 + ((x1 - x0) * Math.min(max, Math.abs(v))) / max
  const H = top + rows.length * rh + 16
  if (!rows.length) return null

  return (
    <section className="mt-3 border-t border-border pt-2.5" aria-labelledby="val-h">
      <h2 id="val-h" className="font-display text-lg leading-tight font-semibold">{t("valTitle")}</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-auto w-full">
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={top - 4} y2={top + rows.length * rh} stroke="var(--color-ink)" strokeOpacity={v === 0 ? 0.45 : 0.1} />
            <text x={x(v)} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">{v}</text>
          </g>
        ))}
        {rows.map(({ l, p }, i) => {
          const yy = top + i * rh + rh / 2
          const sel = p.id === selectedId
          const label = t("valAria", { n: pick(p.name), a: abs1(p.rate_cm_yr), b: abs1(l.pub) })
          return (
            <g key={p.id} role="button" tabIndex={0} aria-label={label} aria-pressed={sel} className="cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => onSelect(p.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.id) } }}>
              <title>{label}</title>
              <rect x={0} y={yy - rh / 2 + 1} width={W} height={rh - 2} rx={5} fill="var(--color-ink)" fillOpacity={sel ? 0.07 : 0} />
              <text x={6} y={yy + 4} className={`fill-ink text-[11.5px] ${sel ? "font-semibold" : ""}`}>{short(pick(p.name))}</text>
              <line x1={x(p.rate_cm_yr)} x2={x(l.pub)} y1={yy} y2={yy} stroke="var(--color-ink)" strokeOpacity={0.3} strokeWidth={2} />
              <circle cx={x(l.pub)} cy={yy} r={5} fill="var(--color-card2)" stroke="var(--color-ink)" strokeWidth={2} />
              <circle cx={x(p.rate_cm_yr)} cy={yy} r={5.5} fill="var(--color-staff)" />
            </g>
          )
        })}
      </svg>
      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] leading-snug text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="var(--color-staff)" /></svg>{t("valOurs")}</span>
        <span className="inline-flex items-center gap-1.5"><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--color-card2)" stroke="var(--color-ink)" strokeWidth="2" /></svg>{t("valPub")}</span>
      </div>
      {rock.length > 0 && (
        <p className="mt-1.5 border-l-2 border-staff pl-2.5 text-xs leading-snug font-medium">
          {t("valRock", { k: rock.length, v: rock.map((p) => signed(p.rate_cm_yr)).join(lang === "tr" ? "; " : ", ") })}
        </p>
      )}
    </section>
  )
}
