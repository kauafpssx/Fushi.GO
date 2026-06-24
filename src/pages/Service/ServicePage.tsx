import { useParams } from 'react-router-dom'
import { useServiceDetails } from '../../features/services/hooks/useServiceDetails'
import { Skeleton } from '../../components/Skeleton/Skeleton'

export function ServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data, isLoading } = useServiceDetails(serviceId!)

  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-4 space-y-3">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded-lg" />
      </div>
    )
  }
  if (!data) return <div className="p-4">Serviço não encontrado</div>

  return (
    <div className="flex h-full flex-col p-4">
      <h1 className="text-xl font-bold">{data.serviceMnemonic}</h1>
      <p className="text-sm text-muted-foreground">{data.routeCode}</p>
    </div>
  )
}
