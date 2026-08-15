import { useEffect, useState } from 'react'

const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7']

/** Purely decorative celebration for a 12k+ day. Hidden from assistive tech. */
export default function Confetti({ burst }: { burst: number }) {
  const [pieces, setPieces] = useState<number[]>([])

  useEffect(() => {
    if (burst === 0) return
    setPieces(Array.from({ length: 44 }, (_, i) => i))
    const t = setTimeout(() => setPieces([]), 2400)
    return () => clearTimeout(t)
  }, [burst])

  if (pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((i) => {
        const seed = (i * 2654435761) % 1000
        return (
          <span
            key={`${burst}-${i}`}
            className="absolute top-0 block rounded-[2px]"
            style={{
              left: `${(seed % 100).toFixed(2)}%`,
              width: 6 + (seed % 5),
              height: 10 + (seed % 8),
              background: COLORS[i % COLORS.length],
              ['--dx' as string]: `${((seed % 41) - 20) * 4}px`,
              ['--rot' as string]: `${360 + (seed % 5) * 180}deg`,
              animation: `confetti-fall ${1.5 + (seed % 90) / 100}s cubic-bezier(0.3,0.7,0.6,1) ${
                (seed % 40) / 100
              }s both`,
            }}
          />
        )
      })}
    </div>
  )
}
