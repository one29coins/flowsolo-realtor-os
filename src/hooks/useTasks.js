import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setTasks(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchTasks()
    else { setTasks([]); setLoading(false) }
  }, [user, fetchTasks])

  async function addTask(payload) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...payload, user_id: user.id }])
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) throw error
    setTasks(prev => [data[0], ...prev])
    return data[0]
  }

  async function updateTask(id, updates) {
    // Optimistic update — roll back on error
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(id,name), listing:projects(id,name,property_address)')
    if (error) {
      await fetchTasks()
      throw error
    }
    setTasks(prev => prev.map(t => t.id === id ? data[0] : t))
    return data[0]
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, error, addTask, updateTask, deleteTask, refetch: fetchTasks }
}
