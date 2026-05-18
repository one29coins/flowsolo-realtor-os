import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useMarketNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotes = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('market_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('week_date', { ascending: false })
      if (error) throw error
      setNotes(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchNotes()
    else { setNotes([]); setLoading(false) }
  }, [user, fetchNotes])

  async function addNote(payload) {
    const { data, error } = await supabase
      .from('market_notes')
      .insert([{ ...payload, user_id: user.id }])
      .select()
    if (error) throw error
    setNotes(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateNote(id, updates) {
    const { data, error } = await supabase
      .from('market_notes')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    setNotes(prev => prev.map(n => n.id === id ? data[0] : n))
    return data[0]
  }

  async function deleteNote(id) {
    const { error } = await supabase.from('market_notes').delete().eq('id', id)
    if (error) throw error
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, error, addNote, updateNote, deleteNote, refetch: fetchNotes }
}
