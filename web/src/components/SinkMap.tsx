import { useCallback, useEffect, useRef, useState } from "react"
import { CircleMarker, ImageOverlay, MapContainer, Pane, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet"
import { WRAP_STOPS, dispColor, dispGradient, frameUrl, polUrl, type Backdrop, type Band, type Fringes, type Point, type Region, type View } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

type Props = {
  region: Region
  points: Point[]
  date: string
  view: View
  band: Band
  fringes: Fringes | null
  backdrop: Backdrop
  selectedId: string
  onSelect: (id: string) => void
}

export function SinkMap({ region, points, date, view, band, fringes, backdrop, selectedId, onSelect }: Props) {
  const { t, pick } = useI18n()
  const [split, setSplit] = useState(0.5)
  const showWrap = view !== "disp"
  const showDisp = view !== "wrap"

  // Kareleri önceden indir: oynatırken titreme olmasın
  useEffect(() => {
    for (const d of region.dates) for (const k of (fringes ? ["disp", "lwrap", "cwrap"] : ["disp", "wrap"]) as ("disp" | "wrap" | "lwrap" | "cwrap")[]) new Image().src = frameUrl(region, k, d)
  }, [region, fringes])

  return (
    <div className="relative isolate h-full min-h-[inherit]">
      <MapContainer
        center={region.center}
        zoom={region.zoom}
        minZoom={9}
        maxZoom={14}
        zoomControl={false}
        className="h-full min-h-[inherit] w-full"
        aria-label={t("mapLabel")}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri, HERE, Garmin, &copy; OpenStreetMap"
          maxZoom={16}
        />
        {backdrop !== "map" && <ImageOverlay url={polUrl(region, backdrop)} bounds={region.bounds} opacity={1} zIndex={1} />}
        <Pane name="wrap" style={{ zIndex: 410 }}>
          {showWrap && <ImageOverlay url={frameUrl(region, !fringes ? "wrap" : band === "C" ? "cwrap" : "lwrap", date)} bounds={region.bounds} opacity={0.85} />}
        </Pane>
        <Pane name="disp" style={{ zIndex: 420 }}>
          {showDisp && <ImageOverlay url={frameUrl(region, "disp", date)} bounds={region.bounds} opacity={backdrop === "map" ? 0.82 : 0.7} />}
        </Pane>
        <Pane name="labels" style={{ zIndex: 450 }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
            pane="labels"
          />
        </Pane>
        <SwipeClip active={view === "swipe"} split={split} />
        <ZoomControl position="bottomleft" />
        <MapResizer />
        {points.map((p) => {
          const sel = p.id === selectedId
          const now = p.series.find((s) => s.date === date)?.disp_cm ?? 0
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lon]}
              radius={sel ? 9 : 6}
              pane="markerPane"
              pathOptions={{ color: "#232b28", weight: sel ? 3.5 : 1.5, fillColor: dispColor(now, region.disp_range_cm), fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(p.id) }}
              bubblingMouseEvents={false}
            >
              <Tooltip permanent={sel} direction="right" offset={[10, 0]} className="pt-label">
                {pick(p.name)}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {view === "swipe" && <SwipeHandle split={split} onChange={setSplit} />}
      {view === "swipe" && (
        <>
          <span className="map-chip pointer-events-none absolute top-3 left-3 z-[500]">{band === "C" ? t("swipeLeftC") : t("swipeLeft")}</span>
          <span className="map-chip pointer-events-none absolute top-3 right-3 z-[500]">{t("swipeRight")}</span>
        </>
      )}
      {view === "wrap" && band === "C" && (
        <span className="map-chip pointer-events-none absolute top-3 left-3 z-[500]">{t("simChip")}</span>
      )}
      <Legend region={region} view={view} half={band === "C" && fringes ? fringes.c_half_wave_cm : region.half_wave_cm} />
    </div>
  )
}

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

/** Sol tarafta sarılı faz, sağda çözülmüş çökme: iki katmanı ekran x'ine göre kırpar. */
function SwipeClip({ active, split }: { active: boolean; split: number }) {
  const map = useMap()
  useEffect(() => {
    const wrap = map.getPane("wrap"), disp = map.getPane("disp")
    if (!wrap || !disp) return
    const update = () => {
      if (!active) {
        wrap.style.clip = disp.style.clip = ""
        return
      }
      const size = map.getSize()
      const nw = map.containerPointToLayerPoint([0, 0])
      const se = map.containerPointToLayerPoint(size)
      const x = nw.x + size.x * split
      wrap.style.clip = `rect(${nw.y}px, ${x}px, ${se.y}px, ${nw.x}px)`
      disp.style.clip = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${x}px)`
    }
    update()
    map.on("move zoom resize", update)
    return () => {
      map.off("move zoom resize", update)
      wrap.style.clip = disp.style.clip = ""
    }
  }, [map, active, split])
  return null
}

function SwipeHandle({ split, onChange }: { split: number; onChange: (v: number) => void }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const drag = useCallback(
    (e: PointerEvent) => {
      const box = ref.current?.parentElement?.getBoundingClientRect()
      if (box) onChange(Math.min(0.98, Math.max(0.02, (e.clientX - box.left) / box.width)))
    },
    [onChange],
  )
  const start = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const up = () => {
      window.removeEventListener("pointermove", drag)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", drag)
    window.addEventListener("pointerup", up)
  }
  return (
    <div ref={ref} className="pointer-events-none absolute inset-y-0 z-[500] w-0" style={{ left: `${split * 100}%` }}>
      <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(35_43_40/0.5)]" />
      <button
        type="button"
        role="slider"
        aria-label={t("swipeHandle")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split * 100)}
        onPointerDown={start}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onChange(Math.max(0.02, split - 0.05))
          if (e.key === "ArrowRight") onChange(Math.min(0.98, split + 0.05))
        }}
        className="pointer-events-auto absolute top-1/2 -left-5 grid size-10 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded-full border-2 border-white bg-ink text-white shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-staff"
      >
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
          <path d="M7 5 2 10l5 5M13 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </div>
  )
}

function Legend({ region, view, half }: { region: Region; view: View; half: number }) {
  const { t } = useI18n()
  const [vmin, vmax] = region.disp_range_cm
  const zero = (-vmin / (vmax - vmin)) * 100
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 z-[500] w-56 rounded-md bg-white/92 px-3 py-2 text-xs text-ink shadow-sm ring-1 ring-ink/15 backdrop-blur-sm">
      {view !== "wrap" && (
        <div>
          <div className="h-2.5 rounded-sm" style={{ background: dispGradient(region.disp_range_cm) }} />
          <div className="relative mt-1 h-4 tabular-nums">
            <span className="absolute left-0">{vmin} cm</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${zero}%` }}>0</span>
            <span className="absolute right-0">+{vmax}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t("legendSinking")}</span>
            <span>{t("legendRising")}</span>
          </div>
        </div>
      )}
      {view !== "disp" && (
        <div className={view === "swipe" ? "mt-2 border-t border-ink/10 pt-2" : ""}>
          <div className="flex items-center gap-2">
            <span className="size-6 shrink-0 rounded-full" style={{ background: `conic-gradient(${WRAP_STOPS.join(",")})`, mask: "radial-gradient(circle, transparent 38%, #000 40%)" }} />
            <span>{t("legendWrap", { n: half < 5 ? half.toFixed(1) : Math.round(half) })}</span>
          </div>
        </div>
      )}
    </div>
  )
}
