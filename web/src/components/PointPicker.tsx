import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { dispColor, type Point, type Region } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

/** "Aragón (havalimanının kuzeyi)" -> ["Aragón", "havalimanının kuzeyi"] */
function split(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/)
  return m ? [m[1], m[2]] : [name, null]
}

/** Yer seçici: açılır liste yerine sitenin kart diline uyan, gruplu ve hızları gösteren bir liste. */
export function PointPicker({ points, value, region, onSelect }: { points: Point[]; value: string; region: Region; onSelect: (id: string) => void }) {
  const { t, lang, pick } = useI18n()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()

  const sinking = points.filter((p) => p.rate_cm_yr <= -2).sort((a, b) => a.rate_cm_yr - b.rate_cm_yr)
  const stable = points.filter((p) => p.rate_cm_yr > -2)
  const order = [...sinking, ...stable]
  const cur = points.find((p) => p.id === value)!
  const [title, sub] = split(pick(cur.name))
  const nf = (v: number) => (v < 0 ? "−" : "+") + Math.abs(v).toLocaleString(lang === "tr" ? "tr-TR" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  const choose = (id: string) => { onSelect(id); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault(); setOpen(true); setActive(Math.max(0, order.findIndex((p) => p.id === value))); return
    }
    if (!open) return
    if (e.key === "Escape") { e.preventDefault(); setOpen(false) }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(order.length - 1, a + 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (e.key === "Enter") { e.preventDefault(); choose(order[active].id) }
  }

  const row = (p: Point) => {
    const i = order.indexOf(p)
    const [n, s] = split(pick(p.name))
    const sel = p.id === value
    return (
      <li key={p.id} id={`${listId}-${p.id}`} role="option" aria-selected={sel}
        onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(p.id)}
        className={`grid cursor-pointer grid-cols-[10px_1fr_auto] items-center gap-x-2.5 rounded-md px-2.5 py-2 ${i === active ? "bg-ink/[0.06]" : ""}`}>
        <span className="size-2.5 rounded-full ring-1 ring-ink/20" style={{ background: dispColor(p.rate_cm_yr, region) }} />
        <span className="min-w-0">
          <span className={`block truncate text-sm ${sel ? "font-semibold" : "font-medium"}`}>{n}</span>
          {s && <span className="block truncate text-xs text-muted-foreground">{s}</span>}
        </span>
        <span className="num text-xs text-muted-foreground tabular-nums">{nf(p.rate_cm_yr)}</span>
      </li>
    )
  }

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={t("regionPick")}
        aria-activedescendant={open ? `${listId}-${order[active]?.id}` : undefined}
        onClick={() => { setOpen(!open); setActive(Math.max(0, order.findIndex((p) => p.id === value))) }} onKeyDown={onKey}
        className="group flex w-full items-start justify-between gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        <span className="min-w-0">
          <span className="block font-display text-[1.7rem] leading-tight font-semibold">{title}</span>
          {sub && <span className="block text-sm text-muted-foreground">{sub}</span>}
        </span>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground group-hover:border-ink/40">
          {t("regionChange")} <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="card absolute inset-x-0 top-full z-[1000] mt-2 max-h-[60vh] overflow-y-auto p-1.5 shadow-[0_8px_24px_rgb(0_0_0/0.12)]">
          <ul id={listId} role="listbox" aria-label={t("regionPick")}>
            <li role="presentation" className="px-2.5 pt-1 pb-1 text-xs font-medium text-muted-foreground">{t("groupSinking")}</li>
            {sinking.map(row)}
            <li role="presentation" className="mt-1 border-t border-border px-2.5 pt-2 pb-1 text-xs font-medium text-muted-foreground">{t("groupStable")}</li>
            {stable.map(row)}
          </ul>
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] text-muted-foreground">{t("pickHint")}</p>
        </div>
      )}
    </div>
  )
}
