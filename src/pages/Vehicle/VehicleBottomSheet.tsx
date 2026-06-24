import { useRef, useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Snowflake, Accessibility, MapPin, Wifi, Clock, ArrowRight, Star } from 'lucide-react'
import { api } from '../../shared/api/http'
import { V1_BASE } from '../../shared/constants'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { haversineDistanceMeters, formatSecondsToMinutes, formatTimestamp } from '../../shared/utils'
import { useServiceStopPrediction } from '../../features/services/hooks/useServiceStopPrediction'
import { useFavoritesStore } from '../../features/favorites/store/favoritesStore'
import { getDepartures } from '../../features/services/api/getDepartures'
import { VehicleStats } from './VehicleStats'
import { StopTimeline } from './StopTimeline'
import { DayPicker } from '../../components/DayPicker/DayPicker'
import { cn } from '../../shared/lib/cn'
import type { VehicleDTO } from '../../domain/Vehicle/VehicleMapper'
import type { ServiceDetails } from '../../features/services/types'

interface ServiceStop {
  id: string
  mnemonic: string
  location: { lat: number; lng: number }
}

interface ServiceStopsResponse {
  polyline: string
  stops: ServiceStop[]
}

function getServiceStops(serviceId: string) {
  return api.get<ServiceStopsResponse>(`${V1_BASE}/stops/service/${serviceId}`)
}

interface VehicleBottomSheetProps {
  serviceId: string
  vehicle: VehicleDTO | undefined
  vehicles: VehicleDTO[]
  isLive: boolean
  service: ServiceDetails | undefined
  selectedStopId?: string
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onCenterStop: (lat: number, lng: number) => void
  onCenterVehicle: (lat: number, lng: number) => void
  onFitBusAndStop: (busLat: number, busLng: number, stopLat: number, stopLng: number) => void
  onFitRoute: () => void
}

