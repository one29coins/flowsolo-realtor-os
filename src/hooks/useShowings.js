import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useShowings() {
  const { user } = useAuth()
  const [showings, setShowings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchShowings = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('showings')
        .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
        .eq('user_id', user.id)
        .order('showing_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      setShowings(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchShowings()
    else { setShowings([]); setLoading(false) }
  }, [user, fetchShowings])

  async function addShowing(payload) {
    const { data, error } = await supabase
      .from('showings')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
    if (error) throw error
    setShowings(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateShowing(id, updates) {
    const { data, error } = await supabase
      .from('showings')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
    if (error) throw error
    setShowings(prev => prev.map(s => s.id === id ? data[0] : s))
    return data[0]
  }

  async function deleteShowing(id) {
    const { error } = await supabase.from('showings').delete().eq('id', id)
    if (error) throw error
    setShowings(prev => prev.filter(s => s.id !== id))
  }

  return { showings, loading, error, addShowing, updateShowing, deleteShowing, refetch: fetchShowings }
}
