import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Backed by the `invoices` table. The Commission Hub UI surfaces these as
// "commissions" — one row per expected payout on a deal.
export function useCommissions() {
  const { user } = useAuth()
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCommissions = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setCommissions(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchCommissions()
    else { setCommissions([]); setLoading(false) }
  }, [user, fetchCommissions])

  async function addCommission(payload) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) throw error
    setCommissions(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateCommission(id, updates) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) throw error
    setCommissions(prev => prev.map(c => c.id === id ? data[0] : c))
    return data[0]
  }

  async function deleteCommission(id) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    setCommissions(prev => prev.filter(c => c.id !== id))
  }

  return { commissions, loading, error, addCommission, updateCommission, deleteCommission, refetch: fetchCommissions }
}
