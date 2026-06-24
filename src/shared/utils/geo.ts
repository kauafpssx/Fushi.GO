interface LatLngPoint {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6371000

export function haversineDistanceMeters(a: LatLngPoint, b: LatLngPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

const NEAREST_STOP_MAX_DISTANCE_METERS = 400

export function findNearestStopIndex<T extends { location: LatLngPoint }>(
  position: LatLngPoint,
  stops: T[]
): number {
  if (stops.length === 0) return 0

  const closest = stops.reduce(
    (closestIdx, stop, idx) => {
      const dist = haversineDistanceMeters(position, stop.location)
      return dist < closestIdx.dist ? { idx, dist } : closestIdx
    },
    { idx: 0, dist: Infinity }
  )

  return closest.dist <= NEAREST_STOP_MAX_DISTANCE_METERS ? closest.idx : 0
}
