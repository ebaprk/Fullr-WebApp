import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { configured, session, store, loading, storeLoading } = useAuth()

  if (loading || (session && storeLoading)) {
    return <div className="page-loading">Loading your kitchen…</div>
  }

  if (!configured || !session || !store) {
    return <Navigate to="/login" replace />
  }

  return children
}
