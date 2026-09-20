import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'

export function DashNav() {
  const { store, user, signOut } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header>
      <nav>
        <Logo to="/app" />
        <div className="nav-links dash-nav-links">
          <NavLink to="/app" end>Offers</NavLink>
          <NavLink to="/app/settings">Settings</NavLink>
        </div>
        <div className="nav-actions">
          <span className="business-chip">
            {store?.image ? <img src={store.image} alt="" /> : null}
            {store?.name || user?.email}
          </span>
          <button className="ghost-link" type="button" onClick={logout}>Log out</button>
        </div>
      </nav>
    </header>
  )
}
