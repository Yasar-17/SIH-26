import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap }
  from 'react-leaflet'
import {
  CATEGORY_COLORS,
  INDIA_CENTER,
  INDIA_ZOOM,
  SHORT_NAMES,
} from '../lib/constants'

function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])
  return null
}

function FlyTo({ target }) {
  const map = useMap()
  const prevId = useRef(null)

  useEffect(() => {
    if (!target) {
      if (prevId.current) {
        map.setView(INDIA_CENTER, INDIA_ZOOM)
        prevId.current = null
      }
      return
    }
    if (target.id === prevId.current) return
    prevId.current = target.id
    map.setView([target.lat, target.lon], 12)
  }, [target, map])

  return null
}

function radiusFor(frp, selected) {
  return (selected ? 3 : 0) + 4 + Math.min(10, Math.sqrt(frp || 0) / 7)
}

function clusterDetections(detections) {
  const cells = new Map()
  detections.forEach((d) => {
    const key = `${Math.floor(d.latitude * 2)}:${Math.floor(d.longitude * 2)}`
    const current = cells.get(key) || { ...d, count: 0, frp_mw: 0 }
    current.count += 1
    current.frp_mw += d.frp_mw || 0
    cells.set(key, current)
  })
  return [...cells.values()]
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 z-[1100] flex items-center
      justify-center bg-slate-100/70 backdrop-blur-[1px] pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-xl shadow-lg
        border border-slate-200 px-6 py-5 max-w-xs text-center">
        {children}
      </div>
    </div>
  )
}

function MapTools({ detections, onOpenQueue, mapMode, onMapMode, baseLayer, onBaseLayer }) {
  const map = useMap()
  const fitAll = () => {
    if (!detections.length) return
    map.fitBounds(detections.map((d) => [d.latitude, d.longitude]), { padding: [28, 28] })
  }
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <button onClick={fitAll} className="map-tool" title="Fit all visible detections" aria-label="Fit all visible detections">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
      </button>
      <button onClick={onOpenQueue} className="map-tool" title="Open review queue" aria-label="Open review queue">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
      </button>
      <select value={mapMode} onChange={(event) => onMapMode(event.target.value)} className="map-select" aria-label="Map display mode">
        <option value="points">Points</option>
        <option value="clusters">Clusters</option>
        <option value="heatmap">Heatmap</option>
      </select>
      <select value={baseLayer} onChange={(event) => onBaseLayer(event.target.value)} className="map-select" aria-label="Map base layer">
        <option value="street">Street</option>
        <option value="satellite">Satellite</option>
        <option value="terrain">Terrain</option>
      </select>
    </div>
  )
}

function MapLegend() {
  return <div className="absolute bottom-4 left-3 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur" aria-label="Map legend">
    <p className="eyebrow mb-1.5">Classification</p>
    <div className="flex flex-wrap gap-x-3 gap-y-1">{Object.entries(CATEGORY_COLORS).map(([name, color]) => <span key={name} className="flex items-center gap-1.5 text-[10px] text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{SHORT_NAMES[name]}</span>)}</div>
  </div>
}

export default function MapView({ detections, selectedId, onSelect,
                                 loading, error, empty, onClearFilters,
                                 flyToTarget, onOpenQueue, mapMode, onMapMode,
                                 baseLayer, onBaseLayer }) {
  const visibleDetections = mapMode === 'clusters'
    ? clusterDetections(detections ?? [])
    : (detections ?? [])
  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  }
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        minZoom={4}
        scrollWheelZoom
        className="h-full w-full"
      >
        <AutoResize />
        <FlyTo target={flyToTarget} />
        <MapTools detections={detections ?? []} onOpenQueue={onOpenQueue} mapMode={mapMode} onMapMode={onMapMode} baseLayer={baseLayer} onBaseLayer={onBaseLayer} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors, Esri, OpenTopoMap'
          url={tileUrls[baseLayer] || tileUrls.street}
          subdomains="abc"
          maxZoom={19}
        />
        {visibleDetections.map((d) => {
          const selected = d.id === selectedId
          const color = CATEGORY_COLORS[d.category] || '#6b7280'
          const heatmap = mapMode === 'heatmap'
          const cluster = mapMode === 'clusters' && d.count > 1
          return (
            <CircleMarker
              key={d.id}
              center={[d.latitude, d.longitude]}
              radius={cluster ? Math.min(24, 9 + d.count * 1.5) : heatmap ? Math.min(28, 7 + Math.sqrt(d.frp_mw || 0) / 3) : radiusFor(d.frp_mw, selected)}
              pathOptions={{
                color: selected ? '#0f172a' : '#334155',
                weight: selected ? 2.5 : 1,
                fillColor: color,
                fillOpacity: selected ? 0.95 : heatmap ? 0.22 : 0.72,
                opacity: 1,
              }}
              eventHandlers={{ click: () => d.count ? onSelect(d.id) : onSelect(d.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <span className="font-semibold text-slate-900">
                  {cluster ? `${d.count} detections` : SHORT_NAMES[d.category] || d.category}
                </span>
                <br />
                <span className="font-mono">
                  {cluster ? `${d.frp_mw.toFixed(1)} MW combined` : `${Math.round(d.category_probability * 100)}% · ${d.frp_mw} MW`}
                </span>
                <br />
                <span className="font-mono text-slate-500">{d.id}</span>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <MapLegend />

      {loading && (
        <Overlay>
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 rounded-full border-[3px]
              border-slate-200 border-t-orange-500" />
            <p className="text-sm text-slate-500">
              Loading detections from the classifier...
            </p>
          </div>
        </Overlay>
      )}

      {!loading && error && (
        <Overlay>
          <p className="text-sm font-semibold text-red-600">
            Backend unreachable
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {error}
          </p>
        </Overlay>
      )}

      {!loading && !error && empty && (
        <Overlay>
          <p className="text-sm font-semibold text-slate-700">
            No detections to show
          </p>
          <p className="text-xs text-slate-500 mt-1">
            All classes filtered out — enable a class to see markers again.
          </p>
          <button
            onClick={onClearFilters}
            className="mt-3 text-xs font-medium text-orange-600
              hover:text-orange-700 underline underline-offset-2"
          >
            Clear filters
          </button>
        </Overlay>
      )}
    </div>
  )
}
