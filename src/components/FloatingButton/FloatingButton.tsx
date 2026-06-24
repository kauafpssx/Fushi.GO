import type { ReactNode } from 'react'
import { cn } from '../../shared/lib/cn'

interface FloatingButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'glass'
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
}

export function FloatingButton({
  children,
  onClick,
  className,
  size = 'md',
  variant = 'glass',
}: FloatingButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'active:scale-95',
        sizes[size],
        {
          'glass shadow-glass border border-outline-variant/30': variant === 'glass',
          'bg-primary text-on-primary shadow-glow-primary': variant === 'primary',
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
