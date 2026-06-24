import { Crosshair } from 'lucide-react'
import { cn } from '../../shared/lib/cn'

interface LocateButtonProps {
  onClick?: () => void
  className?: string
}

export function LocateButton({ onClick, className }: LocateButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 active:scale-95',
        'bg-primary text-on-primary shadow-glow-primary',
        className
      )}
    >
      <Crosshair className="h-5 w-5" />
    </button>
  )
}
