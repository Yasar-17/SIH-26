import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList,
} from 'recharts'
import {
  CATEGORY_COLORS, PRIORITY_STYLES, SHORT_NAMES,
} from '../lib/constants'

const FACILITY_THRESHOLD_KM = 20

function Section({ title, children, className = '' }) {
  return (
    <div className={`px-4 sm:px-5 py-3.5 border-b border-slate-100 ${className}`}>
      <h4 className="text-[10px] font-semibold tracking-widest uppercase
        text-slate-400 mb-3">{title}</h4>
      {children}
    </div>
  )
}

function Reading({ label, value, unit }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-mono text-sm text-slate-800 mt-1 tabular-nums">
        {value}
        {unit && <span className="text-slate-400 text-xs ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold
      tracking-wider leading-none ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low}`}>
      {String(priority).toUpperCase()}
    </span>
  )
}

function ProbChart({ top3 }) {
  const data = top3.map((t) => ({
    name: SHORT_NAMES[t.class] || t.class,
    prob: t.probability,
    color: CATEGORY_COLORS[t.class] || '#6b7280',
  }))

  const BarLabel = (props) => {
    const { x, y, width, value } = props
    const pct = `${Math.round(value * 100)}%`
    return (
      <text
        x={x + width + 6}
        y={y + 7}
        fill="#64748b"
        fontSize={10}
        fontFamily="JetBrains Mono, monospace"
        dominantBaseline="middle"
      >
        {pct}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} layout="vertical"
        margin={{ top: 2, right: 42, bottom: 2, left: 0 }} barSize={14}>
        <XAxis type="number" domain={[0, 1]} hide />
        <YAxis type="category" dataKey="name" width={82}
          tick={{ fontSize: 11, fill: '#334155' }}
          axisLine={false} tickLine={false} />
        <Bar dataKey="prob" radius={[0, 4, 4, 0]} isAnimationActive={false}
          minPointSize={4}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          <LabelList dataKey="prob" content={<BarLabel />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 9h1M9 13h6M9 17h6" />
    </svg>
  )
}

function DetailBody({ d, onExportPdf, onClose }) {
  const color = CATEGORY_COLORS[d.predicted_class] || '#6b7280'
  const whyNotBullets = d.why_not
    ? d.why_not.explanation.split('; ').filter((s) => s.trim())
    : []
  const i5 = d.features?.brightness_temp_i5_k

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header: close button + detection ID */}
      <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] text-slate-400">
            {d.id}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onExportPdf?.(d)}
              className="h-7 px-2.5 rounded-lg flex items-center gap-1.5
                text-[10px] font-medium text-slate-400
                hover:bg-slate-100 hover:text-orange-600"
              title="Export as PDF"
            >
              <PdfIcon />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center
                text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close detail panel"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Class name + priority badge */}
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: color }} />
          <h2 className="font-display font-bold text-slate-900 leading-tight
            text-lg sm:text-xl">
            {d.predicted_class}
          </h2>
          <PriorityBadge priority={d.priority} />
        </div>

        {/* Confidence */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-base font-semibold text-slate-800">
            {Math.round(d.probability * 100)}%
          </span>
          <span className="text-xs text-slate-400">classification confidence</span>
        </div>

        {/* Priority reason */}
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {d.priority_reason}
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Section title="Location">
          <div className="space-y-1.5 text-xs text-slate-600">
            <p className="font-mono text-sm text-slate-800">
              {d.latitude.toFixed(4)}°N, {d.longitude.toFixed(4)}°E
            </p>
            <p>Detected {new Date(d.detected_at).toLocaleString()}</p>
            <p className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 border
                border-slate-200 text-[10px] font-medium text-slate-500
                uppercase tracking-wide">{d.source}</span>
            </p>
            {d.nearest_industrial ? (
              <p className="flex items-center gap-1.5 pt-1">
                <span className="text-slate-400">Nearest:</span>
                <span className="text-slate-700">{d.nearest_industrial.name}</span>
                <span className="font-mono text-slate-500">
                  ({(d.nearest_industrial.distance_m / 1000).toFixed(0)} km)
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 pt-1 text-slate-400 text-xs">
                No facilities within {FACILITY_THRESHOLD_KM} km
              </p>
            )}
          </div>
        </Section>

        <Section title="Thermal readings">
          <div className="grid grid-cols-2 gap-2.5">
            <Reading label="FRP" value={d.frp_mw.toFixed(1)} unit="MW" />
            <Reading label="Brightness I4" value={
              Math.round(d.brightness_temp_k)} unit="K" />
            {i5 != null && (
              <Reading label="Brightness I5" value={
                Math.round(i5)} unit="K" />
            )}
            <Reading label="Sensor Confidence" value={
              Math.round(d.confidence * 100)} unit="%" />
          </div>
        </Section>

        <Section title="Classification (calibrated)">
          <ProbChart top3={d.top_3} />
        </Section>

        <Section title="Key evidence">
          <ul className="space-y-2.5">
            {d.evidence.map((e, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-slate-600
                leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }} />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Section>

        {d.why_not && (
          <Section title={`Why not ${SHORT_NAMES[d.why_not.class_name]
            || d.why_not.class_name}?`}>
            <ul className="space-y-2.5">
              {whyNotBullets.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600
                  leading-relaxed">
                  <svg viewBox="0 0 24 24" className="h-3 w-3 mt-0.5 shrink-0
                    text-slate-400" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  <span>{b.replace(/\.$/, '')}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="px-4 sm:px-5 py-3 text-[10px] font-mono text-slate-400">
          {d.model_version} · {d.features
            ? Object.keys(d.features).length + ' features'
            : ''}
        </div>
      </div>
    </div>
  )
}

export default function DetailPanel({ entry, onClose, onExportPdf }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Desktop: right side panel, capped at 400px */}
      <aside className="
        hidden sm:flex
        fixed inset-y-0 right-0 z-[70]
        w-[400px] max-w-[90vw]
        bg-white border-l border-slate-200
        flex-col h-full shadow-2xl
      ">
        {(!entry || entry.status === 'loading') && (
          <div className="h-full flex flex-col items-center justify-center
            gap-3 text-slate-400">
            <div className="h-7 w-7 rounded-full border-[3px]
              border-slate-200 border-t-orange-500" />
            <p className="text-xs">Classifying detection...</p>
          </div>
        )}

        {entry?.status === 'error' && (
          <div className="h-full flex flex-col items-center justify-center
            gap-2 px-6 text-center">
            <p className="text-sm font-semibold text-red-600">
              Could not load detail
            </p>
            <p className="text-xs text-slate-500">{entry.message}</p>
          </div>
        )}

        {entry?.status === 'ok' && <DetailBody d={entry.data} onExportPdf={onExportPdf} onClose={onClose} />}
      </aside>

      {/* Mobile: bottom drawer, 60% height */}
      <aside className="
        sm:hidden
        fixed inset-x-0 bottom-0 z-[70]
        w-full h-[60vh]
        bg-white border-t border-slate-200
        flex flex-col shadow-2xl
        rounded-t-2xl
      ">
        {(!entry || entry.status === 'loading') && (
          <div className="h-full flex flex-col items-center justify-center
            gap-3 text-slate-400">
            <div className="h-7 w-7 rounded-full border-[3px]
              border-slate-200 border-t-orange-500" />
            <p className="text-xs">Classifying detection...</p>
          </div>
        )}

        {entry?.status === 'error' && (
          <div className="h-full flex flex-col items-center justify-center
            gap-2 px-6 text-center">
            <p className="text-sm font-semibold text-red-600">
              Could not load detail
            </p>
            <p className="text-xs text-slate-500">{entry.message}</p>
          </div>
        )}

        {entry?.status === 'ok' && <DetailBody d={entry.data} onExportPdf={onExportPdf} onClose={onClose} />}
      </aside>
    </>
  )
}
