import type { ReactNode } from 'react'

/** Floating card that follows the pointer, clamped inside its chart. */
export default function Tooltip({
  x,
  containerWidth,
  children,
}: {
  x: number
  containerWidth: number
  children: ReactNode
}) {
  const W = 170
  const left = Math.max(4, Math.min(x - W / 2, containerWidth - W - 4))
  return (
    <div
      className="pointer-events-none absolute top-1 z-10 rounded-xl border px-3 py-2 text-[12px] shadow-lg hairline"
      style={{ left, width: W, background: 'var(--surface)' }}
      role="status"
    >
      {children}
    </div>
  )
}
