import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme, DEFAULT_BRAND, DEFAULT_ACCENT } from '../lib/theme'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      applyTheme({ brand: DEFAULT_BRAND, accent: DEFAULT_ACCENT })
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data)
        applyTheme({
          brand: data?.brand_color || DEFAULT_BRAND,
          accent: data?.accent_color || DEFAULT_ACCENT
        })
      })
  }, [user])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp({ email, password, fullName, brokerageName, licenseKey }) {
    // 1. Validate license key
    const { data: keyRow, error: keyErr } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key', licenseKey)
      .maybeSingle()

    if (keyErr) throw keyErr
    if (!keyRow) throw new Error('Invalid or already used license key')
    if (keyRow.used) throw new Error('Invalid or already used license key')

    // 2. Create auth user. The on_auth_user_created trigger on auth.users
    // inserts the profile row server-side, so no client INSERT is needed.
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, brokerage_name: brokerageName }
      }
    })
    if (authErr) throw authErr
    const newUser = authData.user
    if (!newUser) throw new Error('Signup failed — no user returned')

    // 3. Stamp the license key onto the profile (trigger created it without one)
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ license_key: licenseKey })
      .eq('id', newUser.id)
    if (profileErr) throw profileErr

    // 4. Mark license key as used
    const { error: keyUpdateErr } = await supabase
      .from('license_keys')
      .update({ used: true, used_by: newUser.id, used_at: new Date().toISOString() })
      .eq('id', keyRow.id)
    if (keyUpdateErr) throw keyUpdateErr
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(data)
    if (data) {
      applyTheme({
        brand: data.brand_color || DEFAULT_BRAND,
        accent: data.accent_color || DEFAULT_ACCENT
      })
    }
  }

  async function updateTheme({ brand, accent }) {
    if (!user) return
    const payload = {}
    if (brand !== undefined) payload.brand_color = brand
    if (accent !== undefined) payload.accent_color = accent
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .maybeSingle()
    if (error) throw error
    setProfile(data)
    applyTheme({
      brand: data?.brand_color || DEFAULT_BRAND,
      accent: data?.accent_color || DEFAULT_ACCENT
    })
  }

  const value = { user, profile, loading, signIn, signUp, signOut, refreshProfile, updateTheme }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
