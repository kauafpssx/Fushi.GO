import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronDown, Accessibility, Snowflake, Clock, Wifi, Navigation } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getStopPredictions } from '../../features/stops/api/getStops'
import { stopKeys } from '../../queryKeys/stops'
import type { StopService } from '../../features/stops/types'
import { cn } from '../../shared/lib/cn'
import { slugify } from '../../shared/utils/slugify'
import { BusIcon, WalkIcon } from '../Icons/Icons'
import { Skeleton } from '../Skeleton/Skeleton'
import { useMap } from '../../features/map/hooks/useMap'
import { useFavoritesStore } from '../../features/favorites/store/favoritesStore'

export interface StopLine {
  name: string
  arrivalMinutes: number | null
}

interface StopCardProps {
  id: string
  name: string
  distance: string
  walkMinutes: number
  lat: number
  lng: number
  sheetHeightVh: number
  lines: StopLine[]
  isFavorite?: boolean
  isClosest?: boolean
  isSelected?: boolean
  onToggleFavorite?: () => void
  onClick?: () => void
  dimmed?: boolean
  cardRef?: (el: HTMLDivElement | null) => void
}

function formatPrediction(seconds: number): string {
  if (seconds <= 0) return 'Chegando'
  const min = Math.round(seconds / 60)
  if (min === 1) return '1 min'
  return `${min} min`
}

function getBestPrediction(service: StopService): {
  seconds: number | null
  isScheduled: boolean
  isRealTime: boolean
  vehicle: StopService['vehicles'][number] | null
} {
  if (service.vehicles.length > 0) {
    const best = service.vehicles.reduce((min, v) =>
      v.prediction < min.prediction ? v : min
    , service.vehicles[0])

    if (best.prediction > 0 || best.type === null) {
      return {
        seconds: best.prediction,
        isScheduled: best.type === 'SCHEDULE',
        isRealTime: best.type !== 'SCHEDULE',
        vehicle: best,
      }
    }
  }

  if (service.totalTravelTimeUntilStopSeconds > 0) {
    return {
      seconds: service.totalTravelTimeUntilStopSeconds,
      isScheduled: true,
      isRealTime: false,
      vehicle: null,
    }
  }

  return { seconds: null, isScheduled: false, isRealTime: false, vehicle: null }
}

function categorizePredictions(services: StopService[], favoriteIds: Set<string>) {
  const withPrediction = services.map((service) => ({ service, ...getBestPrediction(service) }))

  const sortByFavoriteAndTime = (a: { service: StopService; seconds: number | null }, b: { service: StopService; seconds: number | null }) => {
    const aFav = favoriteIds.has(a.service.serviceId) ? 0 : 1
    const bFav = favoriteIds.has(b.service.serviceId) ? 0 : 1
    if (aFav !== bFav) return aFav - bFav
    return (a.seconds ?? Infinity) - (b.seconds ?? Infinity)
  }

  const realTime = withPrediction
    .filter((p) => p.isRealTime && p.seconds != null)
    .sort(sortByFavoriteAndTime)

  const scheduled = withPrediction
    .filter((p) => !p.isRealTime && p.seconds != null)
    .sort(sortByFavoriteAndTime)

  const others = withPrediction.filter((p) => p.seconds == null)

  return { realTime, scheduled, others }
}

