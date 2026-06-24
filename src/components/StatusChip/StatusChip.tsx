import { cn } from '../../shared/lib/cn'

interface StatusChipProps {
  status: 'live' | 'on-time' | 'delayed' | 'cancelled' | 'offline'
  label?: string
  className?: string
}

const statusStyles = {
  'live': 'bg-primary-tint/20 text-primary-tint border-primary-tint/30',
  'on-time': 'bg-primary-tint/15 text-primary-tint border-primary-tint/20',
  'delayed': 'bg-error/15 text-error border-error/20',
  'cancelled': 'bg-outline/15 text-outline border-outline-variant/20',
  'offline': 'bg-surface-highest/40 text-outline border-outline-variant/20',
}

const defaultLabels: Record<StatusChipProps['status'], string> = {
  'live': 'AO VIVO',
  'on-time': 'No horário',
  'delayed': 'Atrasado',
  'cancelled': 'Cancelado',
  'offline': 'Offline',
}

export function StatusChip({ status, label, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'font-geist text-[10px] font-semibold tracking-wide',
        statusStyles[status],
        className
      )}
    >
      {status === 'live' && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary-tint animate-pulse-live" />
      )}
      {label ?? defaultLabels[status]}
    </span>
  )
}
