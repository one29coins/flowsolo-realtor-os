import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useLeads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*, listing:projects!leads_assigned_listing_fkey(id,name,property_address), converted_client:clients!leads_converted_client_id_fkey(id,name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setLeads(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchLeads()
    else { setLeads([]); setLoading(false) }
  }, [user, fetchLeads])

  async function addLead(payload) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, listing:projects!leads_assigned_listing_fkey(id,name,property_address), converted_client:clients!leads_converted_client_id_fkey(id,name)')
    if (error) throw error
    setLeads(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateLead(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select('*, listing:projects!leads_assigned_listing_fkey(id,name,property_address), converted_client:clients!leads_converted_client_id_fkey(id,name)')
    if (error) throw error
    setLeads(prev => prev.map(l => l.id === id ? data[0] : l))
    return data[0]
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return { leads, loading, error, addLead, updateLead, deleteLead, refetch: fetchLeads }
}
