import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { DOCUMENT_TEMPLATES } from '../lib/documentTemplates'

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Guards against double-seeding (e.g. React strict-mode dev double-mount)
  const seededRef = useRef(false)

  const fetchDocuments = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error

      let rows = data || []

      // Seed starter documents on the agent's very first load.
      if (rows.length === 0 && !seededRef.current) {
        seededRef.current = true
        const seeds = DOCUMENT_TEMPLATES.map(t => ({
          ...t,
          user_id: user.id,
          status: 'Active'
        }))
        const { data: inserted, error: seedErr } = await supabase
          .from('documents')
          .insert(seeds)
          .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
        if (seedErr) throw seedErr
        rows = inserted || []
      }

      setDocuments(rows)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchDocuments()
    else { setDocuments([]); setLoading(false); seededRef.current = false }
  }, [user, fetchDocuments])

  async function addDocument(payload) {
    const { data, error } = await supabase
      .from('documents')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) throw error
    setDocuments(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateDocument(id, updates) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) throw error
    setDocuments(prev => prev.map(d => d.id === id ? data[0] : d))
    return data[0]
  }

  async function deleteDocument(id) {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  return { documents, loading, error, addDocument, updateDocument, deleteDocument, refetch: fetchDocuments }
}