function ServiceBadge({ service, stopId, stopName }: { service: StopService; stopId: string; stopName: string }) {
  const navigate = useNavigate()
  const { seconds: prediction, isScheduled, isRealTime, vehicle: bestVehicle } = getBestPrediction(service)
  const [showAbsolute, setShowAbsolute] = useState(false)
  const { isServiceFavorite, addService, removeService } = useFavoritesStore()

  const formatAbsolute = (secs: number): string => {
    const d = new Date(Date.now() + secs * 1000)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-surface-mid/40 border border-white/[0.03]">
      <div
        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          if (service.serviceId) navigate(`/vehicle/${service.routeCode}/${slugify(service.serviceMnemonic)}/${slugify(stopName)}`, { state: { serviceId: service.serviceId, stopId } })
        }}
      >
        <span className="flex-shrink-0 text-xs font-bold font-geist text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {service.routeCode}
        </span>
        <span className="text-xs text-on-surface truncate">
          {service.serviceMnemonic}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {prediction !== null ? (
          <button
            className={cn(
              'text-xs font-geist font-semibold px-2 py-0.5 rounded-md cursor-pointer select-none',
              prediction <= 60
                ? 'text-primary bg-primary/15'
                : 'text-on-surface-dim bg-surface-highest/60'
            )}
            onClick={(e) => {
              e.stopPropagation()
              setShowAbsolute((prev) => !prev)
            }}
          >
            {showAbsolute ? formatAbsolute(prediction) : formatPrediction(prediction)}
          </button>
        ) : (
          <span className="text-xs font-geist text-on-surface-dim/50 px-2 py-0.5">
            --
          </span>
        )}

        <button
          className="text-on-surface-dim/40 hover:text-primary transition-colors p-0.5"
          onClick={(e) => {
            e.stopPropagation()
            if (isServiceFavorite(service.serviceId)) {
              removeService(service.serviceId)
            } else {
              addService({
                serviceId: service.serviceId,
                serviceName: service.serviceMnemonic || service.routeCode,
                routeCode: service.routeCode,
              })
            }
          }}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={isServiceFavorite(service.serviceId) ? 'currentColor' : 'none'}
            strokeWidth={isServiceFavorite(service.serviceId) ? 0 : 1.5}
          />
        </button>

        {bestVehicle?.climatized && (
          <Snowflake className="w-3.5 h-3.5 text-on-surface-dim/50" />
        )}
        {bestVehicle?.wheelchair && (
          <Accessibility className="w-3.5 h-3.5 text-on-surface-dim/50" />
        )}

        {isRealTime && (
          <span className="flex items-center gap-0.5 text-primary-tint">
            <Wifi className="w-3.5 h-3.5 animate-wifi" />
          </span>
        )}
        {!isRealTime && isScheduled && (
          <Clock className="w-3.5 h-3.5 text-on-surface-dim/40" />
        )}
      </div>
    </div>
  )
}

