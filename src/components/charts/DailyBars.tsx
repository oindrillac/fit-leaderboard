import { useState } from 'react'
import { fmt, prettyDay } from '../../lib/challenge'
import { PARTICIPANTS } from '../../lib/participants'
import { useMeasure } from '../../lib/useMeasure'
import Tooltip from './Tooltip'

export type DayTotal = { day: string; steps: number; loggedBy: number }

const H = 150
const PAD = { top: 10, right: 4, bottom: 20, left: 34 }

/** One series, so no legend — the card title names it. */
export default function DailyBars({ data }: { data: DayTotal[] }) {
  const [box, width] = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const maxY = Math.max(1000, ...data.map((d) => d.steps))
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const slot = data.length ? innerW / data.length : 0
  const barW = Math.max(2, slot - 2) // 2px surface gap between adjacent bars
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH

  function track(e: React.PointerEvent<HTMLDivElement>) {
    if (slot <= 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.floor((e.clientX - r.left - PAD.left) / slot)
    setHover(i >= 0 && i < data.length ? i : null)
  }

  return (
    <div
      ref={box}
      className="relative touch-pan-y"
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={() => setHover(null)}
    >
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Squad steps per day">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(f * maxY)}
                y2={y(f * maxY)}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(f * maxY) + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="var(--ink-muted)"
                className="tnum"
              >
                {f === 0 ? '0' : `${Math.round((f * maxY) / 1000)}k`}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const h = Math.max(d.steps > 0 ? 3 : 0, PAD.top + innerH - y(d.steps))
            return (
              <rect
                key={d.day}
                x={PAD.left + i * slot + 1}
                y={PAD.top + innerH - h}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                fill="var(--t3)"
                opacity={hover === null || hover === i ? 1 : 0.55}
              />
            )
          })}

          <text x={PAD.left} y={H - 5} fontSize={10} fill="var(--ink-muted)">
            {data.length > 0 && prettyDay(data[0].day)}
          </text>
          {data.length > 1 && (
            <text
              x={width - PAD.right}
              y={H - 5}
              textAnchor="end"
              fontSize={10}
              fill="var(--ink-muted)"
            >
              {prettyDay(data[data.length - 1].day)}
            </text>
          )}
        </svg>
      )}

      {hover !== null && width > 0 && (
        <Tooltip x={PAD.left + hover * slot + slot / 2} containerWidth={width}>
          <p className="font-semibold">{prettyDay(data[hover].day)}</p>
          <p className="text-ink-2 tnum">{fmt(data[hover].steps)} steps</p>
          <p className="text-muted tnum">
            {data[hover].loggedBy} of {PARTICIPANTS.length} logged
          </p>
        </Tooltip>
      )}
    </div>
  )
}
