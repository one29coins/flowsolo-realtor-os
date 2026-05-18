import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
        .eq('user_id', user.id)
        .order('closing_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      setTransactions(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchTransactions()
    else { setTransactions([]); setLoading(false) }
  }, [user, fetchTransactions])

  async function addTransaction(payload) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
    if (error) throw error
    setTransactions(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name,client_type), listing:projects(id,name,property_address)')
    if (error) throw error
    setTransactions(prev => prev.map(t => t.id === id ? data[0] : t))
    return data[0]
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
