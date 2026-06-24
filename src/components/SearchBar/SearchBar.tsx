import { useSearchStore } from '../../features/search/store/searchStore'
import { useSearch } from '../../features/search/hooks/useSearch'
import { Search } from 'lucide-react'
import { cn } from '../../shared/lib/cn'

export function SearchBar() {
  const { query, setQuery, isOpen } = useSearchStore()
  const { data } = useSearch(query)

  if (!isOpen) return null

  return (
    <div className="absolute top-4 left-5 right-5 z-50">
      <div className="glass-strong rounded-full shadow-glass flex items-center gap-3 px-4 py-3">
        <Search className="h-5 w-5 text-outline flex-shrink-0" />
        <input
          className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline outline-none"
          placeholder="Buscar linha ou parada..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query.length > 0 && (
          <button
            className="text-outline text-xs font-medium"
            onClick={() => setQuery('')}
          >
            Limpar
          </button>
        )}
      </div>

      {data && data.length > 0 && (
        <ul className="mt-2 rounded-2xl glass-strong overflow-hidden">
          {data.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer',
                'text-on-surface hover:bg-surface-high/50',
                i < data.length - 1 && 'border-b border-outline-variant/30'
              )}
            >
              <span className="font-geist text-xs font-medium text-primary-tint bg-primary-container/20 px-2 py-0.5 rounded-full">
                {item.type === 'service' ? 'Linha' : 'Parada'}
              </span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
