import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock3, Leaf, MapPin, Plus, Trash2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const categories = ['Meals', 'Bakery', 'Groceries', 'Drinks', 'Other']

const emptyOffer = {
  title: '',
  description: '',
  category: 'Meals',
  price: '',
  original_price: '',
  quantity: 1,
  pickup_start: '',
  pickup_end: '',
  image_url: ''
}

function formatWindow(start, end) {
  if (!start && !end) return 'Pickup window not set'
  const options = { hour: 'numeric', minute: '2-digit' }
  const startLabel = start ? new Date(start).toLocaleTimeString([], options) : 'Open'
  const endLabel = end ? new Date(end).toLocaleTimeString([], options) : 'Close'
  return `${startLabel}–${endLabel}`
}

export function Dashboard() {
  const { business, user, signOut, refreshBusiness } = useAuth()
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [form, setForm] = useState(emptyOffer)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(true)

  const loadOffers = async () => {
    if (!user) return
    setLoadingOffers(true)
    const { data, error: loadError } = await supabase
      .from('offers')
      .select('*')
      .eq('business_id', user.id)
      .order('created_at', { ascending: false })
    if (!loadError) setOffers(data ?? [])
    setLoadingOffers(false)
  }

  useEffect(() => {
    loadOffers()
  }, [user])

  const liveCount = useMemo(() => offers.filter((offer) => offer.is_active && offer.quantity > 0).length, [offers])

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const onCreate = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const { error: insertError } = await supabase.from('offers').insert({
      business_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      quantity: Number(form.quantity),
      pickup_start: form.pickup_start ? new Date(form.pickup_start).toISOString() : null,
      pickup_end: form.pickup_end ? new Date(form.pickup_end).toISOString() : null,
      image_url: form.image_url.trim() || null,
      is_active: true
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setForm(emptyOffer)
    await loadOffers()
    await refreshBusiness()
  }

  const toggleActive = async (offer) => {
    await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id)
    await loadOffers()
  }

  const removeOffer = async (offer) => {
    await supabase.from('offers').delete().eq('id', offer.id)
    await loadOffers()
  }

  const logout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="dash-shell">
      <header>
        <nav>
          <Logo to="/app" />
          <div className="nav-actions">
            <span className="business-chip">{business?.name || user?.email}</span>
            <button className="ghost-link" type="button" onClick={logout}>Log out</button>
          </div>
        </nav>
      </header>

      <main className="dash-main">
        <section className="dash-intro">
          <div>
            <span className="eyebrow"><Leaf size={14} /> Business dashboard</span>
            <h1>Post a live offer.</h1>
            <p>Anything you publish here is stored in Supabase and shown to students in the Fullr iOS app.</p>
          </div>
          <div className="dash-stats">
            <div><strong>{liveCount}</strong><span>live now</span></div>
            <div><strong>{offers.length}</strong><span>total offers</span></div>
          </div>
        </section>

        <section className="dash-grid">
          <form className="offer-form" onSubmit={onCreate}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">New listing</span>
                <h2>Tonight’s surplus</h2>
              </div>
            </div>
            <label>
              Offer title
              <input value={form.title} onChange={update('title')} placeholder="Sunset pastry box" required />
            </label>
            <label>
              Description
              <textarea value={form.description} onChange={update('description')} rows={3} placeholder="A surprise mix of today’s leftover bakes." />
            </label>
            <div className="form-grid">
              <label>
                Category
                <select value={form.category} onChange={update('category')}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Quantity
                <input type="number" min="1" value={form.quantity} onChange={update('quantity')} required />
              </label>
              <label>
                Offer price
                <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required />
              </label>
              <label>
                Original price
                <input type="number" min="0" step="0.01" value={form.original_price} onChange={update('original_price')} />
              </label>
              <label>
                Pickup starts
                <input type="datetime-local" value={form.pickup_start} onChange={update('pickup_start')} />
              </label>
              <label>
                Pickup ends
                <input type="datetime-local" value={form.pickup_end} onChange={update('pickup_end')} />
              </label>
            </div>
            <label>
              Image URL
              <input value={form.image_url} onChange={update('image_url')} placeholder="https://…" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-wide" type="submit" disabled={saving}>
              <Plus size={16} /> {saving ? 'Posting…' : 'Post live offer'} <ArrowRight size={17} />
            </button>
          </form>

          <div className="offer-list">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Your offers</span>
                <h2>What students can see</h2>
              </div>
            </div>
            {loadingOffers ? (
              <div className="empty-state"><h3>Loading offers…</h3></div>
            ) : offers.length === 0 ? (
              <div className="empty-state">
                <h3>No offers yet</h3>
                <p>Post your first leftover bag to go live in the iOS app.</p>
              </div>
            ) : (
              <div className="dash-offers">
                {offers.map((offer) => (
                  <article key={offer.id} className="deal-card">
                    <div
                      className="deal-image"
                      style={{
                        backgroundImage: offer.image_url
                          ? `linear-gradient(180deg, transparent 48%, rgba(18,35,17,.42)), url(${offer.image_url})`
                          : 'linear-gradient(180deg, #d9c27a, #63743d)'
                      }}
                    >
                      <span className={`save-pill ${offer.is_active ? '' : 'paused'}`}>
                        {offer.is_active ? 'Live' : 'Paused'}
                      </span>
                      <span className="left-pill">{offer.quantity} left</span>
                    </div>
                    <div className="deal-body">
                      <div className="shop-row">
                        <span>{offer.category}</span>
                        <span>${Number(offer.price).toFixed(2)}</span>
                      </div>
                      <h3>{offer.title}</h3>
                      <p>{offer.description || 'No description yet.'}</p>
                      <div className="meta-row">
                        <span><Clock3 size={15} />{formatWindow(offer.pickup_start, offer.pickup_end)}</span>
                        <span><MapPin size={15} />{business?.city || 'Pickup at your shop'}</span>
                      </div>
                      <div className="price-row">
                        <button type="button" onClick={() => toggleActive(offer)}>
                          {offer.is_active ? 'Pause' : 'Go live'}
                        </button>
                        <button type="button" className="danger-btn" onClick={() => removeOffer(offer)}>
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
