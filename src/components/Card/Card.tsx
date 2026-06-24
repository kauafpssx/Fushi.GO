import type { ReactNode } from 'react'
import { cn } from '../../shared/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'glass' | 'primary'
}

export function Card({ children, className, onClick, variant = 'default' }: CardProps) {
  const base = cn(
    'rounded-xl transition-all duration-200',
    onClick && 'cursor-pointer active:scale-[0.98]',
    {
      'glass shadow-glass': variant === 'glass',
      'bg-primary-container/15 border border-primary-tint/20': variant === 'primary',
      'bg-surface-high/60 border border-outline-variant/30': variant === 'default',
    },
    className
  )

  return (
    <div
      className={base}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}
