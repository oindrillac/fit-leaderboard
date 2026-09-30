// The challenge window and the scoring rules. Single source of truth for the UI;
// mirrored by a generated column in supabase/schema.sql so the DB agrees.

export const START_DAY = '2026-10-01'
export const END_DAY = '2026-12-29'

/** Everyone's "today" flips at midnight IST, wherever they actually are. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/** Today as YYYY-MM-DD in IST. */
export function today(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** Milliseconds until the IST day rolls over, so the app can refresh itself. */
export function msUntilNextDay(): number {
  const shifted = Date.now() + IST_OFFSET_MS
  return 86_400_000 - (shifted % 86_400_000)
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(day + 'T00:00:00Z') + n * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)
}

/** Every day of the challenge, in order. Oct 1 → Dec 29 inclusive = 90 days. */
export const ALL_DAYS: string[] = Array.from(
  { length: daysBetween(START_DAY, END_DAY) + 1 },
  (_, i) => addDays(START_DAY, i),
)

export const TOTAL_DAYS = ALL_DAYS.length

/** Days from the start through today — the ones that count as "could have logged". */
export function elapsedDays(): string[] {
  const t = today()
  return ALL_DAYS.filter((d) => d <= t)
}

/** 1-based day number of the challenge, clamped to the window. */
export function dayNumber(day: string = today()): number {
  return Math.min(Math.max(daysBetween(START_DAY, day) + 1, 1), TOTAL_DAYS)
}

export function isInChallenge(day: string): boolean {
  return day >= START_DAY && day <= END_DAY
}

/** Today, clamped into the challenge window — what "Today" should default to
 *  for logging/navigation before the challenge starts (or after it ends). */
export function currentDay(): string {
  const t = today()
  return t < START_DAY ? START_DAY : t > END_DAY ? END_DAY : t
}

// ---------------------------------------------------------------- scoring

export type Tier = {
  key: string
  label: string
  blurb: string
  min: number
  points: number
  emoji: string
}

/** Base tiers, highest first. Everyday count — nothing below 8,000. */
export const TIERS: Tier[] = [
  { key: 'big', label: 'Big day', blurb: '12,000+', min: 12000, points: 20, emoji: '🔥' },
  { key: 'great', label: 'Nailed it', blurb: '10,000+', min: 10000, points: 15, emoji: '💪' },
  { key: 'solid', label: 'Solid day', blurb: '8,000+', min: 8000, points: 10, emoji: '👏' },
  { key: 'none', label: 'Rest day', blurb: 'Under 8,000', min: 0, points: 0, emoji: '😴' },
]

/** Whoever logs the most total steps in a calendar month gets this, once that month is over. */
export const MONTHLY_CHAMPION_BONUS = 10

export const MAX_DAILY_POINTS = 20

/** 8k+ = 10, 10k+ = 15, 12k+ = 20, else 0. */
export function pointsFor(steps: number): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0
  if (steps >= 12000) return 20
  if (steps >= 10000) return 15
  if (steps >= 8000) return 10
  return 0
}

export function tierFor(steps: number): Tier {
  return TIERS.find((t) => steps >= t.min) ?? TIERS[TIERS.length - 1]
}

/** How many more steps to reach the next scoring tier, or null at the top. */
export function nextTier(steps: number): { steps: number; points: number } | null {
  const ladder = [8000, 10000, 12000]
  const next = ladder.find((n) => steps < n)
  if (next === undefined) return null
  return { steps: next - steps, points: pointsFor(next) - pointsFor(steps) }
}

// ------------------------------------------------------------ monthly bonus

export type MonthWindow = { key: string; label: string; days: string[] }

/** The challenge window split into calendar months — Oct, Nov, Dec. */
export const MONTHS: MonthWindow[] = (() => {
  const byMonth = new Map<string, string[]>()
  for (const d of ALL_DAYS) {
    const k = d.slice(0, 7)
    if (!byMonth.has(k)) byMonth.set(k, [])
    byMonth.get(k)!.push(d)
  }
  return [...byMonth.entries()].map(([monthKey, days]) => ({
    key: monthKey,
    label: new Date(monthKey + '-01T00:00:00Z').toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'long',
    }),
    days,
  }))
})()

/** True the day after a given month's slice of the challenge ends — its bonus locks in then. */
export function isMonthComplete(month: MonthWindow): boolean {
  return today() > month.days[month.days.length - 1]
}

// ---------------------------------------------------------------- formatting

const NF = new Intl.NumberFormat('en-US')
export const fmt = (n: number) => NF.format(Math.round(n))

export function prettyDay(day: string, opts: { weekday?: boolean } = {}): string {
  const d = new Date(day + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: opts.weekday ? 'long' : undefined,
    month: 'short',
    day: 'numeric',
  })
}

export function relativeDay(day: string): string {
  const diff = daysBetween(day, today())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return prettyDay(day, { weekday: true })
}
