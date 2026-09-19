import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'light' : ''}`}>
      <span>fullr</span>
      <Leaf size={19} strokeWidth={2.4} />
    </Link>
  )
}
