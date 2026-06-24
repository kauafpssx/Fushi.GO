import { format } from 'date-fns'

export function formatTimestamp(ts: number): string {
  return format(new Date(ts), "HH:mm")
}

export function formatSecondsToMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  if (mins < 1) return 'Chegando'
  if (mins === 1) return '1 min'
  return `${mins} min`
}
