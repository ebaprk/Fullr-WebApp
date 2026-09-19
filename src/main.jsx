import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, Bell, Check, ChevronDown, Clock3, Heart, Leaf, MapPin,
  Minus, Plus, Search, ShoppingBag, Sparkles, Star, X
} from 'lucide-react'
import './styles.css'

const deals = [
  {
    id: 1,
    shop: 'Mabel’s Bakery',
    item: 'Sunset pastry box',
    desc: 'A surprise mix of croissants, danishes & today’s sweet bakes.',
    price: 5.99,
    original: 18,
    rating: 4.9,
    reviews: 128,
    distance: '0.3 mi',
    time: '5:30–6:30 PM',
    left: 3,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    color: '#d9a95a'
  },
  {
    id: 2,
    shop: 'Green Room Café',
    item: 'Lunch rescue bag',
    desc: 'Fresh sandwiches, seasonal salad & a house-made treat.',
    price: 6.49,
    original: 19,
    rating: 4.8,
    reviews: 94,
    distance: '0.5 mi',
    time: '4:00–5:00 PM',
    left: 5,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85',
    color: '#63743d'
  },
  {
    id: 3,
    shop: 'Nonna Lina’s',
    item: 'Pasta night bundle',
    desc: 'Chef’s choice pasta, garlic knots & a side salad.',
    price: 8.99,
    original: 26,
    rating: 4.7,
    reviews: 211,
    distance: '0.8 mi',
    time: '8:30–9:15 PM',
    left: 2,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
    color: '#b65338'
  },
  {
    id: 4,
    shop: 'Daybreak Bagels',
    item: 'Baker’s dozen-ish',
    desc: 'A generous mixed bag of today’s hand-rolled bagels.',
    price: 4.99,
    original: 16,
    rating: 4.9,
    reviews: 76,
    distance: '1.1 mi',
    time: '2:30–3:30 PM',
    left: 7,
    category: 'Bakery',
    image: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=900&q=85',
    color: '#ab722d'
  },
  {
    id: 5,
    shop: 'Harvest Market',
    item: 'Produce pick-up',
    desc: 'A colorful box of ripe fruit and vegetables ready to enjoy.',
    price: 7.49,
    original: 22,
    rating: 4.6,
    reviews: 53,
    distance: '1.4 mi',
    time: '7:00–8:00 PM',
    left: 4,
    category: 'Groceries',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=85',
    color: '#788642'
  },
  {
    id: 6,
    shop: 'Sakura Kitchen',
    item: 'Chef’s sushi selection',
    desc: 'Fresh rolls and nigiri selected by the chef at closing time.',
    price: 9.99,
    original: 30,
    rating: 4.8,
    reviews: 167,
    distance: '1.7 mi',
    time: '9:00–9:30 PM',
    left: 2,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85',
    color: '#46592d'
  }
]

const categories = ['All finds', 'Meals', 'Bakery', 'Groceries']

function Logo({ light = false }) {
  return <div className={`logo ${light ? 'light' : ''}`}><span>fullr</span><Leaf size={19} strokeWidth={2.4} /></div>
}

function DealCard({ deal, favorite, onFavorite, onReserve }) {
  const savings = Math.round((1 - deal.price / deal.original) * 100)
  return (
    <article className="deal-card">
      <div className="deal-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 48%, rgba(18,35,17,.42)), url(${deal.image})` }}>
        <span className="save-pill">Save {savings}%</span>
        <button className={`heart-btn ${favorite ? 'active' : ''}`} onClick={() => onFavorite(deal.id)} aria-label="Save deal">
          <Heart size={19} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <span className="left-pill"><Sparkles size={13} /> {deal.left} left</span>
      </div>
      <div className="deal-body">
        <div className="shop-row"><span>{deal.shop}</span><span><Star size={14} fill="#ad8820" /> {deal.rating}</span></div>
        <h3>{deal.item}</h3>
        <p>{deal.desc}</p>
        <div className="meta-row"><span><MapPin size={15} />{deal.distance}</span><span><Clock3 size={15} />{deal.time}</span></div>
        <div className="price-row">
          <div><strong>${deal.price.toFixed(2)}</strong><s>${deal.original.toFixed(2)}</s></div>
          <button onClick={() => onReserve(deal)}>Reserve <ArrowRight size={15} /></button>
        </div>
      </div>
    </article>
  )
}

function ReserveModal({ deal, onClose, onConfirm }) {
  const [qty, setQty] = useState(1)
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
            <p>Show your pickup code at {deal.shop} between {deal.time}.</p>
            <div className="pickup-code"><small>Pickup code</small><strong>FULLR-482</strong></div>
            <button className="primary-wide" onClick={onClose}>Back to exploring</button>
          </div>
        ) : (
          <>
            <div className="modal-image" style={{ backgroundImage: `url(${deal.image})` }} />
            <div className="modal-copy">
              <span className="eyebrow">Reserve your find</span>
              <h2>{deal.item}</h2>
              <p className="modal-shop">{deal.shop} · {deal.distance} away</p>
              <div className="pickup-note"><Clock3 size={18} /><div><small>Pickup today</small><strong>{deal.time}</strong></div></div>
              <div className="quantity-row"><span>Quantity</span><div><button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16}/></button><strong>{qty}</strong><button onClick={() => setQty(Math.min(deal.left, qty + 1))}><Plus size={16}/></button></div></div>
              <div className="total-row"><span>Total</span><strong>${(deal.price * qty).toFixed(2)}</strong></div>
              <button className="primary-wide" onClick={confirm}>Reserve for pickup <ArrowRight size={17}/></button>
              <p className="fine-print">No charge until pickup · Cancel anytime before the window</p>
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

  const filtered = useMemo(() => deals.filter(d =>
    (category === 'All finds' || d.category === category) &&
    `${d.shop} ${d.item} ${d.desc}`.toLowerCase().includes(query.toLowerCase())
  ), [category, query])

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
          {filtered.length ? <div className="deals-grid">{filtered.map(deal => <DealCard key={deal.id} deal={deal} favorite={favorites.has(deal.id)} onFavorite={toggleFavorite} onReserve={setSelectedDeal}/>)}</div> : <div className="empty-state"><Search size={28}/><h3>No finds match that yet</h3><p>Try another search or category.</p></div>}
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
