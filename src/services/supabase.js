// Services and authentication must share one client so they also share the
// signed-in session and the same configuration checks.
export { isSupabaseConfigured, supabase } from '../lib/supabase'
