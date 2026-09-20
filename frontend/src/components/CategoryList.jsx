import { useMemo, useState } from 'react'
import {
  CATEGORY_COLORS, SHORT_NAMES, PRIORITY_STYLES,
} from '../lib/constants'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export default function CategoryList({ category, detections, onSelectIncident, onClose }) {
  const [sortBy, setSortBy] = useState('confidence')

  const items = useMemo(() => {
    const list = (detections || []).filter((d) => d.category === category)
    const sorted = [...list]
    if (sortBy === 'confidence') {
      sorted.sort((a, b) => (b.category_probability || 0) - (a.category_probability || 0))
    } else {
      sorted.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
    }
    return sorted
  }, [detections, category, sortBy])

  const color = CATEGORY_COLORS[category] || '#6b7280'

  return (
    <aside className="
      fixed inset-y-0 right-0 z-[68]
      w-[380px] max-w-[90vw]
      bg-white border-l border-slate-200
      flex flex-col shadow-2xl
      animate-slide-right
    ">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: color }} />
            <h2 className="font-display font-bold text-slate-900 text-base">
              {SHORT_NAMES[category] || category}
            </h2>
            <span className="inline-flex items-center justify-center
              h-5 min-w-[20px] px-1.5 rounded-full
              font-mono text-[10px] font-bold
              bg-slate-100 text-slate-600">
              {items.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center
              text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close category list"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setSortBy('confidence')}
            className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition
              ${sortBy === 'confidence'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            By confidence
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition
              ${sortBy === 'recent'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            By recent
          </button>
        </div>
      </div>

      {/* Incident list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No incidents of this type
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((d) => (
              <div
                key={d.id}
                className="group px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => onSelectIncident(d)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {d.id}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold
                    tracking-wider leading-none shrink-0
                    ${PRIORITY_STYLES[d.priority] || PRIORITY_STYLES.Low}`}>
                    {String(d.priority || 'Low').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-700">
                    {d.latitude?.toFixed(4)}°N, {d.longitude?.toFixed(4)}°E
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="font-mono font-semibold" style={{ color }}>
                      {Math.round((d.category_probability || 0) * 100)}%
                    </span>
                    <span>{d.frp_mw?.toFixed(1)} MW</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border
                      border-slate-200 text-[9px] font-medium text-slate-500
                      uppercase tracking-wide">
                      {d.source}
                    </span>
                  </div>
                  <ChevronIcon />
                </div>

                {d.detected_at && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(d.detected_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
