import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ALL_DAYS,
  addDays,
  currentDay,
  dayNumber,
  fmt,
  isInChallenge,
  pointsFor,
  prettyDay,
  relativeDay,
  START_DAY,
  today,
} from '../lib/challenge'
import { PARTICIPANTS } from '../lib/participants'
import { key, type Entry, type EntryDraft, type Store } from '../lib/store'
import type { Mode } from '../lib/theme'
import Avatar from '../components/Avatar'

/** Parses lines like "Delilah 8,200", "rasika - 5000 steps", "Nehali: 12000". */
function parsePaste(text: string): Map<number, number> {
  const out = new Map<number, number>()
  for (const line of text.split(/[\n;]+/)) {
    const m = line.match(/([a-zA-Z]+)\D*?([\d][\d,\s]*)/)
    if (!m) continue
    const name = m[1].toLowerCase()
    const steps = Number(m[2].replace(/[^\d]/g, ''))
    if (!steps) continue
    const p = PARTICIPANTS.find((x) => x.name.toLowerCase().startsWith(name.slice(0, 3)))
    if (p) out.set(p.id, steps)
  }
  return out
}

export default function Bulk({
  entries,
  store,
  mode,
}: {
  entries: Map<string, Entry>
  store: Store
  mode: Mode
}) {
  const [day, setDay] = useState(currentDay)
  const [draft, setDraft] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [showPaste, setShowPaste] = useState(false)
  const [paste, setPaste] = useState('')
  const [saving, setSaving] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Reload the grid whenever the day changes or someone else edits it.
  useEffect(() => {
    const next: Record<number, string> = {}
    for (const p of PARTICIPANTS) {
      const e = entries.get(key(p.id, day))
      next[p.id] = e ? String(e.steps) : ''
    }
    setDraft(next)
    setStatus(null)
  }, [day, entries])

  const dirty = useMemo(
    () =>
      PARTICIPANTS.filter((p) => {
        const v = draft[p.id]?.trim()
        if (!v) return false
        const e = entries.get(key(p.id, day))
        return !e || e.steps !== Number(v)
      }),
    [draft, entries, day],
  )

  /** Days in the past that nobody (or not everybody) has filled in yet. */
  const gaps = useMemo(() => {
    const t = today()
    return ALL_DAYS.filter((d) => d <= t)
      .map((d) => ({
        day: d,
        count: PARTICIPANTS.filter((p) => entries.has(key(p.id, d))).length,
      }))
      .filter((g) => g.count < PARTICIPANTS.length)
      .reverse()
      .slice(0, 8)
  }, [entries])

  async function saveAll() {
    if (dirty.length === 0) return
    setSaving(true)
    try {
      const drafts: EntryDraft[] = dirty.map((p) => ({
        participant_id: p.id,
        day,
        steps: Number(draft[p.id]),
      }))
      await store.save(drafts)
      setStatus(`Saved ${drafts.length} ${drafts.length === 1 ? 'entry' : 'entries'} ✓`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  function applyPaste() {
    const parsed = parsePaste(paste)
    if (parsed.size === 0) {
      setStatus("Couldn't find any names and numbers in that")
      return
    }
    setDraft((d) => {
      const next = { ...d }
      for (const [id, steps] of parsed) next[id] = String(steps)
      return next
    })
    setPaste('')
    setShowPaste(false)
    setStatus(`Filled ${parsed.size} — check them, then Save all`)
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDay((d) => (isInChallenge(addDays(d, -1)) ? addDays(d, -1) : d))}
            disabled={day <= START_DAY}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-lg hairline disabled:opacity-30"
            aria-label="Previous day"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[15px] font-bold">{relativeDay(day)}</p>
            <p className="text-[12px] text-muted">
              {prettyDay(day)} · day {dayNumber(day)} of {ALL_DAYS.length}
            </p>
          </div>
          <button
            onClick={() => setDay((d) => (addDays(d, 1) <= today() ? addDays(d, 1) : d))}
            disabled={day >= today()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-lg hairline disabled:opacity-30"
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="date"
            value={day}
            min={START_DAY}
            max={currentDay()}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px] hairline"
            aria-label="Pick a date"
          />
          <button
            onClick={() => setDay(currentDay())}
            className="rounded-xl border px-3 py-2 text-[13px] font-semibold hairline"
          >
            Today
          </button>
        </div>

        {gaps.length > 0 && (
          <div className="mt-3 border-t pt-3 hairline">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Needs filling
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.map((g) => (
                <button
                  key={g.day}
                  onClick={() => setDay(g.day)}
                  className="rounded-full border px-2.5 py-1 text-[12px] hairline tnum"
                  style={day === g.day ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                >
                  {prettyDay(g.day)} · {g.count}/{PARTICIPANTS.length}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <ul>
          {PARTICIPANTS.map((p, i) => {
            const value = draft[p.id] ?? ''
            const steps = Number(value) || 0
            const existing = entries.get(key(p.id, day))
            const changed = value.trim() !== '' && (!existing || existing.steps !== steps)
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t hairline' : ''}`}
                style={changed ? { background: 'var(--accent-soft)' } : undefined}
              >
                <Avatar p={p} mode={mode} size={32} dim={!value} />
                <label htmlFor={`bulk-${p.id}`} className="w-[70px] shrink-0 truncate text-[14px] font-semibold">
                  {p.name}
                </label>
                <input
                  id={`bulk-${p.id}`}
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  value={value}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [p.id]: e.target.value.replace(/[^\d]/g, '') }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const next = inputs.current[i + 1]
                      if (next) next.focus()
                      else void saveAll()
                    }
                  }}
                  inputMode="numeric"
                  enterKeyHint={i === PARTICIPANTS.length - 1 ? 'done' : 'next'}
                  placeholder="—"
                  className="min-w-0 flex-1 rounded-lg bg-[var(--surface-2)] px-2.5 py-2 text-right text-[15px] font-semibold tnum outline-none"
                />
                <span className="w-11 shrink-0 text-right text-[13px] font-bold text-ink-2 tnum">
                  {value ? `${pointsFor(steps)}p` : ''}
                </span>
                {existing && (
                  <button
                    onClick={() => void store.remove(p.id, day)}
                    className="shrink-0 px-1 text-[13px] text-muted"
                    aria-label={`Clear ${p.name}'s entry for ${prettyDay(day)}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <div className="space-y-2">
        <button
          onClick={saveAll}
          disabled={dirty.length === 0 || saving}
          className="w-full rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.99] disabled:opacity-40"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          {saving
            ? 'Saving…'
            : dirty.length === 0
              ? 'Nothing to save'
              : `Save all (${dirty.length})`}
        </button>

        {status && (
          <p role="status" className="text-center text-[13px] font-medium text-ink-2">
            {status}
          </p>
        )}

        <button
          onClick={() => setShowPaste((v) => !v)}
          className="w-full rounded-2xl border py-2.5 text-[13px] font-semibold text-ink-2 hairline"
        >
          {showPaste ? 'Hide paste box' : '📋  Paste from the group chat'}
        </button>

        {showPaste && (
          <div className="card animate-pop space-y-2 p-3">
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              placeholder={'Delilah 8200\nRasika - 5,400\nNehali: 12000 steps'}
              className="w-full resize-none rounded-xl bg-[var(--surface-2)] p-3 text-[13px] outline-none"
            />
            <button
              onClick={applyPaste}
              className="w-full rounded-xl border py-2.5 text-[13px] font-semibold hairline"
            >
              Fill the grid
            </button>
            <p className="text-[11.5px] text-muted">
              One name and number per line, any order. It fills the boxes above — nothing saves
              until you hit Save all.
            </p>
          </div>
        )}
      </div>

      <p className="pb-2 text-center text-[11.5px] text-muted">
        Squad total for {prettyDay(day)}:{' '}
        <b className="tnum">
          {fmt(PARTICIPANTS.reduce((s, p) => s + (Number(draft[p.id]) || 0), 0))}
        </b>{' '}
        steps
      </p>
    </div>
  )
}
