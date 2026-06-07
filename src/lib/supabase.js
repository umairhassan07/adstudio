import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key)
  ? createClient(url, key, { db: { schema: 'adstudio' } })
  : null

// A stable anonymous session ID — persisted in localStorage
export function getSessionId() {
  const stored = localStorage.getItem('adstudio_session')
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem('adstudio_session', id)
  return id
}
