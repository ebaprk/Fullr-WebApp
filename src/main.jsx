import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, Bell, Check, ChevronDown, Clock3, Heart, Leaf, MapPin,
  Search, ShoppingBag, Sparkles, X
} from 'lucide-react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import './styles.css'
import { getAvailableOffers } from './services/offers'

const categories = ['All finds', 'Pantry', 'Business', 'Campus', 'Restaurant']

const defaultOfferImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85'

function formatOfferEndTime(end) {
  if (!end) return 'End time TBA'
  return `Ends ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(end))}`
}

function toDisplayOffer(offer) {
  const store = offer.store ?? {}
  return {
    id: offer.offer_id,
    shop: store.name ?? 'Local partner',
    item: offer.offer_description ?? 'Surprise food offer',
    desc: store.description ?? 'A surplus-food offer ready for pickup.',
    address: store.address ?? 'Address available at pickup',
    time: formatOfferEndTime(offer.offer_end_time),
    views: Number(offer.views ?? 0),
    category: store.store_type ?? 'Business',
    image: store.image || defaultOfferImage
  }
}

function Logo({ light = false }) {
  return <div className={`logo ${light ? 'light' : ''}`}><span>fullr</span><Leaf size={19} strokeWidth={2.4} /></div>
}

function DealCard({ deal, favorite, onFavorite, onReserve }) {
  return (
    <article className="deal-card">
      <div className="deal-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 48%, rgba(18,35,17,.42)), url(${deal.image})` }}>
        <span className="save-pill">{deal.category}</span>
        <button className={`heart-btn ${favorite ? 'active' : ''}`} onClick={() => onFavorite(deal.id)} aria-label="Save deal">
          <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <span className="left-pill"><Sparkles size={13} /> {deal.views} views</span>
      </div>
      <div className="deal-body">
        <div className="shop-row"><span>{deal.shop}</span></div>
        <h3>{deal.item}</h3>
        <p>{deal.desc}</p>
        <div className="meta-row"><span><MapPin size={15} />{deal.address}</span><span><Clock3 size={15} />{deal.time}</span></div>
        <div className="price-row">
          <div><strong>Available now</strong></div>
          <button onClick={() => onReserve(deal)}>Reserve <ArrowRight size={15} /></button>
        </div>
      </div>
    </article>
  )
}

