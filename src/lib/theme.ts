import { useEffect, useState } from 'react'
import type { Tier } from './challenge'
import type { Participant } from './participants'

export type Mode = 'light' | 'dark'
type Pref = Mode | 'system'

const PREF_KEY = 'step-squad.theme'

function systemMode(): Mode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readPref(): Pref {
  const v = localStorage.getItem(PREF_KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function useTheme() {
  const [pref, setPref] = useState<Pref>(readPref)
  const [mode, setMode] = useState<Mode>(() => (readPref() === 'system' ? systemMode() : (readPref() as Mode)))

  useEffect(() => {
    const root = document.documentElement
    if (pref === 'system') {
      root.removeAttribute('data-theme')
      localStorage.removeItem(PREF_KEY)
      setMode(systemMode())
    } else {
      root.setAttribute('data-theme', pref)
      localStorage.setItem(PREF_KEY, pref)
      setMode(pref)
    }
  }, [pref])

  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode(systemMode())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  return { mode, pref, cycle: () => setPref(mode === 'dark' ? 'light' : 'dark') }
}

/** A participant's hue, stepped for the surface it's being drawn on. */
export function colorOf(p: Participant, mode: Mode): string {
  return mode === 'dark' ? p.dark : p.light
}

/** Each scoring tier gets its own token — accent for the top tier, gold and
 *  good stepping down, muted for a rest day — so a tier reads as a color, not
 *  just a number, everywhere it shows up (chips, feedback, the rules list). */
export function tierColor(tier: Tier): string {
  switch (tier.key) {
    case 'big':
      return 'var(--accent)'
    case 'great':
      return 'var(--gold)'
    case 'solid':
      return 'var(--good)'
    default:
      return 'var(--ink-muted)'
  }
}
