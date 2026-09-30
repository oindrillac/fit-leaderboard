import { useCallback, useEffect, useMemo, useState } from 'react'
import { ALL_DAYS, msUntilNextDay, pointsFor } from './lib/challenge'
import { PARTICIPANTS, participant, type Participant } from './lib/participants'
import { buildStandings } from './lib/stats'
import { useStore } from './lib/store'
import { useTheme } from './lib/theme'
import Avatar from './components/Avatar'
import Confetti from './components/Confetti'
import PointsRules from './components/PointsRules'
import RulesSheet from './components/RulesSheet'
import StepSheet from './components/StepSheet'
import Board from './views/Board'
import Bulk from './views/Bulk'
import Today from './views/Today'
import Trends from './views/Trends'

const ME_KEY = 'step-squad.me'

const TABS = [
  { key: 'today', label: 'Today', icon: '👟' },
  { key: 'board', label: 'Board', icon: '🏆' },
  { key: 'trends', label: 'Trends', icon: '📈' },
  { key: 'bulk', label: 'Enter', icon: '⚡' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function App() {
  const store = useStore()
  const { mode, cycle } = useTheme()
  const [tab, setTab] = useState<TabKey>('today')
  const [me, setMe] = useState<number | null>(() => {
    const v = Number(localStorage.getItem(ME_KEY))
    return PARTICIPANTS.some((p) => p.id === v) ? v : null
  })
  const [sheet, setSheet] = useState<{ p: Participant; day: string } | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [burst, setBurst] = useState(0)
  const [, setTick] = useState(0)

  // Roll the app over to the new day at midnight IST without a manual refresh.
  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), msUntilNextDay() + 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const standings = useMemo(
    () => buildStandings(store.entries, undefined, { champion: true }),
    [store.entries],
  )

  const pickMe = useCallback((id: number) => {
    localStorage.setItem(ME_KEY, String(id))
    setMe(id)
  }, [])

  const openSheet = useCallback((p: Participant, day: string) => setSheet({ p, day }), [])

  const onSaved = useCallback((steps: number) => {
    const pts = pointsFor(steps)
    setSheet(null)
    setToast(pts > 0 ? `+${pts} points ${pts >= 15 ? '🚀' : pts >= 10 ? '🔥' : '👏'}` : 'Logged ✓')
    if (steps >= 12000) setBurst((n) => n + 1)
  }, [])

  if (me === null) return <NamePicker onPick={pickMe} mode={mode} />

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center gap-2.5 pt-1">
        <h1
          className="flex-1 text-[19px] font-extrabold tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--accent), var(--gold))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Step Squad <span aria-hidden="true" style={{ WebkitTextFillColor: 'initial' }}>👟</span>
        </h1>
        <button
          onClick={() => setShowRules(true)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-bold"
          style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}
        >
          <span aria-hidden="true">ℹ️</span> Points
        </button>
        <button
          onClick={cycle}
          className="grid h-9 w-9 place-items-center rounded-full border text-[15px] hairline"
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem(ME_KEY)
            setMe(null)
          }}
          className="flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 hairline"
          aria-label="Change who you are"
        >
          <Avatar p={participant(me)} mode={mode} size={26} />
          <span className="text-[12.5px] font-semibold">{participant(me).name}</span>
        </button>
      </header>

      {store.mode === 'local' && (
        <p className="mb-3 rounded-2xl border border-dashed px-3.5 py-2.5 text-[12.5px] text-ink-2 hairline">
          <b>This device only.</b> Add your Supabase keys to share one live database across
          everyone's phones — see <code>SETUP.md</code>.
        </p>
      )}

      {store.error && (
        <p role="alert" className="mb-3 rounded-2xl px-3.5 py-2.5 text-[12.5px]" style={{ background: 'var(--accent-soft)' }}>
          {store.error}
        </p>
      )}

      <main>
        {!store.ready ? (
          <div className="card grid h-48 place-items-center text-[13px] text-muted">Loading…</div>
        ) : tab === 'today' ? (
          <Today
            entries={store.entries}
            standings={standings}
            mode={mode}
            me={me}
            openSheet={openSheet}
          />
        ) : tab === 'board' ? (
          <Board entries={store.entries} mode={mode} me={me} />
        ) : tab === 'trends' ? (
          <Trends entries={store.entries} standings={standings} mode={mode} />
        ) : (
          <Bulk entries={store.entries} store={store} mode={mode} />
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl hairline"
        style={{ background: 'color-mix(in oklab, var(--surface) 88%, transparent)' }}
        aria-label="Sections"
      >
        <ul className="mx-auto flex max-w-[520px] pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {TABS.map((t) => (
            <li key={t.key} className="flex-1">
              <button
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
                className="mx-1.5 flex w-[calc(100%-0.75rem)] flex-col items-center gap-0.5 rounded-xl py-1.5 transition"
                style={
                  tab === t.key
                    ? { color: 'var(--accent)', background: 'var(--accent-soft)' }
                    : { color: 'var(--ink-muted)' }
                }
              >
                <span className="text-[19px] leading-none" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="text-[10.5px] font-semibold">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {showRules && <RulesSheet onClose={() => setShowRules(false)} />}

      {sheet && (
        <StepSheet
          p={sheet.p}
          day={sheet.day}
          entry={store.entries.get(`${sheet.p.id}:${sheet.day}`)}
          store={store}
          mode={mode}
          onClose={() => setSheet(null)}
          onSaved={onSaved}
        />
      )}

      {toast && (
        <div
          role="status"
          className="animate-pop fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
        >
          <span
            className="rounded-full px-4 py-2.5 text-[14px] font-bold shadow-lg"
            style={{ background: 'var(--ink)', color: 'var(--surface)' }}
          >
            {toast}
          </span>
        </div>
      )}

      <Confetti burst={burst} />
    </div>
  )
}

function NamePicker({ onPick, mode }: { onPick: (id: number) => void; mode: 'light' | 'dark' }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-6 py-10">
      <div className="animate-pop">
        <p className="text-5xl" aria-hidden="true">
          👟
        </p>
        <h1
          className="mt-3 text-[34px] font-extrabold leading-tight tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(90deg, var(--accent), var(--gold))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Step Squad
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-2">
          {ALL_DAYS.length} days, {PARTICIPANTS.length} of us, one leaderboard. Oct 1 → Dec 29.
        </p>
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted">
          Who are you?
        </p>
        <ul className="mt-3 space-y-2">
          {PARTICIPANTS.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onPick(p.id)}
                className="card flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.98]"
              >
                <Avatar p={p} mode={mode} size={38} />
                <span className="text-[15px] font-semibold">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-[12px] text-muted">
          Just so we know whose row to highlight. You can log for anyone.
        </p>

        <div className="card mt-6 p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-[14px] font-bold">
            <span aria-hidden="true">🏆</span> How points work
          </h2>
          <PointsRules />
        </div>
      </div>
    </div>
  )
}
