import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [store, setStore] = useState(null)
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
      setStore(null)
      return
    }

    const syncStore = async () => {
      const profile = session.user.user_metadata ?? {}

      const { data: existingStore, error: fetchError } = await supabase
        .from('Stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (fetchError) {
        setStore(null)
        return
      }

      if (existingStore) {
        setStore(existingStore)
        return
      }

      // Only the web registration flow may create a store profile. This keeps
      // mobile customer accounts from becoming stores when they sign in here.
      if (profile.account_type !== 'store') {
        setStore(null)
        return
      }

      const { data: createdStore, error: insertError } = await supabase
        .from('Stores')
        .insert({
          owner_id: session.user.id,
          name: profile.store_name || profile.business_name || session.user.email || 'New store',
          address: profile.address || null,
          description: profile.description || null,
          store_type: profile.store_type || null,
          image: profile.image || null
        })
        .select('*')
        .single()

      if (insertError) {
        setStore(null)
        return
      }

      setStore(createdStore)
    }

    syncStore()
  }, [session])

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    store,
    loading,
    refreshStore: async () => {
      if (!supabase || !session?.user) return
      const profile = session.user.user_metadata ?? {}
      if (profile.account_type !== 'store') {
        setStore(null)
        return
      }
      const { data: existingStore } = await supabase
        .from('Stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (existingStore) {
        setStore(existingStore)
        return
      }

      const { data } = await supabase
        .from('Stores')
        .insert({
          owner_id: session.user.id,
          name: profile.store_name || profile.business_name || session.user.email || 'New store',
          address: profile.address || null,
          description: profile.description || null,
          store_type: profile.store_type || null,
          image: profile.image || null
        })
        .select('*')
        .single()
      setStore(data ?? null)
    },
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, profile) => {
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/app`

      return supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            account_type: 'store',
            store_name: profile.name,
            store_type: profile.category,
            address: profile.address,
            description: profile.description,
            image: profile.image
          }
        }
      })
    },
    signOut: () => supabase.auth.signOut()
  }), [session, store, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
