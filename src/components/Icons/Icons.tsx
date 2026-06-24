import { cn } from '../../shared/lib/cn'
import { BUS_PATH, WALK_PATH } from '../../shared/utils/svgPaths'

interface IconProps {
  className?: string
}

export function BusIcon({ className }: IconProps) {
  return (
    <svg className={cn('w-5 h-5', className)} viewBox="0 0 24 24" fill="currentColor">
      <path d={BUS_PATH} />
    </svg>
  )
}

export function WalkIcon({ className }: IconProps) {
  return (
    <svg className={cn('w-3.5 h-3.5', className)} viewBox="0 0 24 24" fill="currentColor">
      <path d={WALK_PATH} />
    </svg>
  )
}
