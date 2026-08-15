import { useState } from 'react'
import { fmt, prettyDay } from '../../lib/challenge'
import type { DayCell } from '../../lib/stats'

/**
 * Ordinal ramp — one hue, light→dark, mapped to the six possible daily scores.
 * A missed day gets the neutral "no data" step, not the bottom of the ramp.
 */
const STEP: Record<number, string> = {
  0: 'var(--t0)',
  4: 'var(--t1)',
  7: 'var(--t2)',
  10: 'var(--t3)',
  15: 'var(--t4)',
  20: 'var(--t5)',
}

export const RAMP_LEGEND = [
  { points: 0, label: 'missed' },
  { points: 4, label: '3k' },
  { points: 7, label: '5k' },
  { points: 10, label: '8k' },
  { points: 15, label: '12k' },
  { points: 20, label: '20k' },
]

export function RampSwatch({ points }: { points: number }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-[3px] align-middle"
      style={{ background: STEP[points], boxShadow: '0 0 0 1px var(--line) inset' }}
      aria-hidden="true"
    />
  )
}

export default function Heatmap({ cells, label }: { cells: DayCell[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null)

  function track(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - r.left) / r.width) * cells.length)
    setHover(i >= 0 && i < cells.length ? i : null)
  }

  const active = hover !== null ? cells[hover] : null

  return (
    <div className="relative">
      <div
        className="grid h-7 touch-pan-y gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${label}: ${cells.filter((c) => c.points > 0).length} of ${
          cells.length
        } days scored`}
      >
        {cells.map((c, i) => (
          <div
            key={c.day}
            className="rounded-[3px] transition-transform"
            style={{
              background: STEP[c.points] ?? 'var(--t0)',
              boxShadow: hover === i ? '0 0 0 2px var(--ink)' : '0 0 0 1px var(--line) inset',
              transform: hover === i ? 'scaleY(1.12)' : undefined,
            }}
          />
        ))}
      </div>

      {active && (
        <div
          className="pointer-events-none absolute -top-9 z-10 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-medium shadow-lg hairline tnum"
          style={{
            background: 'var(--surface)',
            left: `${((hover! + 0.5) / cells.length) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {prettyDay(active.day)} ·{' '}
          {active.steps === null ? 'no entry' : `${fmt(active.steps)} · ${active.points} pts`}
        </div>
      )}
    </div>
  )
}
