import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '../components/Logo'
import { ConfigBanner } from '../components/ConfigBanner'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { configured, session, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/app" replace />

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!configured) {
      setError('Supabase is not configured yet.')
      return
    }
    setSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate('/app')
  }

  return (
    <div className="auth-shell">
      <ConfigBanner />
      <header>
        <nav>
          <Logo />
          <Link to="/register" className="nav-cta">Create account</Link>
        </nav>
      </header>
      <main className="auth-main">
        <form className="auth-card" onSubmit={onSubmit}>
          <span className="eyebrow">Business login</span>
          <h1>Welcome back.</h1>
          <p>Log in to post live offers for the Fullr iOS app.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-wide" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'} <ArrowRight size={17} />
          </button>
          <p className="auth-switch">New here? <Link to="/register">Register your business</Link></p>
        </form>
      </main>
    </div>
  )
}
