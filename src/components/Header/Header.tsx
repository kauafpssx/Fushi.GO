import type { ReactNode } from 'react'
import { useAuthStore } from '../../app/store'

interface HeaderProps {
  title?: string
  right?: ReactNode
}

export function Header({ title, right }: HeaderProps) {
  const { isAuthenticated } = useAuthStore()

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-14 items-center justify-between px-5">
      <h1 className="text-base font-semibold tracking-tight text-on-surface">
        {title ?? 'FushiGO'}
      </h1>

      {right && <div className="flex items-center gap-2">{right}</div>}

      {!isAuthenticated && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-tint animate-pulse-live" />
          <span className="font-geist text-xs tracking-wide text-outline">Conectando...</span>
        </div>
      )}
    </header>
  )
}
