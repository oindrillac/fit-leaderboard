import { useMemo, useState } from 'react'
import { ALL_DAYS, elapsedDays, fmt, MONTHLY_CHAMPION_BONUS, today } from '../lib/challenge'
import { buildStandings } from '../lib/stats'
import type { Entry } from '../lib/store'
import type { Mode } from '../lib/theme'
import Avatar from '../components/Avatar'

type Range = 'all' | 'week' | 'today'

const RANGES: { key: Range; label: string }[] = [
  { key: 'all', label: `All ${ALL_DAYS.length} days` },
  { key: 'week', label: 'Last 7' },
  { key: 'today', label: 'Today' },
]

const MEDAL = ['🥇', '🥈', '🥉']
const PLINTH = ['var(--gold)', 'var(--silver)', 'var(--bronze)']

export default function Board({
  entries,
  mode,
  me,
}: {
  entries: Map<string, Entry>
  mode: Mode
  me: number | null
}) {
  const [range, setRange] = useState<Range>('all')

  const standings = useMemo(() => {
    const all = elapsedDays()
    const days = range === 'today' ? [today()] : range === 'week' ? all.slice(-7) : all
    return buildStandings(entries, days, { champion: range === 'all' })
  }, [entries, range])

  const anyPoints = standings.some((s) => s.points > 0)
  const podium = standings.slice(0, 3)
  // Visual podium order: 2nd, 1st, 3rd
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)
  const leaderPoints = standings[0]?.points ?? 0

  // Group monthly leaders by month, so Oct/Nov/Dec each get their own line.
  const monthlyLeaders =
    range === 'all'
      ? (() => {
          const byMonth = new Map<
            string,
            { label: string; complete: boolean; leaders: typeof standings }
          >()
          for (const s of standings) {
            for (const m of s.monthlyChampionships) {
              const entry = byMonth.get(m.key) ?? { label: m.label, complete: m.complete, leaders: [] }
              entry.leaders.push(s)
              byMonth.set(m.key, entry)
            }
          }
          return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
        })()
      : []

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 rounded-full p-1" style={{ background: 'var(--surface-sunken)' }}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className="flex-1 rounded-full py-2 text-[13px] font-semibold transition"
            style={
              range === r.key
                ? { background: 'var(--accent)', color: 'var(--accent-ink)', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }
                : { color: 'var(--ink-muted)' }
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {monthlyLeaders.map((m) => (
        <section
          key={m.label}
          className="card animate-pop flex items-center gap-3 border-0 p-4"
          style={{ background: 'linear-gradient(135deg, var(--accent-soft), var(--surface))' }}
        >
          <span className="text-2xl" aria-hidden="true">
            📅
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold leading-tight">
              {m.leaders.map((c) => c.participant.name).join(' & ')}{' '}
              {m.leaders.length > 1 ? 'are' : 'is'} leading {m.label}
            </p>
            <p className="text-[12px] font-semibold tnum" style={{ color: 'var(--accent)' }}>
              +{MONTHLY_CHAMPION_BONUS} bonus {m.complete ? 'awarded' : `if it holds through ${m.label}`}
            </p>
          </div>
        </section>
      ))}

      {!anyPoints ? (
        <section className="card animate-pop p-8 text-center">
          <p className="text-4xl" aria-hidden="true">
            👟
          </p>
          <p className="mt-3 text-[15px] font-semibold">Nothing on the board yet</p>
          <p className="mt-1 text-[13px] text-muted">
            First steps logged go straight to the top. No pressure.
          </p>
        </section>
      ) : (
        <section className="card animate-pop px-4 pb-5 pt-6">
          <div className="flex items-end justify-center gap-2.5">
            {podiumOrder.map((s) => {
              const place = s.rank - 1
              const h = place === 0 ? 78 : place === 1 ? 58 : 44
              return (
                <div key={s.participant.id} className="flex w-1/3 flex-col items-center">
                  <span className={place === 0 ? 'mb-1 text-2xl' : 'mb-1 text-xl'} aria-hidden="true">
                    {MEDAL[Math.min(place, 2)]}
                  </span>
                  <span
                    style={
                      place === 0
                        ? { borderRadius: '9999px', boxShadow: `0 0 0 3px var(--surface), 0 0 14px color-mix(in oklab, var(--gold) 70%, transparent)` }
                        : undefined
                    }
                  >
                    <Avatar p={s.participant} mode={mode} size={place === 0 ? 52 : 42} />
                  </span>
                  <p className="mt-1.5 max-w-full truncate text-[13px] font-bold">
                    {s.participant.name}
                  </p>
                  <p className="text-[12px] text-muted tnum">{fmt(s.steps)} steps</p>
                  <div
                    className="mt-2 grid w-full place-items-center rounded-t-xl px-2"
                    style={{
                      height: h,
                      background: `color-mix(in oklab, ${PLINTH[Math.min(place, 2)]} 34%, var(--surface))`,
                      borderTop: `${place === 0 ? 4 : 3}px solid ${PLINTH[Math.min(place, 2)]}`,
                    }}
                  >
                    <span className="text-[20px] font-bold leading-none tnum">{s.points}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted">pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Full table — also the relief for series colors that sit under 3:1 on
          the light surface: every number is written out, not just encoded. */}
      <section className="card animate-pop overflow-hidden">
        <table className="w-full text-left">
          <caption className="sr-only">Standings</caption>
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted">
              <th scope="col" className="py-2.5 pl-4 pr-1 font-semibold">
                #
              </th>
              <th scope="col" className="py-2.5 font-semibold">
                Who
              </th>
              <th scope="col" className="py-2.5 pr-3 text-right font-semibold">
                Steps
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-semibold">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr
                key={s.participant.id}
                className="border-t hairline"
                style={
                  s.participant.id === me ? { background: 'var(--accent-soft)' } : undefined
                }
              >
                <td className="py-3 pl-4 pr-1 text-[13px] font-bold text-muted tnum">{s.rank}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar p={s.participant} mode={mode} size={32} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">{s.participant.name}</p>
                      <p className="text-[11.5px] text-muted tnum">
                        {s.daysLogged}/{s.daysPossible} days
                        {s.streak > 1 && ` · 🔥${s.streak}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3 text-right text-[13px] text-ink-2 tnum">{fmt(s.steps)}</td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-[17px] font-bold tnum">{s.points}</span>
                  {s.rank > 1 && leaderPoints > s.points && (
                    <span className="block text-[11px] text-muted tnum">
                      −{leaderPoints - s.points}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
