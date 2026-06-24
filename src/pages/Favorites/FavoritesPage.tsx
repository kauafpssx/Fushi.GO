import { useNavigate } from 'react-router-dom'
import { useFavoritesStore } from '../../app/store'
import { Header } from '../../components/Header/Header'
import { Card } from '../../components/Card/Card'
import { Star } from 'lucide-react'
import { slugify } from '../../shared/utils/slugify'

export function FavoritesPage() {
  const { stops, services } = useFavoritesStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <Header title="Favoritos" />

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
        {stops.length === 0 && services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="h-12 w-12 text-outline/40 mb-4" />
            <p className="text-sm text-on-surface mb-1">Nenhum favorito ainda</p>
            <p className="text-xs text-outline">Toque na estrela para favoritar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {services.length > 0 && (
              <section>
                <h2 className="font-geist text-xs font-semibold tracking-wide text-outline uppercase mb-3">
                  Linhas
                </h2>
                <div className="space-y-2">
                  {services.map((service) => (
                    <Card
                      key={service.serviceId}
                      variant="glass"
                      className="p-4"
                      onClick={() => navigate(`/vehicle/${service.routeCode}/${slugify(service.serviceName)}`, { state: { serviceId: service.serviceId } })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-container rounded-lg px-3 py-1.5">
                          <span className="font-geist text-sm font-semibold text-on-primary">
                            {service.routeCode}
                          </span>
                        </div>
                        <span className="text-sm text-on-surface">{service.serviceName}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {stops.length > 0 && (
              <section>
                <h2 className="font-geist text-xs font-semibold tracking-wide text-outline uppercase mb-3">
                  Paradas
                </h2>
                <div className="space-y-2">
                  {stops.map((stop) => (
                    <Card key={stop.stopId} variant="glass" className="p-4">
                      <p className="text-sm font-medium text-on-surface">{stop.stopName}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
