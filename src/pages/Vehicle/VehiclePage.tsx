import { useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useServiceDetails } from '../../features/services/hooks/useServiceDetails'
import { useVehicles } from '../../features/vehicles/hooks/useVehicles'
import { useActiveVehicle } from '../../features/vehicles/hooks/useActiveVehicle'
import { useServiceStopPrediction } from '../../features/services/hooks/useServiceStopPrediction'
import { VehicleBottomSheet } from './VehicleBottomSheet'
import { VehicleRouteMap, type VehicleRouteMapHandle } from './VehicleRouteMap'
import { BottomNav } from '../../components/BottomNav/BottomNav'

export function VehiclePage() {
  useParams<{ routeCode: string; serviceSlug: string; stopSlug: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { serviceId?: string; stopId?: string } | null
  const serviceId = state?.serviceId ?? ''
  const selectedStopId = state?.stopId ?? undefined

  const { data: service } = useServiceDetails(serviceId)
  const { data: vehicles = [] } = useVehicles(serviceId)
  const { vehicle: activeVehicle, isLive } = useActiveVehicle(serviceId, vehicles, selectedStopId)
  const { upcoming } = useServiceStopPrediction(serviceId, selectedStopId)

  const messagePrefixes = selectedStopId
    ? upcoming.filter((v) => v.type !== 'SCHEDULE' && v.prefix).map((v) => v.prefix as string)
    : undefined
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const mapHandleRef = useRef<VehicleRouteMapHandle>(null)

  if (!serviceId) {
    return (
      <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-surface">
        <span className="text-sm text-on-surface-dim">Acesse pelo app</span>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <VehicleRouteMap
        ref={mapHandleRef}
        serviceId={serviceId}
        selectedStopId={selectedStopId}
        vehicle={activeVehicle}
        vehicles={vehicles}
        service={service}
        messagePrefixes={messagePrefixes}
        sheetHeightVh={sheetExpanded ? 85 : 55}
      />

      <header className="absolute top-0 z-50 flex w-full items-center justify-between px-5 pt-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full glass-strong text-primary transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <VehicleBottomSheet
        serviceId={serviceId}
        vehicle={activeVehicle}
        vehicles={vehicles}
        isLive={isLive}
        service={service}
        selectedStopId={selectedStopId}
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        onCenterStop={(lat, lng) => mapHandleRef.current?.flyToStop(lat, lng)}
        onCenterVehicle={(lat, lng) => mapHandleRef.current?.flyToVehicle(lat, lng)}
        onFitBusAndStop={(busLat, busLng, stopLat, stopLng) => mapHandleRef.current?.fitBusAndStop(busLat, busLng, stopLat, stopLng)}
        onFitRoute={() => mapHandleRef.current?.flyToRoute()}
      />
      <BottomNav />
    </div>
  )
}
