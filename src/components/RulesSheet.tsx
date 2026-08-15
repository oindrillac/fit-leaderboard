import { useEffect } from 'react'
import PointsRules from './PointsRules'

export default function RulesSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        className="absolute inset-0 animate-fade bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How points work"
        className="animate-sheet relative w-full max-w-md rounded-t-[2rem] bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[2rem] sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--surface-sunken)] sm:hidden" />

        <header className="mb-5 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            🏆
          </span>
          <h2 className="flex-1 text-lg font-bold leading-tight">How points work</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-sunken)] text-lg text-ink-2"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <PointsRules />
      </div>
    </div>
  )
}
