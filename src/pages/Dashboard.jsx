import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clock3, Leaf, MapPin, Plus, Trash2 } from 'lucide-react'
import { DashNav } from '../components/DashNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const emptyOffer = {
  name: '',
  description: '',
  price: '',
  startTime: '',
  endTime: ''
}

function formatDateTime(value, fallback) {
  if (!value) return fallback
  const options = { hour: 'numeric', minute: '2-digit' }
  return new Date(value).toLocaleString([], options)
}

export function Dashboard() {
  const { store, refreshStore } = useAuth()
  const [offers, setOffers] = useState([])
  const [form, setForm] = useState(emptyOffer)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(true)

  const loadOffers = async () => {
    if (!store?.id) {
      setOffers([])
      setLoadingOffers(false)
      return
    }
    setLoadingOffers(true)
    const { data, error: loadError } = await supabase
      .from('Offers')
      .select('*')
      .eq('store_id', store.id)
      .order('posted_time', { ascending: false })
    if (loadError) setError(loadError.message)
    else setOffers(data ?? [])
    setLoadingOffers(false)
  }

  useEffect(() => {
    loadOffers()
  }, [store?.id])

  const liveCount = useMemo(() => offers.filter((offer) => !offer.offer_completed).length, [offers])

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  const onCreate = async (event) => {
    event.preventDefault()
    setError('')
    if (!store?.id) {
      setError('Your store profile is still loading. Please try again in a moment.')
      return
    }
    const price = Number.parseFloat(form.price)
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a valid price of zero or more.')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('Offers').insert({
      store_id: store.id,
      offer_name: form.name.trim(),
      offer_description: form.description.trim(),
      offer_price: price.toFixed(2),
      offer_start_time: form.startTime ? new Date(form.startTime).toISOString() : null,
      offer_end_time: form.endTime ? new Date(form.endTime).toISOString() : null,
      posted_time: new Date().toISOString(),
      offer_completed: false,
      views: 0
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setForm(emptyOffer)
    await loadOffers()
    await refreshStore()
  }

  const toggleActive = async (offer) => {
    const { error: updateError } = await supabase
      .from('Offers')
      .update({ offer_completed: !offer.offer_completed })
      .eq('offer_id', offer.offer_id)
    if (updateError) setError(updateError.message)
    await loadOffers()
  }

  const removeOffer = async (offer) => {
    const { error: deleteError } = await supabase
      .from('Offers')
      .delete()
      .eq('offer_id', offer.offer_id)
    if (deleteError) setError(deleteError.message)
    await loadOffers()
  }

  return (
    <div className="dash-shell">
      <DashNav />

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
              Offer name
              <input value={form.name} onChange={update('name')} placeholder="Sunset pastry box" required />
            </label>
            <label>
              Description
              <textarea value={form.description} onChange={update('description')} rows={3} placeholder="A mix of today’s leftover bakes." required />
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={update('price')} placeholder="4.50" required />
            </label>
            <div className="form-grid">
              <label>
                Offer starts
                <input type="datetime-local" value={form.startTime} onChange={update('startTime')} required />
              </label>
              <label>
                Offer ends
                <input type="datetime-local" value={form.endTime} onChange={update('endTime')} required />
              </label>
            </div>
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
                <p>Post your first leftover offer to go live in the iOS app.</p>
              </div>
            ) : (
              <div className="dash-offers">
                {offers.map((offer) => (
                  <article key={offer.offer_id} className="deal-card">
                    <div
                      className="deal-image"
                      style={{
                        backgroundImage: store?.image
                          ? `linear-gradient(180deg, transparent 48%, rgba(18,35,17,.42)), url(${store.image})`
                          : 'linear-gradient(180deg, #d9c27a, #63743d)'
                      }}
                    >
                      <span className={`save-pill ${offer.offer_completed ? 'paused' : ''}`}>
                        {offer.offer_completed ? 'Completed' : 'Live'}
                      </span>
                      <span className="left-pill">{offer.views ?? 0} views</span>
                    </div>
                    <div className="deal-body">
                      <div className="shop-row">
                        <span>Posted {formatDateTime(offer.posted_time, 'recently')}</span>
                      </div>
                      <h3>{offer.offer_name || 'Food offer'}</h3>
                      <p>{offer.offer_description || (offer.offer_completed ? 'This offer is complete.' : 'Available for pickup.')}</p>
                      <div className="meta-row">
                        <span><Clock3 size={15} />Starts {formatDateTime(offer.offer_start_time, 'TBA')}</span>
                        <span><Clock3 size={15} />{formatDateTime(offer.offer_end_time, 'End time TBA')}</span>
                        <span><MapPin size={15} />{store?.address || 'Pickup at your shop'}</span>
                      </div>
                      <div className="price-row">
                        <strong>{offer.offer_price == null ? 'Price unavailable' : `$${Number(offer.offer_price).toFixed(2)}`}</strong>
                        <button type="button" onClick={() => toggleActive(offer)}>
                          {offer.offer_completed ? 'Reopen' : 'Mark complete'}
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
