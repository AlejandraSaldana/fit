import { useRef } from 'react'

interface RPESliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function RPESlider({ label, value, onChange, min = 1, max = 10 }: RPESliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = ((value - min) / (max - min)) * 100

  function updateFromPointer(e: React.PointerEvent) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = Math.round(ratio * (max - min) + min)
    onChange(newValue)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPointer(e)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons === 0) return
    updateFromPointer(e)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    updateFromPointer(e)
  }

  return (
    <div>
      {/* Label + value row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ink">{label}</p>
        <p className="text-title font-bold text-accent leading-none">{value}</p>
      </div>

      {/* Track wrapper — enlarged touch target */}
      <div
        ref={trackRef}
        className="relative py-3 cursor-pointer select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Visual track */}
        <div className="relative h-2 bg-border rounded-full">
          {/* Fill */}
          <div
            className="absolute left-0 h-full bg-accent rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute w-5 h-5 bg-accent rounded-full shadow-card pointer-events-none"
          style={{
            left: `${pct}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  )
}
