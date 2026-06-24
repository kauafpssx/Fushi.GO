export interface Vehicle {
  tripNumber: number
  firstSeen: number
  transitStopId: string | null
  transitServiceStopSequence: number
  stopSequence: number
  oldLatitude: number
  oldLongitude: number
  graphEdgePercentage: number
  distanceToNextStop: number
  distanceFromFirstPoint: number
  distanceFromPreviousStop: number
  distanceMovedLastUpdate: number
  transitAgencyId: string | null
  transitServiceId: string | null
  transitTimetableEntryId: string | null
  realtimeServiceId: string | null
  predictionSeconds: number
  predictionToTripEnd: number
  plate: string
  prefix: string
  ts: number
  lat: number
  lng: number
  bearing: number
  wheelchair: boolean
  climatized: boolean
  prediction: number
  age: number
  type: VehicleType
  lastUpdate: number
  averageSpeed: number
  cars: unknown[] | null
  tags: string[]
  id: string
}

export type VehicleType = 'MESSAGE' | 'SCHEDULE' | null
