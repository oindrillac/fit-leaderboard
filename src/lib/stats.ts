import { ALL_DAYS, elapsedDays, pointsFor, today } from './challenge'
import { PARTICIPANTS, type Participant } from './participants'
import { key, type Entry } from './store'

export type DayCell = {
  day: string
  steps: number | null
  points: number
  hasShot: boolean
}

export type Standing = {
  participant: Participant
  points: number
  steps: number
  daysLogged: number
  daysPossible: number
  avgSteps: number
  bestDay: { day: string; steps: number } | null
  streak: number
  longestStreak: number
  cells: DayCell[]
  rank: number
}

/** A day counts toward a streak if it actually scored. 2,000 steps is a gap. */
const scored = (c: DayCell) => c.points > 0

function currentStreak(cells: DayCell[]): number {
  const t = today()
  const upToToday = cells.filter((c) => c.day <= t)
  if (upToToday.length === 0) return 0
  // A blank today doesn't break the streak — the day isn't over yet.
  let i = upToToday.length - 1
  if (!scored(upToToday[i])) i -= 1
  let n = 0
  for (; i >= 0 && scored(upToToday[i]); i--) n++
  return n
}

function longestStreak(cells: DayCell[]): number {
  let best = 0
  let run = 0
  for (const c of cells) {
    run = scored(c) ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

export function buildStandings(
  entries: Map<string, Entry>,
  days: string[] = elapsedDays(),
): Standing[] {
  const rows = PARTICIPANTS.map((participant) => {
    const cells: DayCell[] = days.map((day) => {
      const e = entries.get(key(participant.id, day))
      return {
        day,
        steps: e ? e.steps : null,
        points: e ? pointsFor(e.steps) : 0,
        hasShot: Boolean(e?.screenshot_url),
      }
    })

    const logged = cells.filter((c) => c.steps !== null)
    const steps = logged.reduce((s, c) => s + (c.steps ?? 0), 0)
    const best = logged.reduce<{ day: string; steps: number } | null>(
      (acc, c) => (acc === null || (c.steps ?? 0) > acc.steps ? { day: c.day, steps: c.steps! } : acc),
      null,
    )

    return {
      participant,
      points: cells.reduce((s, c) => s + c.points, 0),
      steps,
      daysLogged: logged.length,
      daysPossible: days.length,
      avgSteps: logged.length ? Math.round(steps / logged.length) : 0,
      bestDay: best,
      streak: currentStreak(cells),
      longestStreak: longestStreak(cells),
      cells,
      rank: 0,
    }
  })

  // Points first; total steps breaks ties, then days logged. Ties share a rank.
  rows.sort((a, b) => b.points - a.points || b.steps - a.steps || b.daysLogged - a.daysLogged)
  rows.forEach((r, i) => {
    const prev = rows[i - 1]
    r.rank = prev && prev.points === r.points && prev.steps === r.steps ? prev.rank : i + 1
  })
  return rows
}

/** Running point totals per person across the whole window, for the race chart. */
export function cumulativeSeries(entries: Map<string, Entry>) {
  const days = elapsedDays()
  return PARTICIPANTS.map((participant) => {
    let running = 0
    const values = days.map((day) => {
      const e = entries.get(key(participant.id, day))
      running += e ? pointsFor(e.steps) : 0
      return running
    })
    return { participant, values, total: running }
  })
}

/** Squad-wide steps per day — the "are we all still doing this" chart. */
export function dailyTotals(entries: Map<string, Entry>) {
  return elapsedDays().map((day) => {
    let steps = 0
    let loggedBy = 0
    for (const p of PARTICIPANTS) {
      const e = entries.get(key(p.id, day))
      if (e) {
        steps += e.steps
        loggedBy++
      }
    }
    return { day, steps, loggedBy }
  })
}

export type SquadStats = {
  totalSteps: number
  totalPoints: number
  entriesLogged: number
  entriesPossible: number
  bestDay: { participant: Participant; day: string; steps: number } | null
  longestStreak: { participant: Participant; length: number } | null
  mostConsistent: Standing | null
  daysElapsed: number
  daysRemaining: number
}

export function squadStats(standings: Standing[]): SquadStats {
  const elapsed = elapsedDays().length
  let bestDay: SquadStats['bestDay'] = null
  let longest: SquadStats['longestStreak'] = null

  for (const s of standings) {
    if (s.bestDay && (bestDay === null || s.bestDay.steps > bestDay.steps)) {
      bestDay = { participant: s.participant, ...s.bestDay }
    }
    if (s.longestStreak > 0 && (longest === null || s.longestStreak > longest.length)) {
      longest = { participant: s.participant, length: s.longestStreak }
    }
  }

  const mostConsistent =
    [...standings].sort((a, b) => b.daysLogged - a.daysLogged || b.points - a.points)[0] ?? null

  return {
    totalSteps: standings.reduce((s, r) => s + r.steps, 0),
    totalPoints: standings.reduce((s, r) => s + r.points, 0),
    entriesLogged: standings.reduce((s, r) => s + r.daysLogged, 0),
    entriesPossible: standings.length * elapsed,
    bestDay,
    longestStreak: longest,
    mostConsistent: mostConsistent && mostConsistent.daysLogged > 0 ? mostConsistent : null,
    daysElapsed: elapsed,
    daysRemaining: ALL_DAYS.length - elapsed,
  }
}
