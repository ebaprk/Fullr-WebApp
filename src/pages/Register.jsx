import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '../components/Logo'
import { ConfigBanner } from '../components/ConfigBanner'
import { useAuth } from '../context/AuthContext'

const categories = ['Bakery', 'Café', 'Restaurant', 'Grocery', 'Other']

export function Register() {
  const { configured, session, signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    category: 'Café',
    address: '',
    city: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Navigate to="/app" replace />

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setInfo('')
    if (!configured) {
      setError('Supabase is not configured yet.')
      return
    }
    setSubmitting(true)
    const { data, error: signUpError } = await signUp(form.email, form.password, form)
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (!data.session) {
      setInfo('Account created. Check your email to confirm, then log in.')
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
          <Link to="/login" className="ghost-link">Log in</Link>
        </nav>
      </header>
      <main className="auth-main">
        <form className="auth-card wide" onSubmit={onSubmit}>
          <span className="eyebrow">Become a partner</span>
          <h1>Register your business.</h1>
          <p>Create an account so you can post live food offers that students see in the iOS app.</p>
          <div className="form-grid">
            <label>
              Business name
              <input value={form.name} onChange={update('name')} required />
            </label>
            <label>
              Category
              <select value={form.category} onChange={update('category')}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" value={form.password} onChange={update('password')} required minLength={6} autoComplete="new-password" />
            </label>
            <label>
              Address
              <input value={form.address} onChange={update('address')} placeholder="123 College Ave" />
            </label>
            <label>
              City
              <input value={form.city} onChange={update('city')} placeholder="Campus town" />
            </label>
            <label className="span-2">
              Phone
              <input value={form.phone} onChange={update('phone')} placeholder="Optional" />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}
          <button className="primary-wide" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} />
          </button>
          <p className="auth-switch">Already a partner? <Link to="/login">Log in</Link></p>
        </form>
      </main>
    </div>
  )
}
