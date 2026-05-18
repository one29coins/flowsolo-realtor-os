import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useFollowUps() {
  const { user } = useAuth()
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFollowUps = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*, client:clients(id,name,client_type), lead:leads(id,name,stage)')
        .eq('user_id', user.id)
        .order('follow_up_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      setFollowUps(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchFollowUps()
    else { setFollowUps([]); setLoading(false) }
  }, [user, fetchFollowUps])

  async function addFollowUp(payload) {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name,client_type), lead:leads(id,name,stage)')
    if (error) throw error
    setFollowUps(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateFollowUp(id, updates) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name,client_type), lead:leads(id,name,stage)')
    if (error) throw error
    setFollowUps(prev => prev.map(f => f.id === id ? data[0] : f))
    return data[0]
  }

  async function deleteFollowUp(id) {
    const { error } = await supabase.from('follow_ups').delete().eq('id', id)
    if (error) throw error
    setFollowUps(prev => prev.filter(f => f.id !== id))
  }

  return { followUps, loading, error, addFollowUp, updateFollowUp, deleteFollowUp, refetch: fetchFollowUps }
}
