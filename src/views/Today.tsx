import { dayNumber, fmt, pointsFor, relativeDay, today, TOTAL_DAYS } from '../lib/challenge'
import { PARTICIPANTS, type Participant } from '../lib/participants'
import type { Standing } from '../lib/stats'
import { key, type Entry } from '../lib/store'
import type { Mode } from '../lib/theme'
import Avatar from '../components/Avatar'
import PointsChip from '../components/PointsChip'

export default function Today({
  entries,
  standings,
  mode,
  me,
  openSheet,
}: {
  entries: Map<string, Entry>
  standings: Standing[]
  mode: Mode
  me: number | null
  openSheet: (p: Participant, day: string) => void
}) {
  const day = today()
  const rows = PARTICIPANTS.map((p) => ({ p, entry: entries.get(key(p.id, day)) }))
  // You first — everyone else keeps their fixed order so the list never shuffles.
  rows.sort((a, b) => (a.p.id === me ? -1 : b.p.id === me ? 1 : 0))

  const logged = rows.filter((r) => r.entry)
  const missing = rows.filter((r) => !r.entry)
  const squadSteps = logged.reduce((s, r) => s + (r.entry?.steps ?? 0), 0)
  const streakOf = (id: number) => standings.find((s) => s.participant.id === id)?.streak ?? 0

  return (
    <div className="space-y-4">
      <section className="card animate-pop p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">
              Day {dayNumber()} of {TOTAL_DAYS}
            </p>
            <h1 className="mt-0.5 text-[26px] font-bold leading-tight">{relativeDay(day)}</h1>
          </div>
          <div className="text-right">
            <p className="text-[26px] font-bold leading-none tracking-tight">{fmt(squadSteps)}</p>
            <p className="mt-1 text-[12px] text-muted">squad steps today</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full"
            style={{ background: 'var(--surface-sunken)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(logged.length / PARTICIPANTS.length) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <span className="text-[12px] font-semibold text-ink-2 tnum">
            {logged.length}/{PARTICIPANTS.length} in
          </span>
        </div>

        {missing.length > 0 && (
          <p className="mt-2.5 text-[13px] text-muted">
            Still to log: {missing.map((r) => r.p.name).join(', ')}
          </p>
        )}
      </section>

      <section className="card animate-pop overflow-hidden">
        <ul>
          {rows.map(({ p, entry }, i) => {
            const steps = entry?.steps ?? 0
            const streak = streakOf(p.id)
            return (
              <li key={p.id} className={i > 0 ? 'border-t hairline' : undefined}>
                <button
                  onClick={() => openSheet(p, day)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-[var(--surface-2)]"
                >
                  <Avatar p={p} mode={mode} size={42} dim={!entry} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold">{p.name}</span>
                      {p.id === me && (
                        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                          you
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                      {entry ? (
                        <span className="tnum">{fmt(steps)} steps</span>
                      ) : (
                        'Tap to add today'
                      )}
                      {streak > 1 && <span className="tnum"> · 🔥 {streak}-day streak</span>}
                      {entry?.screenshot_url && ' · 📷'}
                    </span>
                  </span>
                  {entry ? (
                    <PointsChip steps={steps} points={pointsFor(steps)} />
                  ) : (
                    <span className="rounded-full border border-dashed px-2.5 py-1 text-[13px] font-medium text-muted hairline">
                      add
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
