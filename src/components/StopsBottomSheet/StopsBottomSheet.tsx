import { useState, useRef, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { StopCard, type StopLine } from '../StopCard/StopCard'
import { cn } from '../../shared/lib/cn'
import { useMapStore, SHEET_SNAP_VH, type SheetSnap } from '../../features/map/store/mapStore'

export interface StopItem {
  id: string
  name: string
  distance: string
  walkMinutes: number
  lines: StopLine[]
  isFavorite?: boolean
  lat: number
  lng: number
}

interface StopsBottomSheetProps {
  stops: StopItem[]
  onSelectStop?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  className?: string
}

const SNAP_HEIGHTS: Record<SheetSnap, string> = {
  peek: 'h-[38vh]',
  half: 'h-[60vh]',
  full: 'h-[85vh]',
}

export function StopsBottomSheet({
  stops,
  onSelectStop,
  onToggleFavorite,
  className,
}: StopsBottomSheetProps) {
  const { sheetSnap: snap, setSheetSnap: setSnap, selectedStopId } = useMapStore()
  const [search, setSearch] = useState('')
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [dragState, setDragState] = useState<{
    startY: number
    currentY: number
  } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (!selectedStopId) return
    const el = cardRefs.current.get(selectedStopId)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedStopId])

  const filteredStops = stops.filter((stop) => {
    if (filterFavorites && !stop.isFavorite) return false
    return stop.name.toLowerCase().includes(search.toLowerCase())
  })

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragState({
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
    })
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragState) return
      setDragState((prev) =>
        prev ? { ...prev, currentY: e.touches[0].clientY } : null
      )
    },
    [dragState]
  )

  const handleTouchEnd = useCallback(() => {
    if (!dragState) return
    const delta = dragState.startY - dragState.currentY

    if (Math.abs(delta) > 50) {
      const snaps: SheetSnap[] = ['peek', 'half', 'full']
      const currentIndex = snaps.indexOf(snap)
      if (delta > 0 && currentIndex < 2) {
        setSnap(snaps[currentIndex + 1])
      } else if (delta < 0 && currentIndex > 0) {
        setSnap(snaps[currentIndex - 1])
      }
    }

    setDragState(null)
  }, [dragState, snap])

  const handleClickToggle = useCallback(() => {
    setSnap(snap === 'peek' ? 'half' : 'peek')
  }, [snap, setSnap])

  return (
    <div
      ref={sheetRef}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 transition-all duration-500 ease-out',
        SNAP_HEIGHTS[snap],
        className
      )}
    >
      <div className="glass h-full rounded-t-3xl flex flex-col shadow-elevated overflow-hidden">
        <div
          className="flex flex-col items-center pt-1.5 pb-2 px-5 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClickToggle}
        >
          <div className="handle-bar mb-3" />
          <div className="w-full flex justify-between items-end mb-2">
            <div>
              <span className="font-geist text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                Próximo de você
              </span>
              <h2 className="text-lg font-semibold text-on-surface leading-tight">
                Paradas Próximas
              </h2>
            </div>
            <div className="flex gap-1">
              <button
                className={cn(
                  'p-2 transition-colors',
                  filterFavorites ? 'text-primary' : 'text-on-surface-dim hover:text-on-surface'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setFilterFavorites((prev) => !prev)
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filterFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
              <button className="p-2 text-on-surface-dim hover:text-on-surface transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-dim" />
            <input
              className="w-full bg-surface-mid/60 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-dim focus:ring-1 focus:ring-primary/30 focus:border-primary/20 transition-all outline-none"
              placeholder="Para onde vamos?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-3 custom-scrollbar">
          {filteredStops.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-on-surface-dim">
              <Search className="w-8 h-8 mb-3 opacity-40" />
              <p className="text-sm">
                {filterFavorites
                  ? 'Nenhuma parada favorita visível'
                  : 'Nenhuma parada encontrada'}
              </p>
            </div>
          )}
          {filteredStops.map((stop, index) => (
            <StopCard
              key={stop.id}
              cardRef={(el) => {
                if (el) cardRefs.current.set(stop.id, el)
                else cardRefs.current.delete(stop.id)
              }}
              id={stop.id}
              name={stop.name}
              distance={stop.distance}
              walkMinutes={stop.walkMinutes}
              lines={stop.lines}
              isFavorite={stop.isFavorite}
              lat={stop.lat}
              lng={stop.lng}
              sheetHeightVh={SHEET_SNAP_VH[snap]}
              isClosest={index === 0}
              isSelected={stop.id === selectedStopId}
              onToggleFavorite={() => onToggleFavorite?.(stop.id)}
              onClick={() => onSelectStop?.(stop.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
