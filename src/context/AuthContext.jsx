import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) {
      setBusiness(null)
      return
    }

    supabase
      .from('businesses')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setBusiness(data ?? null))
  }, [session])

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    business,
    loading,
    refreshBusiness: async () => {
      if (!supabase || !session?.user) return
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setBusiness(data ?? null)
    },
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, profile) => supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: profile.name,
          category: profile.category,
          address: profile.address,
          city: profile.city,
          phone: profile.phone
        }
      }
    }),
    signOut: () => supabase.auth.signOut()
  }), [session, business, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
