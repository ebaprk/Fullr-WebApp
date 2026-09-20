import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Leaf, MapPin, ShoppingBag, Store, UserCircle2, Users } from 'lucide-react'
import { Logo } from '../components/Logo'
import { ConfigBanner } from '../components/ConfigBanner'
import { useAuth } from '../context/AuthContext'

export function Landing() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const goToAccount = () => {
    navigate(session ? '/app' : '/login')
  }

  return (
    <div className="app-shell">
      <ConfigBanner />
      <header>
        <nav>
          <Logo />
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#impact">Why Fullr</a>
            <a href="#join">For businesses</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="ghost-link">Log in</Link>
            <Link to="/register" className="nav-cta">Become a partner</Link>
            <button type="button" className="avatar profile-button" onClick={goToAccount} aria-label={session ? 'Go to your account' : 'Go to login or sign up'}>
              <UserCircle2 size={20} strokeWidth={1.9} />
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-blob blob-one" />
          <div className="hero-blob blob-two" />
          <div className="hero-content">
            <span className="hero-kicker"><Leaf size={15} /> For local businesses</span>
            <h1>Turn surplus<br /><em>into customers.</em></h1>
            <p>Post live food offers from your shop. Students nearby see them instantly in the Fullr iOS app and pick up before closing time.</p>
            <div className="hero-actions">
              <Link to="/register" className="primary-cta">Register your business <ArrowRight size={17} /></Link>
              <Link to="/login" className="secondary-cta">I already have an account</Link>
            </div>
            <div className="hero-proof">
              <div className="face-stack"><span>🥐</span><span>🥗</span><span>🍜</span></div>
              <p><strong>Built for local kitchens</strong><br />Cafés, bakeries, and restaurants posting tonight’s leftover finds.</p>
            </div>
          </div>
          <div className="hero-art" aria-label="A local kitchen preparing food">
            <div className="hero-photo" />
            <div className="floating-card fc-top">
              <div className="mini-icon"><Store size={18} /></div>
              <div><strong>Live offers</strong><small>reach students instantly</small></div>
            </div>
            <div className="floating-card fc-bottom">
              <span className="tiny-badge">Tonight</span>
              <strong>Post in two minutes</strong>
              <small>description and pickup end time</small>
            </div>
          </div>
        </section>

        <section className="stats-strip" id="impact">
          <div><strong>72%</strong><span>average savings</span></div>
          <i />
          <div><strong>Live</strong><span>offers in the iOS app</span></div>
          <i />
          <div><strong>0</strong><span>waste from unsold food</span></div>
          <i />
          <div><strong>You</strong><span>control every listing</span></div>
        </section>

        <section className="how-section" id="how">
          <div className="how-intro">
            <span className="eyebrow">Three easy steps</span>
            <h2>Get surplus food<br />in front of students.</h2>
            <p>Fullr is the business dashboard. Customers browse and reserve in the iOS app — both sides share the same live offers.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span>01</span>
              <div className="step-icon"><Store /></div>
              <h3>Register</h3>
              <p>Create a business account and tell us who you are.</p>
            </div>
            <div className="step">
              <span>02</span>
              <div className="step-icon"><ShoppingBag /></div>
              <h3>Post an offer</h3>
              <p>Add a description and pickup end time for tonight’s surplus.</p>
            </div>
            <div className="step">
              <span>03</span>
              <div className="step-icon"><Users /></div>
              <h3>Get discovered</h3>
              <p>Students see your offer live in the Fullr iOS app.</p>
            </div>
          </div>
        </section>

        <section className="partner-cta" id="join">
          <div>
            <span className="eyebrow">Ready when you are</span>
            <h2>Start posting<br />live offers today.</h2>
            <p>Reach new customers, recover costs, and keep great food out of the bin. Your dashboard is ready as soon as you create an account.</p>
            <Link to="/register">Create a free account <ArrowRight size={17} /></Link>
          </div>
          <div className="partner-visual">
            <div className="impact-card">
              <MapPin size={23} />
              <small>Your next offer</small>
              <strong>Goes live instantly</strong>
              <span>Students nearby can pick it up tonight.</span>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <Logo light />
          <p>Good food. Fuller lives. Less waste.</p>
        </div>
        <div className="footer-links">
          <Link to="/register">Become a partner</Link>
          <Link to="/login">Business login</Link>
          <a href="#how">How it works</a>
        </div>
        <small>© 2026 Fullr, Inc. Made with care for our planet.</small>
      </footer>
    </div>
  )
}
