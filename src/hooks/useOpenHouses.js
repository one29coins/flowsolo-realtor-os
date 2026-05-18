import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useOpenHouses() {
  const { user } = useAuth()
  const [openHouses, setOpenHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOpenHouses = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('open_houses')
        .select('*, listing:projects(id,name,property_address,city,state)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (error) throw error
      setOpenHouses(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchOpenHouses()
    else { setOpenHouses([]); setLoading(false) }
  }, [user, fetchOpenHouses])

  async function addOpenHouse(payload) {
    const { data, error } = await supabase
      .from('open_houses')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, listing:projects(id,name,property_address,city,state)')
    if (error) throw error
    setOpenHouses(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateOpenHouse(id, updates) {
    const { data, error } = await supabase
      .from('open_houses')
      .update(updates)
      .eq('id', id)
      .select('*, listing:projects(id,name,property_address,city,state)')
    if (error) throw error
    setOpenHouses(prev => prev.map(o => o.id === id ? data[0] : o))
    return data[0]
  }

  async function deleteOpenHouse(id) {
    const { error } = await supabase.from('open_houses').delete().eq('id', id)
    if (error) throw error
    setOpenHouses(prev => prev.filter(o => o.id !== id))
  }

  return { openHouses, loading, error, addOpenHouse, updateOpenHouse, deleteOpenHouse, refetch: fetchOpenHouses }
}
