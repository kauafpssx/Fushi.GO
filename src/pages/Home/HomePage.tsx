import { useMemo } from 'react'
import { MapView } from '../../features/map/components/MapView'
import { StopsBottomSheet, type StopItem } from '../../components/StopsBottomSheet/StopsBottomSheet'
import { LocateButton } from '../../components/LocateButton/LocateButton'
import { useMapStore } from '../../features/map/store/mapStore'
import { useFavoritesStore } from '../../app/store'

export function HomePage() {
  const { requestFlyTo, selectStop, stops, userLocation } = useMapStore()
  const { addStop, removeStop, isStopFavorite, stops: favoriteStops } = useFavoritesStore()

  const stopItems: StopItem[] = useMemo(() => {
    return stops.map((stop) => {
      let distance = ''
      let walkMinutes = 0

      if (userLocation) {
        const R = 6371000
        const dLat = ((stop.location.lat - userLocation.lat) * Math.PI) / 180
        const dLng = ((stop.location.lng - userLocation.lng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((userLocation.lat * Math.PI) / 180) *
            Math.cos((stop.location.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`
        walkMinutes = Math.max(1, Math.round(dist / 80))
      }

      return {
        id: stop.id,
        name: stop.mnemonic,
        distance: distance || '?',
        walkMinutes,
        lines: [],
        isFavorite: isStopFavorite(stop.id),
        lat: stop.location.lat,
        lng: stop.location.lng,
      }
    })
  }, [stops, userLocation, favoriteStops, isStopFavorite])

  const handleToggleFavorite = (id: string) => {
    if (isStopFavorite(id)) {
      removeStop(id)
    } else {
      const stop = stops.find(s => s.id === id)
      if (stop) {
        addStop({
          stopId: id,
          stopName: stop.mnemonic,
          lat: stop.location.lat,
          lng: stop.location.lng,
        })
      }
    }
  }

  const handleCenter = () => {
    if (userLocation) {
      requestFlyTo(userLocation.lat, userLocation.lng)
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          requestFlyTo(pos.coords.latitude, pos.coords.longitude)
        },
        () => {
          requestFlyTo(-51.2, -30.0)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapView />

      <div className="absolute right-4 top-16 z-30">
        <LocateButton onClick={handleCenter} />
      </div>

      <StopsBottomSheet
        stops={stopItems}
        onSelectStop={(id) => selectStop(id)}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  )
}
