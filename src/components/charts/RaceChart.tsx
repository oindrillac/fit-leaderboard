import { useState } from 'react'
import { elapsedDays, prettyDay } from '../../lib/challenge'
import type { Participant } from '../../lib/participants'
import { colorOf, type Mode } from '../../lib/theme'
import { useMeasure } from '../../lib/useMeasure'
import Tooltip from './Tooltip'

export type Series = { participant: Participant; values: number[]; total: number }

const H = 220
const PAD = { top: 12, right: 46, bottom: 22, left: 30 }

export default function RaceChart({ series, mode }: { series: Series[]; mode: Mode }) {
  const [box, width] = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const days = elapsedDays()

  const maxY = Math.max(20, ...series.map((s) => s.total))
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (days.length <= 1 ? innerW / 2 : (i / (days.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxY))

  // Direct-label only the leaders; the legend below carries everyone else.
  const labelled = new Set(
    [...series].sort((a, b) => b.total - a.total).slice(0, 3).map((s) => s.participant.id),
  )

  function track(e: React.PointerEvent<HTMLDivElement>) {
    if (innerW <= 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const f = (e.clientX - r.left - PAD.left) / innerW
    const i = Math.round(f * Math.max(1, days.length - 1))
    setHover(Math.max(0, Math.min(days.length - 1, i)))
  }

  const ranked =
    hover === null
      ? []
      : [...series].sort((a, b) => b.values[hover] - a.values[hover]).slice(0, 7)

  return (
    <div>
      <div
        ref={box}
        className="relative touch-pan-y"
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
      >
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label="Cumulative points by day">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--grid)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={y(t) + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--ink-muted)"
                  className="tnum"
                >
                  {t}
                </text>
              </g>
            ))}

            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="var(--axis)"
                strokeWidth={1}
              />
            )}

            {series.map((s) => {
              const color = colorOf(s.participant, mode)
              const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
              const dim = hover !== null && ranked[0]?.participant.id !== s.participant.id
              return (
                <g key={s.participant.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={dim ? 0.75 : 1}
                  />
                  {days.length === 1 && <circle cx={x(0)} cy={y(s.values[0])} r={4} fill={color} />}
                  {hover !== null && (
                    <circle
                      cx={x(hover)}
                      cy={y(s.values[hover])}
                      r={4}
                      fill={color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  )}
                  {labelled.has(s.participant.id) && (
                    <text
                      x={width - PAD.right + 6}
                      y={y(s.total) + 3.5}
                      fontSize={11}
                      fontWeight={600}
                      fill="var(--ink-2)"
                    >
                      {s.participant.emoji} {s.total}
                    </text>
                  )}
                </g>
              )
            })}

            <text x={PAD.left} y={H - 6} fontSize={10} fill="var(--ink-muted)">
              {prettyDay(days[0])}
            </text>
            {days.length > 1 && (
              <text
                x={width - PAD.right}
                y={H - 6}
                textAnchor="end"
                fontSize={10}
                fill="var(--ink-muted)"
              >
                {prettyDay(days[days.length - 1])}
              </text>
            )}
          </svg>
        )}

        {hover !== null && width > 0 && (
          <Tooltip x={x(hover)} containerWidth={width}>
            <p className="mb-1 font-semibold">{prettyDay(days[hover])}</p>
            {ranked.map((s) => (
              <p key={s.participant.id} className="flex items-center gap-1.5 leading-5">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colorOf(s.participant, mode) }}
                />
                <span className="flex-1 truncate text-ink-2">{s.participant.name}</span>
                <span className="font-semibold tnum">{s.values[hover]}</span>
              </p>
            ))}
          </Tooltip>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {series.map((s) => (
          <li key={s.participant.id} className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: colorOf(s.participant, mode) }}
              aria-hidden="true"
            />
            {s.participant.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
