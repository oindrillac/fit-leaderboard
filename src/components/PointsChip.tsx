import { tierFor } from '../lib/challenge'
import { tierColor } from '../lib/theme'

/** Points always ship with their tier emoji and the word "pts" — never color alone. */
export default function PointsChip({ steps, points }: { steps: number; points: number }) {
  const tier = tierFor(steps)
  const on = points > 0
  const color = tierColor(tier)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold tnum"
      style={{
        background: on ? `color-mix(in oklab, ${color} 20%, var(--surface))` : 'var(--surface-sunken)',
        color: on ? color : 'var(--ink-muted)',
      }}
      title={`${tier.label} · ${tier.blurb}`}
    >
      <span aria-hidden="true">{tier.emoji}</span>
      {points} pts
    </span>
  )
}
