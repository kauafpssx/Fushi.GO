import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Map, Star } from 'lucide-react'
import { cn } from '../../shared/lib/cn'

interface Tab {
  id: string
  label: string
  icon: React.ElementType
  path: string
  disabled?: boolean
}

const tabs: Tab[] = [
  { id: 'search', label: 'Buscar', icon: Search, path: '/search', disabled: true },
  { id: 'map', label: 'Mapa', icon: Map, path: '/' },
  { id: 'favorites', label: 'Favoritos', icon: Star, path: '/favorites', disabled: true },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass rounded-t-xl border-t border-white/10 px-4 pb-6 pt-2 shadow-elevated">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path

            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                className={cn(
                  'flex flex-col items-center justify-center rounded-full px-4 py-1.5 transition-all active:scale-90',
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-secondary-container hover:bg-secondary-container/50',
                  tab.disabled && 'opacity-40 pointer-events-none'
                )}
                onClick={() => navigate(tab.path)}
              >
                <tab.icon
                  className="h-5 w-5"
                  strokeWidth={isActive ? 2.2 : 1.5}
                  fill={isActive && tab.id === 'favorites' ? 'currentColor' : 'none'}
                />
                <span className="font-geist text-[10px] font-semibold uppercase mt-0.5 tracking-wide">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
