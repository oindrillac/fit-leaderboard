import { useEffect, useRef, useState } from 'react'
import { fmt, nextTier, pointsFor, relativeDay, tierFor } from '../lib/challenge'
import type { Participant } from '../lib/participants'
import type { Entry, Store } from '../lib/store'
import { colorOf, tierColor, type Mode } from '../lib/theme'
import Avatar from './Avatar'

export default function StepSheet({
  p,
  day,
  entry,
  store,
  mode,
  onClose,
  onSaved,
}: {
  p: Participant
  day: string
  entry: Entry | undefined
  store: Store
  mode: Mode
  onClose: () => void
  onSaved: (steps: number) => void
}) {
  const [value, setValue] = useState(entry ? String(entry.steps) : '')
  const [shot, setShot] = useState<string | null>(entry?.screenshot_url ?? null)
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'saving'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const steps = Math.max(0, Math.min(200_000, Number(value.replace(/[^\d]/g, '')) || 0))
  const points = pointsFor(steps)
  const tier = tierFor(steps)
  const next = nextTier(steps)
  const color = colorOf(p, mode)
  const tierHue = tierColor(tier)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy('uploading')
    setErr(null)
    try {
      setShot(await store.upload(file, p.id, day))
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setBusy('idle')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    if (value.trim() === '') return
    setBusy('saving')
    setErr(null)
    try {
      await store.save([{ participant_id: p.id, day, steps, screenshot_url: shot }])
      onSaved(steps)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not save')
      setBusy('idle')
    }
  }

  async function clear() {
    setBusy('saving')
    try {
      await store.remove(p.id, day)
      onClose()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not delete')
      setBusy('idle')
    }
  }

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
        aria-label={`Log steps for ${p.name}`}
        className="animate-sheet relative w-full max-w-md rounded-t-[2rem] bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[2rem] sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--surface-sunken)] sm:hidden" />

        <header className="mb-5 flex items-center gap-3">
          <Avatar p={p} mode={mode} size={44} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold leading-tight">{p.name}</h2>
            <p className="text-[13px] text-muted">{relativeDay(day)}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-sunken)] text-lg text-ink-2"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <label className="block text-[13px] font-semibold text-ink-2" htmlFor="steps-input">
          Steps
        </label>
        <div className="mt-1.5 flex items-baseline gap-2 border-b-2 pb-2" style={{ borderColor: color }}>
          <input
            id="steps-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="0"
            className="w-full bg-transparent text-[2.75rem] font-bold leading-none tracking-tight outline-none placeholder:text-[var(--surface-sunken)]"
            style={{ fontSize: '2.75rem' }}
          />
          <span className="shrink-0 text-sm text-muted">steps</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[3000, 5000, 8000, 10000, 12000].map((n) => (
            <button
              key={n}
              onClick={() => setValue(String(n))}
              className="rounded-full border px-3 py-1.5 text-[13px] font-medium text-ink-2 tnum hairline active:scale-95"
            >
              {fmt(n)}
            </button>
          ))}
        </div>

        <div
          className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
          style={{ background: `color-mix(in oklab, ${tierHue} 16%, var(--surface-2))` }}
        >
          <span className="text-2xl" aria-hidden="true">
            {tier.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight" style={{ color: tierHue }}>
              {points} {points === 1 ? 'point' : 'points'} · {tier.label}
            </p>
            <p className="truncate text-[13px] text-muted">
              {next
                ? `${fmt(next.steps)} more for +${next.points}`
                : 'Top of the scale — nothing above this 🚀'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {shot ? (
            <div className="flex items-center gap-3 rounded-2xl border p-2 hairline">
              <img
                src={shot}
                alt="Step count screenshot"
                className="h-14 w-14 rounded-xl object-cover"
              />
              <span className="flex-1 text-[13px] text-ink-2">Screenshot attached</span>
              <button onClick={() => setShot(null)} className="px-2 text-[13px] font-semibold text-muted">
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy === 'uploading'}
              className="w-full rounded-2xl border border-dashed py-3 text-[14px] font-medium text-ink-2 hairline active:scale-[0.99] disabled:opacity-60"
            >
              {busy === 'uploading' ? 'Shrinking image…' : '📷  Add screenshot (optional)'}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickFile}
            className="sr-only"
            tabIndex={-1}
          />
        </div>

        {err && (
          <p role="alert" className="mt-3 text-[13px] font-medium" style={{ color: '#d03b3b' }}>
            {err}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          {entry && (
            <button
              onClick={clear}
              disabled={busy !== 'idle'}
              className="rounded-2xl border px-4 py-3.5 text-[15px] font-semibold text-muted hairline active:scale-95 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={busy !== 'idle' || value.trim() === ''}
            className="flex-1 rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            {busy === 'saving' ? 'Saving…' : entry ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
