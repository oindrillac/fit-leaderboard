import { useMemo } from 'react'
import { fmt, prettyDay } from '../lib/challenge'
import { PARTICIPANTS } from '../lib/participants'
import { cumulativeSeries, dailyTotals, squadStats, type Standing } from '../lib/stats'
import type { Entry } from '../lib/store'
import type { Mode } from '../lib/theme'
import Avatar from '../components/Avatar'
import DailyBars from '../components/charts/DailyBars'
import Heatmap, { RAMP_LEGEND, RampSwatch } from '../components/charts/Heatmap'
import PointsRules from '../components/PointsRules'
import RaceChart from '../components/charts/RaceChart'

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-[22px] font-bold leading-none tracking-tight">{value}</p>
      {sub && <p className="mt-1 truncate text-[11.5px] text-muted">{sub}</p>}
    </div>
  )
}

export default function Trends({
  entries,
  standings,
  mode,
}: {
  entries: Map<string, Entry>
  standings: Standing[]
  mode: Mode
}) {
  const series = useMemo(() => cumulativeSeries(entries), [entries])
  const totals = useMemo(() => dailyTotals(entries), [entries])
  const stats = useMemo(() => squadStats(standings), [standings])

  const fillRate = stats.entriesPossible
    ? Math.round((stats.entriesLogged / stats.entriesPossible) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Squad steps"
          value={fmt(stats.totalSteps)}
          sub={`${fmt(stats.totalPoints)} points banked`}
        />
        <Tile
          label="Days left"
          value={String(stats.daysRemaining)}
          sub={`${stats.daysElapsed} down`}
        />
        <Tile
          label="Logged"
          value={`${fillRate}%`}
          sub={`${stats.entriesLogged} of ${stats.entriesPossible} entries`}
        />
        <Tile
          label="Best day"
          value={stats.bestDay ? fmt(stats.bestDay.steps) : '—'}
          sub={
            stats.bestDay
              ? `${stats.bestDay.participant.emoji} ${stats.bestDay.participant.name} · ${prettyDay(
                  stats.bestDay.day,
                )}`
              : 'no entries yet'
          }
        />
      </div>

      <section className="card p-4">
        <h2 className="text-[15px] font-bold">The race</h2>
        <p className="mb-3 text-[12.5px] text-muted">Points, adding up day by day</p>
        <RaceChart series={series} mode={mode} />
      </section>

      <section className="card p-4">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-bold">Streak grid</h2>
          <span className="text-[11.5px] text-muted">Aug 15 → today</span>
        </div>
        <p className="mb-3 text-[12.5px] text-muted">Every day, darker means a bigger day</p>

        <div className="space-y-2.5">
          {standings.map((s) => (
            <div key={s.participant.id} className="flex items-center gap-2.5">
              <div className="flex w-[92px] shrink-0 items-center gap-1.5">
                <Avatar p={s.participant} mode={mode} size={22} />
                <span className="truncate text-[12.5px] font-medium">{s.participant.name}</span>
              </div>
              <div className="min-w-0 flex-1">
                <Heatmap cells={s.cells} label={s.participant.name} />
              </div>
              <span className="w-9 shrink-0 text-right text-[12.5px] font-bold tnum">
                {s.points}
              </span>
            </div>
          ))}
        </div>

        <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t pt-3 hairline">
          {RAMP_LEGEND.map((r) => (
            <li key={r.points} className="flex items-center gap-1 text-[11px] text-muted">
              <RampSwatch points={r.points} />
              {r.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="text-[15px] font-bold">Squad steps per day</h2>
        <p className="mb-3 text-[12.5px] text-muted">All {PARTICIPANTS.length} of us, added together</p>
        <DailyBars data={totals} />
      </section>

      {(stats.longestStreak || stats.mostConsistent) && (
        <section className="card p-4">
          <h2 className="mb-3 text-[15px] font-bold">Standouts</h2>
          <ul className="space-y-2.5">
            {stats.longestStreak && (
              <li className="flex items-center gap-2.5">
                <span className="text-lg" aria-hidden="true">
                  🔥
                </span>
                <span className="flex-1 text-[13.5px]">
                  <b>Longest streak</b> · {stats.longestStreak.participant.name}
                </span>
                <span className="text-[13.5px] font-bold tnum">
                  {stats.longestStreak.length} days
                </span>
              </li>
            )}
            {stats.mostConsistent && (
              <li className="flex items-center gap-2.5">
                <span className="text-lg" aria-hidden="true">
                  📅
                </span>
                <span className="flex-1 text-[13.5px]">
                  <b>Most consistent</b> · {stats.mostConsistent.participant.name}
                </span>
                <span className="text-[13.5px] font-bold tnum">
                  {stats.mostConsistent.daysLogged} days
                </span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="card p-4">
        <h2 className="mb-3 text-[15px] font-bold">How points work</h2>
        <PointsRules />
      </section>
    </div>
  )
}
