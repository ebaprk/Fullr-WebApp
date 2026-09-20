import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [storeLoading, setStoreLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setStoreLoading(false)
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
      setStoreLoading(false)
      return
    }

    let isActive = true

    const syncStore = async () => {
      const { data: existingStore, error: fetchError } = await supabase
        .from('Stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (!isActive) return

      if (fetchError || !existingStore) {
        // A valid web session must have a store. This also keeps an auth
        // session from a different client out of the business dashboard.
        setStore(null)
        setStoreLoading(false)
        await supabase.auth.signOut()
        return
      }

      setStore(existingStore)
      setStoreLoading(false)
    }

    setStoreLoading(true)
    syncStore()

    return () => {
      isActive = false
    }
  }, [session])

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    store,
    loading,
    storeLoading,
    refreshStore: async () => {
      if (!supabase || !session?.user) return
      setStoreLoading(true)
      const { data: existingStore, error } = await supabase
        .from('Stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (error || !existingStore) {
        setStore(null)
        setStoreLoading(false)
        await supabase.auth.signOut()
        return
      }

      setStore(existingStore)
      setStoreLoading(false)
    },
    signIn: async (email, password) => {
      const result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error || !result.data.user) return result

      const { data: ownerStore, error: storeError } = await supabase
        .from('Stores')
        .select('id')
        .eq('owner_id', result.data.user.id)
        .maybeSingle()

      if (!storeError && ownerStore) return result

      await supabase.auth.signOut()
      return {
        data: { user: null, session: null },
        error: new Error('This portal is available only to business owners with a registered store.')
      }
    },
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
  }), [session, store, loading, storeLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
