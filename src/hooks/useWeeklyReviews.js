import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWeeklyReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
      if (error) throw error
      setReviews(data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchReviews()
    else { setReviews([]); setLoading(false) }
  }, [user, fetchReviews])

  // Insert-or-update keyed on (user_id, week_start)
  async function addReview(payload) {
    const existing = reviews.find(r => r.week_start === payload.week_start)
    if (existing) {
      return updateReview(existing.id, payload)
    }
    const { data, error } = await supabase
      .from('weekly_reviews')
      .insert([{ ...payload, user_id: user.id }])
      .select()
    if (error) throw error
    setReviews(prev => [data[0], ...prev].sort((a, b) => (b.week_start || '').localeCompare(a.week_start || '')))
    return data[0]
  }

  async function updateReview(id, updates) {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    setReviews(prev => prev.map(r => r.id === id ? data[0] : r))
    return data[0]
  }

  return { reviews, loading, error, addReview, updateReview, refetch: fetchReviews }
}
