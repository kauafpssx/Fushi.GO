import { useParams } from 'react-router-dom'

export function StopPage() {
  const { stopId } = useParams<{ stopId: string }>()

  return (
    <div className="flex h-full flex-col p-4">
      <h1 className="text-xl font-bold">Parada</h1>
      <p className="text-sm text-muted-foreground">{stopId}</p>
    </div>
  )
}
