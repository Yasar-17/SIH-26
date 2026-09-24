import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'
import MapView from '../components/MapView'
import DetailPanel from '../components/DetailPanel'
import CategoryList from '../components/CategoryList'
import StatusBar from '../components/StatusBar'
import FilterBar from '../components/FilterBar'
import ReviewQueue from '../components/ReviewQueue'
import { CLASSES, REFRESH_INTERVAL_MS } from '../lib/constants'
import { exportIncidentPdf } from '../lib/exportPdf'
import * as api from '../lib/api'

export default function Dashboard() {
  const [detections, setDetections] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState(() => new Set(CLASSES))
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [minConfidence, setMinConfidence] = useState(0)
  const [minFrp, setMinFrp] = useState(0)
  const [maxFrp, setMaxFrp] = useState(500)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reviewFilter, setReviewFilter] = useState('all')
  const [reviewedIds, setReviewedIds] = useState(() => new Set())
  const [followUpIds, setFollowUpIds] = useState(() => new Set())
  const [mapMode, setMapMode] = useState('points')
  const [baseLayer, setBaseLayer] = useState('street')
  const [queueOpen, setQueueOpen] = useState(false)

  const detailRef = useRef({})
  const [, setDetailTick] = useState(0)
  const bumpDetail = () => setDetailTick((n) => n + 1)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const [d, s] = await Promise.all([
        api.getDetections({ limit: 2000 }),
        api.getStats(),
      ])
      setDetections(d)
      setStats(s)
      setError(null)
      setLastRefresh(new Date())
    } catch (e) {
      setError(`Is the FastAPI server running on localhost:8000? (${e.message})`)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (!selectedId || detailRef.current[selectedId]) return
    detailRef.current[selectedId] = { status: 'loading' }
    bumpDetail()
    api.getDetection(selectedId)
      .then((data) => {
        detailRef.current[selectedId] = { status: 'ok', data }
        bumpDetail()
      })
      .catch((e) => {
        detailRef.current[selectedId] = { status: 'error', message: e.message }
        bumpDetail()
      })
  }, [selectedId])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        document.querySelector('[data-dashboard-search]')?.focus()
      }
      if (event.key === 'Escape') {
        setSelectedId(null)
        setActiveCategory(null)
        setQueueOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    if (!detections) return []
    const q = search.trim().toLowerCase()
    return detections.filter((d) => {
      if (!filters.has(d.category)) return false
      if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false
      if (sourceFilter !== 'all' && d.source !== sourceFilter) return false
      if ((d.category_probability || 0) < minConfidence) return false
      if ((d.frp_mw || 0) < minFrp || (d.frp_mw || 0) > maxFrp) return false
      const detected = new Date(d.detected_at)
      if (dateFrom && detected < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && detected > new Date(`${dateTo}T23:59:59`)) return false
      if (reviewFilter === 'unreviewed' && reviewedIds.has(d.id)) return false
      if (reviewFilter === 'reviewed' && !reviewedIds.has(d.id)) return false
      if (reviewFilter === 'follow-up' && !followUpIds.has(d.id)) return false
      if (!q) return true
      return [d.id, d.category, d.notes, d.source,
        d.latitude.toFixed(4), d.longitude.toFixed(4)]
        .some((s) => String(s).toLowerCase().includes(q))
    })
  }, [detections, filters, search, priorityFilter, sourceFilter, minConfidence,
    minFrp, maxFrp, dateFrom, dateTo, reviewFilter, reviewedIds, followUpIds])

  const toggleClass = (c) => {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const clearFilters = () => {
    setFilters(new Set(CLASSES))
    setSearch('')
    setPriorityFilter('all')
    setSourceFilter('all')
    setMinConfidence(0)
    setMinFrp(0)
    setMaxFrp(500)
    setDateFrom('')
    setDateTo('')
    setReviewFilter('all')
  }

  const activeFilterCount = (filters.size < CLASSES.length ? 1 : 0)
    + (priorityFilter !== 'all' ? 1 : 0)
    + (sourceFilter !== 'all' ? 1 : 0)
    + (minConfidence > 0 ? 1 : 0)
    + (minFrp > 0 || maxFrp < 500 ? 1 : 0)
    + (dateFrom || dateTo ? 1 : 0)
    + (reviewFilter !== 'all' ? 1 : 0)

  const updateReview = (id, status) => {
    if (status === 'reviewed') {
      setReviewedIds((current) => new Set(current).add(id))
      setFollowUpIds((current) => { const next = new Set(current); next.delete(id); return next })
    } else {
      setFollowUpIds((current) => new Set(current).add(id))
    }
  }

  const handleSelectCategory = (category) => {
    setActiveCategory((prev) => prev === category ? null : category)
    setSelectedId(null)
    setFlyToTarget(null)
  }

  const handleSelectIncident = (d) => {
    setSelectedId(d.id)
    setFlyToTarget({
      id: d.id,
      lat: d.latitude,
      lon: d.longitude,
    })
  }

  const handleCloseCategoryList = () => {
    setActiveCategory(null)
    setSelectedId(null)
    setFlyToTarget(null)
  }

  const handleCloseDetail = () => {
    setSelectedId(null)
    setFlyToTarget(null)
  }

  const empty = detections !== null && filtered.length === 0

  return (
    <div className="h-full flex flex-col bg-slate-100 font-sans">
      <TopNav
        search={search}
        onSearch={setSearch}
        lastRefresh={lastRefresh}
        onRefresh={refresh}
        refreshing={refreshing}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        searchInputProps={{ 'data-dashboard-search': true }}
      />

      <FilterBar
        priority={priorityFilter}
        onPriority={setPriorityFilter}
        source={sourceFilter}
        onSource={setSourceFilter}
        minConfidence={minConfidence}
        onMinConfidence={setMinConfidence}
        minFrp={minFrp}
        maxFrp={maxFrp}
        onFrpChange={(min, max) => { setMinFrp(min); setMaxFrp(max) }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFrom={setDateFrom}
        onDateTo={setDateTo}
        reviewFilter={reviewFilter}
        onReviewFilter={setReviewFilter}
        sources={Object.keys(stats?.sources || {})}
        activeCount={activeFilterCount}
        onClear={clearFilters}
        onOpenQueue={() => setQueueOpen(true)}
        queueCount={filtered.filter((d) => d.priority === 'High').length}
      />

      <div className="flex flex-1 min-h-0 relative">
        <Sidebar
          stats={stats}
          filters={filters}
          onToggleClass={toggleClass}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onClearFilters={clearFilters}
          onSelectCategory={handleSelectCategory}
          activeCategory={activeCategory}
        />

        <main className="relative flex-1 min-w-0 z-0">
          <MapView
            detections={filtered}
            selectedId={selectedId}
            onSelect={(id) => {
              const d = filtered.find((x) => x.id === id)
              if (d) {
                setSelectedId(d.id)
                setFlyToTarget({ id: d.id, lat: d.latitude, lon: d.longitude })
                setActiveCategory(null)
              }
            }}
            loading={detections === null}
            error={error}
            empty={empty}
            onClearFilters={clearFilters}
            flyToTarget={flyToTarget}
            onOpenQueue={() => setQueueOpen(true)}
            mapMode={mapMode}
            onMapMode={setMapMode}
            baseLayer={baseLayer}
            onBaseLayer={setBaseLayer}
          />
        </main>

        {/* Right-side category list panel */}
        {activeCategory && (
          <CategoryList
            category={activeCategory}
            detections={detections}
            onSelectIncident={handleSelectIncident}
            onClose={handleCloseCategoryList}
          />
        )}
      </div>

      {/* Detail panel (individual incident) */}
      {selectedId && (
        <DetailPanel
          entry={detailRef.current[selectedId]}
          onClose={handleCloseDetail}
          onExportPdf={exportIncidentPdf}
          onReview={(status) => { updateReview(selectedId, status); setSelectedId(null) }}
          reviewStatus={followUpIds.has(selectedId) ? 'follow-up' : reviewedIds.has(selectedId) ? 'reviewed' : 'unreviewed'}
        />
      )}

      {queueOpen && (
        <ReviewQueue
          detections={filtered}
          onSelectIncident={handleSelectIncident}
          onClose={() => setQueueOpen(false)}
          reviewedIds={reviewedIds}
          followUpIds={followUpIds}
        />
      )}

      <StatusBar
        shown={filtered.length}
        total={detections?.length ?? 0}
        lastRefresh={lastRefresh}
        error={error}
      />
    </div>
  )
}
