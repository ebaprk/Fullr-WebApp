import React from 'react'
import { useAuth } from '../context/AuthContext'

export function ConfigBanner() {
  const { configured } = useAuth()
  if (configured) return null

  return (
    <div className="config-banner">
      Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file, then restart the dev server.
    </div>
  )
}
