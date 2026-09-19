import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { configured, session, loading } = useAuth()

  if (loading) {
    return <div className="page-loading">Loading your kitchen…</div>
  }

  if (!configured || !session) {
    return <Navigate to="/login" replace />
  }

  return children
}
