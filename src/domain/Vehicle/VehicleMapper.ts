import type { Vehicle, VehicleType } from './Vehicle'
import { getVehicleStatus, VehicleStatus } from './VehicleStatus'

export interface VehicleDTO {
  id: string
  prefix: string
  lat: number
  lng: number
  bearing: number
  type: VehicleType
  status: VehicleStatus
  realtimeServiceId: string | null
  lastUpdate: number
  averageSpeed: number
  prediction: number
  predictionToTripEnd: number
  distanceToNextStop: number
  wheelchair: boolean
  climatized: boolean
}

export function vehicleMapper(raw: Vehicle): VehicleDTO {
  return {
    id: raw.id,
    prefix: raw.prefix,
    lat: raw.lat,
    lng: raw.lng,
    bearing: raw.bearing,
    type: raw.type,
    status: getVehicleStatus(raw.type),
    realtimeServiceId: raw.realtimeServiceId,
    lastUpdate: raw.lastUpdate,
    averageSpeed: raw.averageSpeed,
    prediction: raw.prediction,
    predictionToTripEnd: raw.predictionToTripEnd,
    distanceToNextStop: raw.distanceToNextStop,
    wheelchair: raw.wheelchair,
    climatized: raw.climatized,
  }
}
