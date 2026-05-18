import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Backed by the `projects` table — kept that name in the schema so foreign
// keys from showings/transactions/etc. all still resolve. Surface name is
// "listings" everywhere in the app.
export function useListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchListings = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*, client:clients(id,name,client_type), seller:clients!projects_seller_id_fkey(id,name,client_type)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setListings(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchListings()
    else { setListings([]); setLoading(false) }
  }, [user, fetchListings])

  async function addListing(payload) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name,client_type), seller:clients!projects_seller_id_fkey(id,name,client_type)')
    if (error) throw error
    setListings(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateListing(id, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name,client_type), seller:clients!projects_seller_id_fkey(id,name,client_type)')
    if (error) throw error
    setListings(prev => prev.map(l => l.id === id ? data[0] : l))
    return data[0]
  }

  async function deleteListing(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    setListings(prev => prev.filter(l => l.id !== id))
  }

  return { listings, loading, error, addListing, updateListing, deleteListing, refetch: fetchListings }
}
