import React from 'react'
import { Link } from 'react-router-dom'

export function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'light' : ''}`}>
      <span>fullr</span>
      <img src="/logo.png" alt="" aria-hidden="true" />
    </Link>
  )
}
