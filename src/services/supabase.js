import { createClient } from '@supabase/supabase-js'

// Replace these defaults or set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// in a local .env file. Never put a service-role key in a Vite application.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const isSupabaseConfigured =
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
