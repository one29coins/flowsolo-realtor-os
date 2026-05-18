import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setClients(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchClients()
    else { setClients([]); setLoading(false) }
  }, [user, fetchClients])

  async function addClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: user.id }])
      .select()
    if (error) throw error
    setClients(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateClient(id, updates) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    setClients(prev => prev.map(c => c.id === id ? data[0] : c))
    return data[0]
  }

  async function deleteClient(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    if (error) throw error
    setClients(prev => prev.filter(c => c.id !== id))
  }

  return { clients, loading, error, addClient, updateClient, deleteClient, refetch: fetchClients }
}
