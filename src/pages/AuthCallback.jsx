import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigBanner } from '../components/ConfigBanner'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Checking your confirmation link...')

  useEffect(() => {
    let isActive = true

    const finishAuth = async () => {
      if (!supabase) {
        if (isActive) setStatus('Supabase is not configured.')
        navigate('/login', { replace: true })
        return
      }

      const url = new URL(window.location.href)
      const redirectTo = url.searchParams.get('next') || '/app'
      const code = url.searchParams.get('code')

      if (!code) {
        setStatus('Missing confirmation code.')
        navigate('/login?verified=0', { replace: true })
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!isActive) return

      if (error) {
        setStatus(error.message)
        navigate('/login?verified=0', { replace: true })
        return
      }

      navigate(redirectTo, { replace: true })
    }

    finishAuth()

    return () => {
      isActive = false
    }
  }, [navigate])

  return (
    <div className="auth-shell">
      <ConfigBanner />
      <header>
        <nav>
          <Logo />
        </nav>
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <span className="eyebrow">Confirming account</span>
          <h1>Finishing sign up.</h1>
          <p>{status}</p>
        </div>
      </main>
    </div>
  )
}