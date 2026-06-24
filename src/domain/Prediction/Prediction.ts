export interface Prediction {
  stopId: string
  stopName: string
  arrivals: Arrival[]
}

export interface Arrival {
  serviceId: string
  serviceName: string
  arrivalTime: number
  arrivalSeconds: number
}
