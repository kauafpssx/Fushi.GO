import { Navigation, Layers, Maximize2 } from 'lucide-react'
import { FloatingButton } from '../../../components/FloatingButton/FloatingButton'

interface MapControlsProps {
  onCenter?: () => void
  onLayers?: () => void
  onFullscreen?: () => void
}

export function MapControls({ onCenter, onLayers, onFullscreen }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-20 z-30 hidden md:flex flex-col gap-3">
      <FloatingButton onClick={onCenter} size="md" variant="glass">
        <Navigation className="h-5 w-5 text-on-surface" />
      </FloatingButton>

      <FloatingButton onClick={onLayers} size="md" variant="glass">
        <Layers className="h-5 w-5 text-on-surface" />
      </FloatingButton>

      <FloatingButton onClick={onFullscreen} size="sm" variant="glass">
        <Maximize2 className="h-4 w-4 text-on-surface" />
      </FloatingButton>
    </div>
  )
}
