import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import { toast } from '../../lib/toast'
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_CHANNELS,
  FOLLOW_UP_STATUSES
} from '../../lib/realtorConstants'

const empty = {
  title: '',
  client_id: '',
  lead_id: '',
  type: 'General Check-In',
  status: 'Scheduled',
  follow_up_date: '',
  channel: 'Phone Call',
  property_interest: '',
  notes: '',
  outcome: ''
}

export default function FollowUpForm({ open, onClose, onSubmit, initial, clients = [], leads = [] }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Tolerate legacy "To Do" coming from older rows
      const migrated = initial
        ? { ...empty, ...initial, status: initial.status === 'To Do' ? 'Scheduled' : (initial.status || 'Scheduled') }
        : empty
      setForm(migrated)
    }
  }, [open, initial])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.client_id) {
      toast.error('Title and client are required')
      return
    }
    try {
      setLoading(true)
      const payload = {
        title: form.title.trim(),
        client_id: form.client_id,
        lead_id: form.lead_id || null,
        type: form.type || null,
        follow_up_type: form.type || null,
        status: form.status,
        follow_up_date: form.follow_up_date || null,
        channel: form.channel || null,
        property_interest: form.property_interest?.trim() || null,
        notes: form.notes?.trim() || null,
        outcome: form.outcome?.trim() || null
      }
      await onSubmit(payload)
      toast.success(initial ? 'Follow-up updated' : 'Follow-up added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save follow-up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit follow-up' : 'Add follow-up'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save follow-up</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Title *" required className="md:col-span-2" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder='e.g. "Showing feedback — 1234 Maple St"' />

        <Select label="Client *" value={form.client_id || ''} onChange={(e) => set('client_id', e.target.value)} required>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.client_type ? ` — ${c.client_type}` : ''}</option>)}
        </Select>
        <Select label="Lead" value={form.lead_id || ''} onChange={(e) => set('lead_id', e.target.value)}>
          <option value="">No lead linked</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.stage ? ` — ${l.stage}` : ''}</option>)}
        </Select>

        <Select label="Type" value={form.type || 'General Check-In'} onChange={(e) => set('type', e.target.value)} options={FOLLOW_UP_TYPES} />
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={FOLLOW_UP_STATUSES} />

        <Input label="Follow-up date" type="date" value={form.follow_up_date || ''} onChange={(e) => set('follow_up_date', e.target.value)} />
        <Select label="Channel" value={form.channel || 'Phone Call'} onChange={(e) => set('channel', e.target.value)} options={FOLLOW_UP_CHANNELS} />

        <Input label="Property interest" className="md:col-span-2" value={form.property_interest || ''} onChange={(e) => set('property_interest', e.target.value)} placeholder="Specific listing or area being discussed" />

        <Textarea label="Agenda / talking points" className="md:col-span-2" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="What you plan to cover" />

        {form.status !== 'Scheduled' && (
          <Textarea label="Outcome" className="md:col-span-2" rows={2} value={form.outcome || ''} onChange={(e) => set('outcome', e.target.value)} placeholder="What was decided or noted" />
        )}
      </form>
    </Modal>
  )
}
