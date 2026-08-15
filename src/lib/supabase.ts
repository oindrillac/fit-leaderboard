import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Null until the two env vars are set. Everything still works without them —
 * the store falls back to this-device-only storage so the app is usable
 * immediately and gains the shared database the moment you paste the keys in.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null

export const SCREENSHOT_BUCKET = 'screenshots'
