import { useMemo, useState } from 'react'

function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
}

export default function FilterBar({ priority, onPriority, source, onSource,
                                    minConfidence, onMinConfidence, sources,
                                    minFrp, maxFrp, onFrpChange, dateFrom, dateTo,
                                    onDateFrom, onDateTo, reviewFilter, onReviewFilter,
                                    activeCount, onClear, onOpenQueue, queueCount }) {
  const [open, setOpen] = useState(false)
  const sourceOptions = useMemo(() => ['all', ...sources], [sources])

  return (
    <div className="relative z-[80] shrink-0 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-700">
          <FilterIcon /> Filters {activeCount > 0 && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">{activeCount}</span>}
        </button>
        <button onClick={onOpenQueue} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-700">
          Review queue <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px]">{queueCount}</span>
        </button>
        {priority !== 'all' && <button onClick={() => onPriority('all')} className="filter-chip">Priority: {priority} ×</button>}
        {source !== 'all' && <button onClick={() => onSource('all')} className="filter-chip">Source: {source} ×</button>}
        {minConfidence > 0 && <button onClick={() => onMinConfidence(0)} className="filter-chip">Confidence: {Math.round(minConfidence * 100)}%+ ×</button>}
        {(minFrp > 0 || maxFrp < 500) && <button onClick={() => onFrpChange(0, 500)} className="filter-chip">FRP: {minFrp}-{maxFrp} MW ×</button>}
        {(dateFrom || dateTo) && <button onClick={() => { onDateFrom(''); onDateTo('') }} className="filter-chip">Date range ×</button>}
        {reviewFilter !== 'all' && <button onClick={() => onReviewFilter('all')} className="filter-chip">Review: {reviewFilter} ×</button>}
        {activeCount > 0 && <button onClick={onClear} className="shrink-0 px-2 text-xs text-slate-500 underline underline-offset-2 hover:text-slate-900">Clear all</button>}
      </div>
      {open && <div className="absolute left-3 right-3 top-12 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:left-4 sm:right-auto sm:w-[430px] sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">Priority
          <select value={priority} onChange={(event) => onPriority(event.target.value)} className="mt-1.5 w-full control-input"><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Data source
          <select value={source} onChange={(event) => onSource(event.target.value)} className="mt-1.5 w-full control-input">{sourceOptions.map((value) => <option key={value} value={value}>{value === 'all' ? 'All sources' : value}</option>)}</select>
        </label>
        <label className="col-span-full text-xs font-semibold text-slate-600">Minimum confidence <span className="font-mono text-orange-600">{Math.round(minConfidence * 100)}%</span>
          <input type="range" min="0" max="0.9" step="0.1" value={minConfidence} onChange={(event) => onMinConfidence(Number(event.target.value))} className="mt-2 w-full accent-orange-500" />
          <span className="mt-1 flex justify-between text-[10px] font-normal text-slate-400"><span>Any</span><span>90%+</span></span>
        </label>
        <label className="text-xs font-semibold text-slate-600">Minimum FRP (MW)
          <input type="number" min="0" max={maxFrp} value={minFrp} onChange={(event) => onFrpChange(Number(event.target.value), maxFrp)} className="mt-1.5 w-full control-input" />
        </label>
        <label className="text-xs font-semibold text-slate-600">Maximum FRP (MW)
          <input type="number" min={minFrp} value={maxFrp} onChange={(event) => onFrpChange(minFrp, Number(event.target.value))} className="mt-1.5 w-full control-input" />
        </label>
        <label className="text-xs font-semibold text-slate-600">From date
          <input type="date" value={dateFrom} onChange={(event) => onDateFrom(event.target.value)} className="mt-1.5 w-full control-input" />
        </label>
        <label className="text-xs font-semibold text-slate-600">To date
          <input type="date" value={dateTo} onChange={(event) => onDateTo(event.target.value)} className="mt-1.5 w-full control-input" />
        </label>
        <label className="col-span-full text-xs font-semibold text-slate-600">Review status
          <select value={reviewFilter} onChange={(event) => onReviewFilter(event.target.value)} className="mt-1.5 w-full control-input"><option value="all">All incidents</option><option value="unreviewed">Unreviewed</option><option value="reviewed">Reviewed</option><option value="follow-up">Follow-up</option></select>
        </label>
      </div>}
    </div>
  )
}