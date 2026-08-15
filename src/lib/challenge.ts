// The challenge window and the scoring rules. Single source of truth for the UI;
// mirrored by a generated column in supabase/schema.sql so the DB agrees.

export const START_DAY = '2026-08-15'
export const END_DAY = '2026-09-15'

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

/** Every day of the challenge, in order. Aug 15 → Sep 15 inclusive = 32 days. */
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

// ---------------------------------------------------------------- scoring

export type Tier = {
  key: string
  label: string
  blurb: string
  min: number
  points: number
  emoji: string
}

/** Base tiers, highest first. Bonuses stack on top of these. */
export const TIERS: Tier[] = [
  { key: 'huge', label: 'Huge day', blurb: '20,000+', min: 20000, points: 20, emoji: '🚀' },
  { key: 'big', label: 'Big day', blurb: '12,000+', min: 12000, points: 15, emoji: '🔥' },
  { key: 'great', label: 'Nailed it', blurb: '8,000+', min: 8000, points: 10, emoji: '💪' },
  { key: 'solid', label: 'Solid day', blurb: '5,000–7,999', min: 5000, points: 7, emoji: '👏' },
  { key: 'something', label: 'Something', blurb: '3,000–4,999', min: 3000, points: 4, emoji: '🙂' },
  { key: 'none', label: 'Rest day', blurb: 'Under 3,000', min: 0, points: 0, emoji: '😴' },
]

export const MAX_DAILY_POINTS = 20

/**
 * 8k+ = 10, 5k+ = 7, 3k+ = 4, else 0.
 * +5 at 12,000 (big day) and another +5 at 20,000 (huge day),
 * so 20k lands on 20 points.
 */
export function pointsFor(steps: number): number {
  if (!Number.isFinite(steps) || steps <= 0) return 0
  let p = steps >= 8000 ? 10 : steps >= 5000 ? 7 : steps >= 3000 ? 4 : 0
  if (steps >= 12000) p += 5
  if (steps >= 20000) p += 5
  return p
}

export function tierFor(steps: number): Tier {
  return TIERS.find((t) => steps >= t.min) ?? TIERS[TIERS.length - 1]
}

/** How many more steps to reach the next scoring tier, or null at the top. */
export function nextTier(steps: number): { steps: number; points: number } | null {
  const ladder = [3000, 5000, 8000, 12000, 20000]
  const next = ladder.find((n) => steps < n)
  if (next === undefined) return null
  return { steps: next - steps, points: pointsFor(next) - pointsFor(steps) }
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