function ReserveModal({ deal, onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false)
  if (!deal) return null
  const confirm = () => { setConfirmed(true); onConfirm() }
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose}><X size={19} /></button>
        {confirmed ? (
          <div className="success-state">
            <div className="success-icon"><Check size={32} /></div>
            <span className="eyebrow">You rescued a meal</span>
            <h2>Nice one. It’s yours!</h2>
            <p>Your offer is reserved at {deal.shop}. {deal.time}.</p>
            <div className="pickup-code"><small>Pickup code</small><strong>FULLR-482</strong></div>
            <button className="primary-wide" onClick={onClose}>Back to exploring</button>
          </div>
        ) : (
          <>
            <div className="modal-image" style={{ backgroundImage: `url(${deal.image})` }} />
            <div className="modal-copy">
              <span className="eyebrow">Reserve your find</span>
              <h2>{deal.item}</h2>
              <p className="modal-shop">{deal.shop} · {deal.address}</p>
              <div className="pickup-note"><Clock3 size={18} /><div><small>Offer availability</small><strong>{deal.time}</strong></div></div>
              <button className="primary-wide" onClick={confirm}>Reserve for pickup <ArrowRight size={17}/></button>
              <p className="fine-print">Confirm your pickup details with the store.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  const [category, setCategory] = useState('All finds')
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState(new Set())
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [toast, setToast] = useState('')
  const [location, setLocation] = useState('Near Campus')
  const [offers, setOffers] = useState([])
  const [offersError, setOffersError] = useState('')
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)

  useEffect(() => {
    let isMounted = true

    getAvailableOffers()
      .then(data => { if (isMounted) setOffers(data.map(toDisplayOffer)) })
      .catch(error => { if (isMounted) setOffersError(error.message) })
      .finally(() => { if (isMounted) setIsLoadingOffers(false) })

    return () => { isMounted = false }
  }, [])

  const filtered = useMemo(() => offers.filter(d =>
    (category === 'All finds' || d.category === category) &&
    `${d.shop} ${d.item} ${d.desc}`.toLowerCase().includes(query.toLowerCase())
  ), [category, offers, query])

  const toggleFavorite = id => setFavorites(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const confirm = () => { setToast('Reservation added to your pickups'); setTimeout(() => setToast(''), 3200) }

  return (
    <div className="app-shell">
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
      <header>
        <nav>
          <Logo />
          <div className="nav-links"><a href="#finds">Find food</a><a href="#how">How it works</a><a href="#impact">Our impact</a></div>
          <div className="nav-actions"><button className="location-btn" onClick={() => setLocation(location === 'Near Campus' ? 'Downtown' : 'Near Campus')}><MapPin size={16}/>{location}<ChevronDown size={14}/></button><button className="icon-button"><Bell size={18}/><i /></button><button className="avatar">DS</button></div>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-blob blob-one"/><div className="hero-blob blob-two"/>
          <div className="hero-content">
            <span className="hero-kicker"><Leaf size={15}/> Good food deserves a second chance</span>
            <h1>Eat well.<br/><em>Waste less.</em></h1>
            <p>Rescue delicious food from local spots for a fraction of the price. Your wallet—and the planet—will thank you.</p>
            <div className="search-bar"><Search size={21}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search food, cafés, or cravings"/><button onClick={() => document.getElementById('finds').scrollIntoView({behavior:'smooth'})}>Find food <ArrowRight size={17}/></button></div>
            <div className="hero-proof"><div className="face-stack"><span>🍜</span><span>🥐</span><span>🥗</span></div><p><strong>2,400+ students</strong><br/>rescuing food this week</p></div>
          </div>
          <div className="hero-art" aria-label="Fresh food from a local restaurant">
            <div className="hero-photo" />
            <div className="floating-card fc-top"><div className="mini-icon"><Leaf size={18}/></div><div><strong>1,240 lbs</strong><small>food saved this month</small></div></div>
            <div className="floating-card fc-bottom"><span className="tiny-badge">Tonight</span><strong>Local dinner finds</strong><small>from $4.99 near you</small></div>
          </div>
        </section>

        <section className="stats-strip" id="impact">
          <div><strong>72%</strong><span>average savings</span></div><i/><div><strong>18k</strong><span>meals rescued</span></div><i/><div><strong>9.2t</strong><span>CO₂ avoided</span></div><i/><div><strong>84</strong><span>local partners</span></div>
        </section>

        <section className="finds-section" id="finds">
          <div className="section-heading"><div><span className="eyebrow">Available near you</span><h2>Today’s best finds</h2></div><button className="text-btn">See all 42 finds <ArrowRight size={17}/></button></div>
          <div className="filter-row">
            <div className="categories">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>
            <button className="sort-btn">Pickup: Anytime <ChevronDown size={15}/></button>
          </div>
          {isLoadingOffers ? <div className="empty-state"><Search size={28}/><h3>Loading offers…</h3></div> : offersError ? <div className="empty-state"><Search size={28}/><h3>Offers are unavailable</h3><p>{offersError}</p></div> : filtered.length ? <div className="deals-grid">{filtered.map(deal => <DealCard key={deal.id} deal={deal} favorite={favorites.has(deal.id)} onFavorite={toggleFavorite} onReserve={setSelectedDeal}/>)}</div> : <div className="empty-state"><Search size={28}/><h3>No finds match that yet</h3><p>Try another search or category.</p></div>}
        </section>

        <section className="how-section" id="how">
          <div className="how-intro"><span className="eyebrow">Three easy steps</span><h2>Save food without<br/>the extra effort.</h2><p>Less waste, more taste. Fullr makes every pickup feel good.</p></div>
          <div className="steps">
            <div className="step"><span>01</span><div className="step-icon"><Search/></div><h3>Discover</h3><p>Browse surprise bags from great local spots nearby.</p></div>
            <div className="step"><span>02</span><div className="step-icon"><ShoppingBag/></div><h3>Reserve</h3><p>Claim your favorite find in a few quick taps.</p></div>
            <div className="step"><span>03</span><div className="step-icon"><MapPin/></div><h3>Pick up</h3><p>Stop by in the pickup window and enjoy your rescue.</p></div>
          </div>
        </section>

        <section className="partner-cta">
          <div><span className="eyebrow">For local businesses</span><h2>Turn surplus into<br/>something good.</h2><p>Reach new customers, recover costs, and keep great food out of the bin.</p><button>Become a partner <ArrowRight size={17}/></button></div>
          <div className="partner-visual"><div className="impact-card"><Leaf size={23}/><small>Your weekly impact</small><strong>86 meals saved</strong><span>That’s 172 lbs of food!</span></div></div>
        </section>
      </main>

      <footer><div><Logo light/><p>Good food. Fuller lives. Less waste.</p></div><div className="footer-links"><a href="#finds">Find food</a><a href="#how">How it works</a><a href="#">For businesses</a><a href="#">About us</a></div><small>© 2026 Fullr, Inc. Made with care for our planet.</small></footer>
      <ReserveModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} onConfirm={confirm}/>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
