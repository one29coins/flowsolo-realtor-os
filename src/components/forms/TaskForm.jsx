import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import { toast } from '../../lib/toast'
import { PRIORITY_LEVELS, TASK_STATUSES } from '../../lib/realtorConstants'

const empty = {
  name: '', client_id: '', project_id: '',
  status: 'To Do', priority: 'Medium', due_date: '',
  notes: '', completed: false
}

export default function TaskForm({ open, onClose, onSubmit, initial, clients = [], listings = [] }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Migrate legacy "Inbox" → "To Do"
      const migrated = initial
        ? { ...empty, ...initial, status: initial.status === 'Inbox' ? 'To Do' : (initial.status || 'To Do') }
        : empty
      setForm(migrated)
    }
  }, [open, initial])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      setLoading(true)
      const payload = {
        name: form.name.trim(),
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        notes: form.notes || null,
        completed: form.status === 'Done'
      }
      await onSubmit(payload)
      toast.success(initial ? 'Task updated' : 'Task added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save task')
    } finally {
      setLoading(false)
    }
  }

  // Listings can be filtered by client, but only if the chosen client is linked
  // to a listing as seller_id or client_id.
  const filteredListings = form.client_id
    ? listings.filter(l => l.client_id === form.client_id || l.seller_id === form.client_id)
    : listings

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit task' : 'Add task'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save task</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Task name *" required className="md:col-span-2" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder='e.g. "Send disclosures to seller"' />
        <Select label="Client" value={form.client_id || ''} onChange={(e) => set('client_id', e.target.value)}>
          <option value="">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Listing" value={form.project_id || ''} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">No listing</option>
          {filteredListings.map(l => <option key={l.id} value={l.id}>{l.property_address || l.name}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={TASK_STATUSES} />
        <Select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value)} options={PRIORITY_LEVELS} />
        <Input label="Due date" className="md:col-span-2" type="date" value={form.due_date || ''} onChange={(e) => set('due_date', e.target.value)} />
        <Textarea label="Notes" className="md:col-span-2" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
      </form>
    </Modal>
  )
}