export function StopCard({
  id,
  name,
  distance,
  walkMinutes,
  lat,
  lng,
  sheetHeightVh,
  lines,
  isFavorite = false,
  isClosest = false,
  isSelected = false,
  onToggleFavorite,
  onClick,
  dimmed = false,
  cardRef,
}: StopCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { getMap } = useMap()

  useEffect(() => {
    if (isSelected) setExpanded(true)
  }, [isSelected])

  const handleGoToStop = (e: React.MouseEvent) => {
    e.stopPropagation()
    const bottomPadding = Math.round((window.innerHeight * sheetHeightVh) / 100) + 24

    getMap()?.flyTo({
      center: [lng, lat],
      zoom: 18,
      padding: { top: 80, bottom: bottomPadding, left: 40, right: 40 },
      speed: 1.2,
    })
  }

  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: stopKeys.predictions(id),
    queryFn: () => getStopPredictions(id),
    enabled: expanded,
    staleTime: 30_000,
    refetchInterval: expanded ? 15_000 : false,
  })

  const services = predictions?.services ?? []

  const toggleExpand = () => {
    setExpanded((prev) => {
      if (!prev) refetch()
      return !prev
    })
  }

  const handleCardClick = () => {
    onClick?.()
    toggleExpand()
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleExpand()
  }

  const { services: favoriteServices } = useFavoritesStore()
  const favoriteServiceIds = new Set(favoriteServices.map((s) => s.serviceId))

  const { realTime, scheduled, others } = categorizePredictions(services, favoriteServiceIds)

  return (
    <div
      ref={cardRef}
      className={cn(
        'flex flex-col rounded-2xl transition-all duration-200',
        'bg-surface-high/40 hover:bg-surface-highest/60',
        isSelected && 'ring-1 ring-primary/40',
        dimmed && 'opacity-80'
      )}
    >
      <div
        className="flex justify-between items-start p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex gap-3 items-start">
          <div className={cn(
            'mt-1 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            isClosest ? 'bg-primary/15' : 'bg-surface-highest/60'
          )}>
              <BusIcon className={cn('w-5 h-5', isClosest ? 'text-primary' : 'text-on-surface-dim')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-1.5 text-on-surface-dim text-xs font-geist mt-1">
              <WalkIcon />
              <span>{distance}</span>
              <span className="w-1 h-1 rounded-full bg-on-surface-dim/30" />
              <span>{walkMinutes} min</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            className="text-on-surface-dim hover:text-primary transition-colors p-1"
            onClick={handleGoToStop}
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            className="text-on-surface-dim hover:text-primary transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.()
            }}
          >
            <Star
              className="w-4 h-4"
              fill={isFavorite ? 'currentColor' : 'none'}
              strokeWidth={isFavorite ? 0 : 1.5}
            />
          </button>
          <button
            className={cn(
              'p-1 transition-all duration-200',
              expanded
                ? 'text-primary rotate-180'
                : 'text-on-surface-dim/50 hover:text-on-surface-dim'
            )}
            onClick={handleToggleExpand}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {lines.length > 0 && !expanded && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {lines.map((line, i) => {
            const isHighlighted = i === 0
            return (
              <div
                key={`${line.name}-${i}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-geist font-medium',
                  isHighlighted
                    ? 'bg-primary/20 text-primary border-primary/20'
                    : 'bg-surface-highest text-on-surface-dim border-white/5'
                )}
              >
                <span className="font-bold">{line.name}</span>
                {line.arrivalMinutes !== null && (
                  <>
                    <span className="w-px h-3 bg-current opacity-30" />
                    <span>{line.arrivalMinutes <= 0 ? 'Chegando' : `${line.arrivalMinutes} min`}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.04]">
          <div className="flex items-center pt-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-geist font-semibold uppercase tracking-wider text-on-surface-dim">
                Previsões
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 px-1 pb-1 pt-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-surface-mid/40 border border-white/[0.03]">
                  <Skeleton className="h-5 w-12 rounded-md" />
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <div className="ml-auto flex items-center gap-1.5">
                    <Skeleton className="h-5 w-10 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-6 text-on-surface-dim text-xs">
              Nenhuma previsão disponível
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const favServices = services.filter((s) => favoriteServiceIds.has(s.serviceId))
                return favServices.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-1.5 px-1 text-[10px] font-geist font-semibold uppercase tracking-wide text-primary-tint">
                      <Star className="w-3 h-3" fill="currentColor" />
                      Favoritos
                    </span>
                    {favServices.map((service) => (
                      <ServiceBadge key={service.serviceId} service={service} stopId={id} stopName={name} />
                    ))}
                  </div>
                )
              })()}

              {realTime.filter((p) => !favoriteServiceIds.has(p.service.serviceId)).length > 0 && (
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 px-1 text-[10px] font-geist font-semibold uppercase tracking-wide text-primary-tint">
                    <Wifi className="w-3 h-3" />
                    Tempo real
                  </span>
                  {realTime.filter((p) => !favoriteServiceIds.has(p.service.serviceId)).map(({ service }) => (
                    <ServiceBadge key={service.serviceId} service={service} stopId={id} stopName={name} />
                  ))}
                </div>
              )}

              {scheduled.filter((p) => !favoriteServiceIds.has(p.service.serviceId)).length > 0 && (
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 px-1 text-[10px] font-geist font-semibold uppercase tracking-wide text-on-surface-dim">
                    <Clock className="w-3 h-3" />
                    Programado
                  </span>
                  {scheduled.filter((p) => !favoriteServiceIds.has(p.service.serviceId)).map(({ service }) => (
                    <ServiceBadge key={service.serviceId} service={service} stopId={id} stopName={name} />
                  ))}
                </div>
              )}

              {others.length > 0 && (
                <div className="space-y-1.5">
                  <span className="px-1 text-[10px] font-geist font-semibold uppercase tracking-wide text-on-surface-dim/60">
                    Outros
                  </span>
                  {others.map(({ service }) => (
                    <ServiceBadge key={service.serviceId} service={service} stopId={id} stopName={name} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
