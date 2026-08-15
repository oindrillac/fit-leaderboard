import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SCREENSHOT_BUCKET, supabase } from './supabase'
import { blobToDataUrl, compressImage } from './image'

export type Entry = {
  participant_id: number
  day: string
  steps: number
  screenshot_url: string | null
  note: string | null
}

export type EntryDraft = {
  participant_id: number
  day: string
  steps: number
  screenshot_url?: string | null
  note?: string | null
}

const LOCAL_KEY = 'step-squad.entries.v1'
const LOCAL_EVENT = 'step-squad:changed'

export const key = (participantId: number, day: string) => `${participantId}:${day}`

// ------------------------------------------------------------- local backend

function readLocal(): Entry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Entry[]) : []
  } catch {
    return []
  }
}

function writeLocal(entries: Entry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries))
  window.dispatchEvent(new Event(LOCAL_EVENT))
}

// ------------------------------------------------------------------ backends

type Backend = {
  mode: 'shared' | 'local'
  list(): Promise<Entry[]>
  upsert(drafts: EntryDraft[]): Promise<void>
  remove(participantId: number, day: string): Promise<void>
  upload(file: File, participantId: number, day: string): Promise<string>
  subscribe(onChange: () => void): () => void
}

const localBackend: Backend = {
  mode: 'local',
  async list() {
    return readLocal()
  },
  async upsert(drafts) {
    const rows = readLocal()
    for (const d of drafts) {
      const i = rows.findIndex((r) => r.participant_id === d.participant_id && r.day === d.day)
      const merged: Entry = {
        participant_id: d.participant_id,
        day: d.day,
        steps: d.steps,
        screenshot_url: d.screenshot_url ?? (i >= 0 ? rows[i].screenshot_url : null),
        note: d.note ?? (i >= 0 ? rows[i].note : null),
      }
      if (i >= 0) rows[i] = merged
      else rows.push(merged)
    }
    writeLocal(rows)
  },
  async remove(participantId, day) {
    writeLocal(readLocal().filter((r) => !(r.participant_id === participantId && r.day === day)))
  },
  async upload(file) {
    return blobToDataUrl(await compressImage(file))
  },
  subscribe(onChange) {
    window.addEventListener(LOCAL_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(LOCAL_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  },
}

const remoteBackend: Backend = {
  mode: 'shared',
  async list() {
    const { data, error } = await supabase!
      .from('entries')
      .select('participant_id, day, steps, screenshot_url, note')
    if (error) throw error
    return (data ?? []) as Entry[]
  },
  async upsert(drafts) {
    const { error } = await supabase!
      .from('entries')
      .upsert(
        drafts.map((d) => ({
          participant_id: d.participant_id,
          day: d.day,
          steps: d.steps,
          ...(d.screenshot_url !== undefined ? { screenshot_url: d.screenshot_url } : {}),
          ...(d.note !== undefined ? { note: d.note } : {}),
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'participant_id,day' },
      )
    if (error) throw error
  },
  async remove(participantId, day) {
    const { error } = await supabase!
      .from('entries')
      .delete()
      .eq('participant_id', participantId)
      .eq('day', day)
    if (error) throw error
  },
  async upload(file, participantId, day) {
    const blob = await compressImage(file)
    const path = `${day}/${participantId}-${Date.now()}.jpg`
    const { error } = await supabase!.storage
      .from(SCREENSHOT_BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    return supabase!.storage.from(SCREENSHOT_BUCKET).getPublicUrl(path).data.publicUrl
  },
  subscribe(onChange) {
    const channel = supabase!
      .channel('entries-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, onChange)
      .subscribe()
    return () => {
      void supabase!.removeChannel(channel)
    }
  },
}

export const backend: Backend = supabase ? remoteBackend : localBackend

// --------------------------------------------------------------------- hook

export type Store = {
  entries: Map<string, Entry>
  ready: boolean
  error: string | null
  mode: Backend['mode']
  save: (drafts: EntryDraft[]) => Promise<void>
  remove: (participantId: number, day: string) => Promise<void>
  upload: (file: File, participantId: number, day: string) => Promise<string>
}

export function useStore(): Store {
  const [rows, setRows] = useState<Entry[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const data = await backend.list()
      if (alive.current) {
        setRows(data)
        setError(null)
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Could not reach the database')
    } finally {
      if (alive.current) setReady(true)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    void refresh()
    const unsub = backend.subscribe(() => void refresh())
    // Someone else may have logged while the phone was asleep.
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      alive.current = false
      unsub()
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const save = useCallback(
    async (drafts: EntryDraft[]) => {
      await backend.upsert(drafts)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (participantId: number, day: string) => {
      await backend.remove(participantId, day)
      await refresh()
    },
    [refresh],
  )

  const entries = useMemo(() => {
    const m = new Map<string, Entry>()
    for (const r of rows) m.set(key(r.participant_id, r.day), r)
    return m
  }, [rows])

  return { entries, ready, error, mode: backend.mode, save, remove, upload: backend.upload }
}
