import { useState } from 'react'
import { Clock, Gauge, MapPin } from 'lucide-react'
import { formatDistance, formatSecondsToMinutes, formatTimestamp } from '../../shared/utils'

interface VehicleStatsProps {
  vehicle: Record<string, unknown>
  distanceToStopMeters?: number
  etaSeconds?: number
  isLive?: boolean
  onClickSpeed?: () => void
  onClickDistance?: () => void
  onClickArrival?: () => void
}

export function VehicleStats({ vehicle, distanceToStopMeters, etaSeconds, isLive = true, onClickSpeed, onClickDistance, onClickArrival }: VehicleStatsProps) {
  const [showAbsolute, setShowAbsolute] = useState(false)
  const rawSpeed = isLive ? (vehicle.averageSpeed as number | undefined) : undefined
  const speed = rawSpeed != null ? Math.round(rawSpeed * 3.6) : null
  const distanceToNextStop = isLive ? (vehicle.distanceToNextStop as number | undefined) : undefined
  const distanceLabel =
    distanceToStopMeters != null
      ? formatDistance(distanceToStopMeters)
      : distanceToNextStop != null
        ? formatDistance(distanceToNextStop)
        : null

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={onClickSpeed}
        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-surface-high/50 p-4 transition-transform active:scale-95"
      >
        <Gauge className="mb-1 text-primary" size={20} />
        <span className="font-geist text-[10px] font-semibold uppercase tracking-wide text-secondary">
          Velocidade
        </span>
        <span className="text-xl font-bold text-on-surface">
          {speed != null ? (
            <>
              {speed} <span className="text-xs font-normal text-on-surface-dim">km/h</span>
            </>
          ) : (
            <span className="text-xs text-on-surface-dim">--</span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onClickDistance}
        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-surface-high/50 p-4 transition-transform active:scale-95"
      >
        <MapPin className="mb-1 text-primary" size={20} />
        <span className="font-geist text-[10px] font-semibold uppercase tracking-wide text-secondary">
          Distância
        </span>
        <span className="text-xl font-bold text-on-surface">
          {distanceLabel ?? <span className="text-xs text-on-surface-dim">--</span>}
        </span>
      </button>

      <button
        type="button"
        onClick={onClickArrival}
        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-primary/20 bg-primary-container p-4 transition-transform active:scale-95"
      >
        <Clock className="mb-1 text-on-primary-container" size={20} />
        <span className="font-geist text-[10px] font-semibold uppercase tracking-wide text-on-primary-container/70">
          Chegada
        </span>
        <span
          className="text-xl font-bold text-on-primary-container cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation()
            setShowAbsolute((prev) => !prev)
          }}
        >
          {etaSeconds != null
            ? showAbsolute
              ? formatTimestamp(Date.now() + etaSeconds * 1000)
              : formatSecondsToMinutes(etaSeconds)
            : <span className="text-xs">--</span>
          }
        </span>
      </button>
    </div>
  )
}
