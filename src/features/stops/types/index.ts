export interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  sequence?: number
}

export interface Arrival {
  serviceId: string
  serviceName: string
  arrivalTime: number
  arrivalSeconds: number
}

export interface StopService {
  serviceId: string
  routeCode: string
  routeMnemonic: string
  serviceMnemonic: string
  predictionType: string | null
  vehicles: StopVehicle[]
  hasRealTime: boolean
  activeVehicles: number
  scheduledVehicles: number
  totalTravelTimeUntilStopSeconds: number
  estimatedInterval: number | null
  modal: number
}

export interface StopVehicle {
  prediction: number
  predictionSeconds: number
  type: string | null
  prefix: string | null
  plate: string | null
  wheelchair: boolean
  climatized: boolean
}
