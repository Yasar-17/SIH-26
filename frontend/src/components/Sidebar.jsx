import { CLASSES, SHORT_NAMES, CATEGORY_COLORS } from '../lib/constants'

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)} ${parseInt(h.substring(2, 4), 16)} ${parseInt(h.substring(4, 6), 16)}`
}

const CATEGORY_TINT = {
  'Industrial Fire': '#FEF2F2',
  'Gas Flare': '#FFF7ED',
  Wildfire: '#F0FDF4',
  'Agricultural Burning': '#FEFCE8',
  'Other/Unknown': '#F9FAFB',
}

const CATEGORY_TINT_DEEPER = {
  'Industrial Fire': '#FEE2E2',
  'Gas Flare': '#FFEDD5',
  Wildfire: '#DCFCE7',
  'Agricultural Burning': '#FEF9C3',
  'Other/Unknown': '#F3F4F6',
}

const CATEGORY_ICONS = {
  'Industrial Fire': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 23c-4.97 0-9-2.69-9-6 0-2.22 1.35-3.76 2.5-5 .6-.67 1.14-1.22 1.5-1.74.36.52.9 1.07 1.5 1.74C9.65 13.24 11 14.78 11 17c0 1.1-.45 2-1 2.5.55.5 1.45 1 3 1s2.45-.5 3-1c-.55-.5-1-1.4-1-2.5 0-2.22 1.35-3.76 2.5-5 .6-.67 1.14-1.22 1.5-1.74.36.52.9 1.07 1.5 1.74 1.15 1.24 2.5 2.78 2.5 5 0 3.31-4.03 6-9 6Z"/>
    </svg>
  ),
  'Gas Flare': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.5 1 3.5S10 12 10 14c0 2.5-1 4-2 5.5S6 22 6 22h12s0-1-2-2.5-2-3-2-5.5c0-2 .5-3 1-3.5s1-2 1-3.5c0-2.5-1.5-5-4-5Z"/>
    </svg>
  ),
  Wildfire: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M13 2 4.09 12.07c-.63 1.36-.1 3 1.11 3.67l6.92 3.93c1.22.68 2.74.15 3.37-1.21l.12-.26.12.26c.63 1.36 2.15 1.89 3.37 1.21l6.92-3.93c1.21-.67 1.74-2.31 1.11-3.67L13 2Z"/>
    </svg>
  ),
  'Agricultural Burning': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-2a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM11 1h2v3h-2V1Zm0 19h2v3h-2v-3ZM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93ZM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121ZM1 11h3v2H1v-2Zm19 0h3v2h-3v-2ZM3.515 19.071l2.121-2.121 1.414 1.414-2.121 2.121-1.414-1.414ZM16.95 5.636l2.121-2.121 1.414 1.414-2.121 2.121L16.95 5.636Z"/>
    </svg>
  ),
  'Other/Unknown': (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 17h-2v-2h2v2Zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25Z"/>
    </svg>
  ),
}

export default function Sidebar({ stats, filters, onToggleClass, open, onClose }) {
  const byClass = stats?.by_class ?? {}
  const sources = stats?.sources ?? {}

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`
        shrink-0 bg-[#F7F8FA] border-r-2 border-[#9CA3AF] text-[#1A1D21] flex flex-col
        shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]
        fixed md:static top-14 bottom-0 left-0 z-[70]
        w-[260px] md:w-[230px] lg:w-[260px] xl:w-[300px]
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="md:hidden px-4 pt-3 pb-1 flex justify-end">
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center
              text-gray-400 hover:bg-gray-100 transition"
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section header */}
        <div className="px-5 pt-3 md:pt-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-4 w-4 text-gray-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <h2 className="text-[11px] font-semibold tracking-[0.14em]
              uppercase text-gray-400">Filter by class</h2>
          </div>
          <div className="h-px bg-[#9CA3AF]" />
        </div>

        {/* Filter cards */}
        <div className="px-3 space-y-2 pb-4">
          {CLASSES.map((c) => {
            const on = filters.has(c)
            const color = CATEGORY_COLORS[c]
            const count = byClass[c]
            const tint = CATEGORY_TINT[c]
            const tintDeeper = CATEGORY_TINT_DEEPER[c]

            return (
              <label
                key={c}
                className={`
                  group flex items-center gap-0 rounded-lg cursor-pointer
                  select-none transition-all duration-150 relative overflow-hidden
                  border
                  ${on
                    ? 'border-gray-400 shadow-sm'
                    : 'border-gray-300/60 opacity-50 hover:opacity-75'}
                `}
                style={{
                  background: on ? tint : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (on) e.currentTarget.style.background = tintDeeper
                }}
                onMouseLeave={(e) => {
                  if (on) e.currentTarget.style.background = tint
                }}
              >
                {/* Left accent bar */}
                <span
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg transition-opacity duration-150"
                  style={{
                    backgroundColor: color,
                    opacity: on ? 1 : 0.25,
                  }}
                />

                {/* Hidden checkbox for keyboard/accessibility */}
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggleClass(c)}
                  className="sr-only"
                />

                {/* Icon */}
                <span
                  className="shrink-0 w-10 flex items-center justify-center transition-colors duration-150"
                  style={{ color: on ? color : '#9CA3AF' }}
                >
                  {CATEGORY_ICONS[c]}
                </span>

                {/* Label */}
                <span className="flex-1 text-[13px] font-medium text-[#1A1D21] py-2.5">
                  {SHORT_NAMES[c]}
                </span>

                {/* Count badge */}
                <span className="shrink-0 mr-3 min-w-[28px] text-center">
                  <span
                    className="inline-flex items-center justify-center
                      h-[22px] min-w-[28px] px-1.5 rounded-md
                      font-mono text-[11px] font-semibold transition-colors duration-150"
                    style={{
                      backgroundColor: on ? tint : '#F1F2F4',
                      color: on ? color : '#9CA3AF',
                    }}
                  >
                    {count ?? '–'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>

        {/* Stats footer card */}
        <div className="mt-auto mx-3 mb-3 rounded-lg border border-[#9CA3AF] bg-[#FAFAFB] shadow-sm">
          {/* High priority — primary risk metric */}
          <div className="flex items-center justify-between px-4 py-2.5
            border-b border-[#9CA3AF]">
            <span className="flex items-center gap-2 text-[12px] font-medium text-[#1A1D21]">
              <span className="flex items-center justify-center h-5 w-5 rounded
                bg-red-50">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-red-500">
                  <path d="M12 2L1 21h22L12 2Zm0 4 7.53 13H4.47L12 6Zm-1 5v4h2v-4h-2Zm0 6v2h2v-2h-2Z"/>
                </svg>
              </span>
              High priority
            </span>
            <span
              className="inline-flex items-center justify-center
                h-6 min-w-[32px] px-2 rounded-md
                font-mono text-[12px] font-bold
                bg-red-50 text-red-600"
            >
              {stats?.high_priority ?? '–'}
            </span>
          </div>

          {/* Total detections */}
          <div className="flex items-center justify-between px-4 py-2
            border-b border-[#9CA3AF]/60">
            <span className="text-[12px] text-gray-500">Total detections</span>
            <span className="font-mono text-[12px] font-semibold text-[#1A1D21]">
              {stats?.total ?? '–'}
            </span>
          </div>

          {/* Sources */}
          {Object.keys(sources).length > 0 && (
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[12px] text-gray-500">Sources</span>
              <span className="font-mono text-[11px] text-gray-500">
                {Object.entries(sources)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(' · ')}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
