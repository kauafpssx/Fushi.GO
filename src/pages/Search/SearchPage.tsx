import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { useSearch } from '../../features/search/hooks/useSearch'
import { Header } from '../../components/Header/Header'
import { Card } from '../../components/Card/Card'
import { StatusChip } from '../../components/StatusChip/StatusChip'
import { Skeleton } from '../../components/Skeleton/Skeleton'

export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data, isLoading } = useSearch(query)

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Buscar"
        right={
          <button onClick={() => navigate(-1)} className="text-on-surface">
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-5 pt-4 pb-3">
        <div className="glass-strong rounded-full flex items-center gap-3 px-4 py-3 shadow-glass">
          <Search className="h-5 w-5 text-outline flex-shrink-0" />
          <input
            className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
            placeholder="Nome da linha ou parada..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {isLoading && query.length >= 3 && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-high/30 border border-white/[0.03]">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-12 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.length === 0 && query.length >= 3 && (
          <p className="text-center text-sm text-outline py-8">Nenhum resultado encontrado</p>
        )}

        {data && data.length > 0 && (
          <div className="space-y-2">
            {data.map((item) => (
              <Card
                key={item.id}
                variant="glass"
                onClick={() => {
                  if (item.type === 'service') {
                    navigate(`/service/${item.id}`)
                  } else {
                    navigate(`/stop/${item.id}`)
                  }
                }}
                className="p-4"
              >
                <div className="flex items-center gap-3">
                  <StatusChip status={item.type === 'service' ? 'on-time' : 'offline'} />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{item.name}</p>
                    <p className="font-geist text-xs text-outline mt-0.5">
                      {item.type === 'service' ? 'Linha' : 'Parada'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-outline/40 mb-4" />
            <p className="text-sm text-outline">Busque por linhas ou paradas</p>
          </div>
        )}
      </div>
    </div>
  )
}
