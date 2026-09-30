import type { Participant } from '../lib/participants'
import { colorOf, type Mode } from '../lib/theme'

export default function Avatar({
  p,
  mode,
  size = 44,
  dim = false,
}: {
  p: Participant
  mode: Mode
  size?: number
  dim?: boolean
}) {
  const color = colorOf(p, mode)
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full transition-opacity"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: `color-mix(in oklab, ${color} 34%, var(--surface))`,
        // 2px surface ring keeps adjacent avatars from bleeding into each other
        boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${color}`,
        opacity: dim ? 0.45 : 1,
      }}
      aria-hidden="true"
    >
      {p.emoji}
    </span>
  )
}
