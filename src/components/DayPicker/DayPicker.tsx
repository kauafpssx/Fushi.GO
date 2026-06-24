import { cn } from '../../shared/lib/cn'

interface DayPickerProps {
  selectedDate: string
  onSelect: (date: string) => void
  className?: string
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDays(count: number): { date: string; label: string; weekday: string; isToday: boolean }[] {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    return {
      date: iso,
      label: d.getDate().toString(),
      weekday: WEEKDAYS[d.getDay()],
      isToday: i === 0,
    }
  })
}

export function DayPicker({ selectedDate, onSelect, className }: DayPickerProps) {
  const days = getDays(7)

  return (
    <div className={cn('flex gap-1.5', className)}>
      {days.map((day) => {
        const isSelected = day.date === selectedDate
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(day.date)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center rounded-lg py-2 transition-all active:scale-95',
              isSelected
                ? 'bg-primary text-on-primary'
                : day.isToday
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-surface-high/40 text-on-surface-dim hover:bg-surface-highest/60'
            )}
          >
            <span className="font-geist text-[9px] font-semibold uppercase tracking-wide opacity-70">
              {day.weekday}
            </span>
            <span className={cn('font-geist text-sm font-bold mt-0.5', isSelected && 'text-on-primary')}>
              {day.isToday ? 'Hoje' : day.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
