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
        <div className="nav-actions">
          <NavLink to="/app" end className="dash-nav-link">Offers</NavLink>
          <NavLink to="/app/settings">
          <span className="business-chip">
            {store?.image ? <img src={store.image} alt="" /> : null}
            <span className="business-chip-name">{store?.name || user?.email}</span>
          </span>
          </NavLink>
          <button className="ghost-link" type="button" onClick={logout}>Log out</button>
        </div>
      </nav>
    </header>
  )
}
