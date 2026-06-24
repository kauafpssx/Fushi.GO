export interface Service {
  id: string
  name: string
  serviceMnemonic: string
  routeCode: string
  routeMnemonic: string
}

export interface RouteService {
  id: string
  serviceMnemonic: string
  tags: string[]
}
