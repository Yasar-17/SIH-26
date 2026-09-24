import { useMemo, useState } from 'react'
import { PRIORITY_STYLES } from '../lib/constants'

function CloseIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg> }

export default function ReviewQueue({ detections, onSelectIncident, onClose, reviewedIds, followUpIds }) {
  const [sort, setSort] = useState('priority')
  const items = useMemo(() => [...detections].sort((a, b) => {
    if (sort === 'recent') return new Date(b.detected_at) - new Date(a.detected_at)
    if (sort === 'confidence') return (b.category_probability || 0) - (a.category_probability || 0)
    const rank = { High: 0, Medium: 1, Low: 2 }
    return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3)
  }), [detections, sort])

  return <aside className="fixed inset-y-0 right-0 z-[68] flex w-[390px] max-w-[94vw] flex-col border-l border-slate-200 bg-white shadow-2xl" aria-label="Incident review queue">
    <div className="shrink-0 border-b border-slate-200 px-4 py-4">
      <div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Operational view</p><h2 className="font-display text-lg font-bold text-slate-900">Review queue <span className="font-mono text-sm text-slate-400">{items.length}</span></h2></div><button onClick={onClose} className="icon-button" aria-label="Close review queue"><CloseIcon /></button></div>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">{[['priority', 'Priority'], ['recent', 'Recent'], ['confidence', 'Confidence']].map(([value, label]) => <button key={value} onClick={() => setSort(value)} className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold ${sort === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">{items.map((d) => <button key={d.id} onClick={() => onSelectIncident(d)} className="block w-full px-4 py-3 text-left hover:bg-orange-50 focus:bg-orange-50">
      <div className="mb-1 flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-slate-400">{d.id}</span><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${PRIORITY_STYLES[d.priority] || PRIORITY_STYLES.Low}`}>{d.priority}</span></div>
      <p className="text-sm font-semibold text-slate-800">{d.category}</p><div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500"><span className="font-mono">{Math.round((d.category_probability || 0) * 100)}% confidence</span><span>{d.frp_mw?.toFixed(1)} MW</span><span>{d.source}</span>{reviewedIds?.has(d.id) && <span className="text-emerald-600">Reviewed</span>}{followUpIds?.has(d.id) && <span className="text-orange-600">Follow-up</span>}</div>
      <p className="mt-1 text-[10px] text-slate-400">{new Date(d.detected_at).toLocaleString()}</p>
    </button>)}</div>
  </aside>
}