import { tierFor } from '../lib/challenge'

/** Points always ship with their tier emoji and the word "pts" — never color alone. */
export default function PointsChip({ steps, points }: { steps: number; points: number }) {
  const tier = tierFor(steps)
  const on = points > 0
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold tnum"
      style={{
        background: on ? 'var(--accent-soft)' : 'var(--surface-sunken)',
        color: on ? 'var(--ink)' : 'var(--ink-muted)',
      }}
      title={`${tier.label} · ${tier.blurb}`}
    >
      <span aria-hidden="true">{tier.emoji}</span>
      {points} pts
    </span>
  )
}