export function VehicleBottomSheet({
  serviceId,
  vehicle,
  vehicles,
  isLive,
  service,
  selectedStopId,
  expanded,
  onExpandedChange,
  onCenterStop,
  onCenterVehicle,
  onFitBusAndStop,
  onFitRoute,
}: VehicleBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [absoluteTimes, setAbsoluteTimes] = useState<Set<number>>(new Set())
  const { isServiceFavorite, addService, removeService } = useFavoritesStore()

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const currentHour = now.getHours().toString().padStart(2, '0')
  const currentMinute = (Math.ceil(now.getMinutes() / 5) * 5).toString().padStart(2, '0')
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedTime, setSelectedTime] = useState(`${currentHour}:${currentMinute}`)

  const { data: departures = [], isLoading: departuresLoading } = useQuery({
    queryKey: ['departures', serviceId, selectedDate],
    queryFn: () => getDepartures(serviceId, selectedDate),
    enabled: !!serviceId,
  })

  const { data: stopsResponse } = useQuery({
    queryKey: ['stops-service', serviceId],
    queryFn: () => getServiceStops(serviceId),
    enabled: !!serviceId,
  })

  const stops = stopsResponse?.stops ?? []
  const selectedStop = selectedStopId ? stops.find((stop) => stop.id === selectedStopId) : undefined

  const { etaSeconds: bestEtaSeconds, upcoming } = useServiceStopPrediction(serviceId, selectedStopId)

  useEffect(() => {
    setSelectedIdx(0)
  }, [selectedStopId])

  const selectedPrediction = upcoming[selectedIdx] ?? upcoming[0] ?? null

  // first card always matches the live-tracked `vehicle`; others need a prefix lookup
  const selectedLiveVehicle =
    (selectedIdx === 0
      ? vehicle
      : vehicles.find((v) => v.prefix && v.prefix === selectedPrediction?.prefix)) ?? vehicle

  const selectedIsLive = selectedIdx === 0
    ? isLive
    : selectedPrediction != null
      ? selectedPrediction.type !== 'SCHEDULE'
      : false

  const distanceToSelectedStopMeters =
    selectedLiveVehicle && selectedStop && selectedIsLive
      ? haversineDistanceMeters(selectedLiveVehicle, selectedStop.location)
      : undefined

  const etaSeconds = selectedPrediction?.prediction ?? bestEtaSeconds

  const climatized = selectedPrediction?.climatized ?? selectedLiveVehicle?.climatized ?? false
  const wheelchair = selectedPrediction?.wheelchair ?? selectedLiveVehicle?.wheelchair ?? false
  const rawPrefix = selectedPrediction?.prefix ?? selectedLiveVehicle?.prefix ?? '--'
  const displayPrefix = rawPrefix !== '--' ? `#${rawPrefix}` : rawPrefix

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = startY.current - e.changedTouches[0].clientY
    if (delta > 50) onExpandedChange(true)
    else if (delta < -50) onExpandedChange(false)
  }, [onExpandedChange])

  if (!vehicle && !service) {
    return (
      <section className="fixed inset-x-0 bottom-0 z-50 h-[55vh]">
        <div className="glass-strong flex h-full flex-col overflow-hidden rounded-t-[32px] shadow-elevated">
          <div className="flex justify-center py-4">
            <div className="handle-bar" />
          </div>
          <div className="flex-shrink-0 px-5">
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-[10px] w-16 rounded" />
            <Skeleton className="mt-2 h-[88px] rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  const vehicleData = (selectedLiveVehicle ?? {}) as unknown as Record<string, unknown>

  return (
    <section
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out',
        expanded ? 'h-[85vh]' : 'h-[55vh]'
      )}
    >
      <div
        ref={sheetRef}
        className="glass-strong flex h-full flex-col overflow-hidden rounded-t-[32px] shadow-elevated"
      >
        <div
          className="flex cursor-grab justify-center py-4 active:cursor-grabbing flex-shrink-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="handle-bar" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <VehicleStats
            vehicle={vehicleData}
            distanceToStopMeters={distanceToSelectedStopMeters}
            etaSeconds={etaSeconds ?? undefined}
            isLive={selectedIsLive}
            onClickSpeed={() => {
              if (selectedLiveVehicle && selectedStop) {
                onFitBusAndStop(selectedLiveVehicle.lat, selectedLiveVehicle.lng, selectedStop.location.lat, selectedStop.location.lng)
              } else if (selectedLiveVehicle) {
                onCenterVehicle(selectedLiveVehicle.lat, selectedLiveVehicle.lng)
              }
            }}
            onClickDistance={() => {
              if (selectedLiveVehicle) {
                onCenterVehicle(selectedLiveVehicle.lat, selectedLiveVehicle.lng)
              }
            }}
            onClickArrival={() => {
              if (selectedLiveVehicle && selectedStop) {
                onFitBusAndStop(selectedLiveVehicle.lat, selectedLiveVehicle.lng, selectedStop.location.lat, selectedStop.location.lng)
              } else if (selectedLiveVehicle) {
                onCenterVehicle(selectedLiveVehicle.lat, selectedLiveVehicle.lng)
              }
            }}
          />

          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-geist text-[10px] font-semibold uppercase tracking-wide text-on-surface-dim">
              Linha
            </span>
          </div>

          <div className="relative mb-6 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/5 bg-surface-low p-5">
            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/10 to-transparent" />
            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-primary">
                  {service?.routeCode ?? displayPrefix}
                </span>
                {climatized && <Snowflake size={14} className="flex-shrink-0 text-on-surface-dim" />}
                {wheelchair && <Accessibility size={14} className="flex-shrink-0 text-on-surface-dim" />}
              </div>
              {service && (
                <p className="mt-0.5 truncate text-sm text-on-surface-dim">{service.serviceMnemonic}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-on-surface-dim">
                <MapPin size={14} />
                <span className="truncate text-xs">
                  {selectedStop ? selectedStop.mnemonic.split(',')[0] : `Ônibus ${displayPrefix}`}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
              {service && (
                <button
                  type="button"
                  onClick={() => {
                    if (isServiceFavorite(service.id)) {
                      removeService(service.id)
                    } else {
                      addService({
                        serviceId: service.id,
                        serviceName: service.serviceMnemonic,
                        routeCode: service.routeCode,
                      })
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-dim hover:text-primary transition-colors active:scale-90"
                >
                  <Star
                    size={20}
                    fill={isServiceFavorite(service.id) ? 'currentColor' : 'none'}
                    strokeWidth={isServiceFavorite(service.id) ? 0 : 1.5}
                    className={isServiceFavorite(service.id) ? 'text-primary' : ''}
                  />
                </button>
              )}
              {selectedStop && (
                <button
                  type="button"
                  onClick={() => onCenterStop(selectedStop.location.lat, selectedStop.location.lng)}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg transition-transform active:scale-90"
                >
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>

          {selectedStop && (
            <div className="mb-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-geist text-[10px] font-semibold uppercase tracking-wide text-on-surface-dim">
                  Próximos
                </span>
              </div>

              {upcoming.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-surface-low p-4 text-center text-xs text-on-surface-dim">
                  Nenhuma previsão disponível
                </div>
              ) : (
                <div
                  className="flex snap-x gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {upcoming.map((v, idx) => {
                    const isRealTimeVehicle = v.type !== 'SCHEDULE'
                    const isSelectedCard = idx === selectedIdx
                    const matchingVehicle = idx === 0
                      ? vehicle
                      : vehicles.find((veh) => veh.prefix && veh.prefix === v.prefix) ?? vehicle
                    return (
                      <button
                        key={`${v.prefix ?? 'scheduled'}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedIdx(idx)
                          if (isRealTimeVehicle && matchingVehicle) {
                            onCenterVehicle(matchingVehicle.lat, matchingVehicle.lng)
                          } else {
                            onFitRoute()
                          }
                        }}
                        className={cn(
                          'flex w-28 flex-shrink-0 snap-start flex-col gap-2 rounded-2xl border p-3 text-left transition-transform active:scale-95',
                          isSelectedCard
                            ? 'border-primary/30 bg-primary-container'
                            : 'border-white/5 bg-surface-low'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'font-geist text-sm font-bold cursor-pointer select-none',
                              isSelectedCard ? 'text-on-primary-container' : 'text-on-surface'
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAbsoluteTimes((prev) => {
                                const next = new Set(prev)
                                if (next.has(idx)) next.delete(idx)
                                else next.add(idx)
                                return next
                              })
                            }}
                          >
                            {absoluteTimes.has(idx)
                              ? formatTimestamp(Date.now() + v.prediction * 1000)
                              : formatSecondsToMinutes(v.prediction)
                            }
                          </span>
                          {isRealTimeVehicle ? (
                            <Wifi
                              size={14}
                              className={isSelectedCard ? 'text-on-primary-container animate-wifi' : 'text-primary-tint animate-wifi'}
                            />
                          ) : (
                            <Clock size={14} className="text-on-surface-dim/50" />
                          )}
                        </div>

                        <span
                          className={cn(
                            'font-geist text-xs font-semibold',
                            isSelectedCard ? 'text-on-primary-container' : 'text-on-surface-dim'
                          )}
                        >
                          {isRealTimeVehicle ? (v.prefix ? `#${v.prefix}` : '--') : 'Programado'}
                        </span>

                        {(v.climatized || v.wheelchair) && (
                          <div className="flex items-center gap-1">
                            {v.climatized && (
                              <Snowflake
                                size={12}
                                className={isSelectedCard ? 'text-on-primary-container/70' : 'text-on-surface-dim/50'}
                              />
                            )}
                            {v.wheelchair && (
                              <Accessibility
                                size={12}
                                className={isSelectedCard ? 'text-on-primary-container/70' : 'text-on-surface-dim/50'}
                              />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        {service && (
          <>
            <div className="border-t border-white/[0.04] pb-2 pt-3">
              <span className="font-geist text-[11px] font-semibold uppercase tracking-wider text-on-surface-dim">
                Horários
              </span>
            </div>
            <div className="pb-3">
              <DayPicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                className="mb-3"
              />

              {departuresLoading ? (
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
                  ))}
                </div>
              ) : departures.length > 0 && (
                <div
                  className="flex snap-x gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {departures.map((dep, i) => {
                    const d = new Date(dep.departureTimestamp)
                    const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
                    const isPast = dep.departureTimestamp < Date.now()
                    const isSelected = label === selectedTime
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedTime(label)}
                        className={cn(
                          'flex-shrink-0 snap-start px-3 py-1.5 rounded-lg font-geist text-xs font-semibold border transition-all active:scale-95',
                          isSelected
                            ? 'bg-primary text-on-primary border-primary'
                            : isPast
                              ? 'bg-surface-high/30 text-on-surface-dim/40 border-white/5'
                              : 'bg-primary/10 text-primary border-primary/20'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {service && (
          <>
            <div className="border-t border-white/[0.04] pb-2 pt-3">
              <span className="font-geist text-[11px] font-semibold uppercase tracking-wider text-on-surface-dim">
                Paradas
              </span>
            </div>
            <div className="pb-8">
              <StopTimeline
                serviceId={serviceId}
                averageSpeed={selectedLiveVehicle?.averageSpeed ?? 0}
                selectedStopId={selectedStopId}
                isLive={selectedIsLive}
                vehiclePosition={
                  selectedIsLive && selectedLiveVehicle
                    ? { lat: selectedLiveVehicle.lat, lng: selectedLiveVehicle.lng }
                    : undefined
                }
                onCenterStop={onCenterStop}
              />
            </div>
          </>
        )}
        </div>
      </div>
    </section>
  )
}
