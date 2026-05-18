import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import { toast } from '../../lib/toast'
import {
  CLIENT_TYPES,
  TRANSACTION_STATUSES,
  PROPERTY_TYPES,
  TIMELINE_OPTIONS,
  LEAD_SOURCES,
  PREFERRED_CONTACT,
  PRIORITY_LEVELS
} from '../../lib/realtorConstants'

const empty = {
  name: '',
  email: '',
  phone: '',
  brokerage_name: '',
  client_type: 'Buyer',
  transaction_status: 'Active',
  property_type: '',
  budget_min: '',
  budget_max: '',
  pre_approved: false,
  pre_approval_amount: '',
  pre_approval_expiry: '',
  desired_location: '',
  must_haves: '',
  deal_breakers: '',
  timeline: '',
  referred_by: '',
  preferred_contact: '',
  closing_date: '',
  priority: 'Medium',
  notes: ''
}

export default function ClientForm({ open, onClose, onSubmit, initial, quick = false }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty)
  }, [open, initial])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  const isBuyerLike = form.client_type === 'Buyer' || form.client_type === 'Both'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      setLoading(true)
      const payload = {
        name: form.name.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        brokerage_name: form.brokerage_name?.trim() || null,
        client_type: form.client_type,
        transaction_status: form.transaction_status,
        property_type: form.property_type || null,
        budget_min: isBuyerLike && form.budget_min !== '' ? Number(form.budget_min) : null,
        budget_max: isBuyerLike && form.budget_max !== '' ? Number(form.budget_max) : null,
        pre_approved: !!form.pre_approved,
        pre_approval_amount: form.pre_approval_amount !== '' ? Number(form.pre_approval_amount) : null,
        pre_approval_expiry: form.pre_approval_expiry || null,
        desired_location: form.desired_location?.trim() || null,
        must_haves: form.must_haves?.trim() || null,
        deal_breakers: form.deal_breakers?.trim() || null,
        timeline: form.timeline || null,
        referred_by: form.referred_by || null,
        preferred_contact: form.preferred_contact || null,
        closing_date: form.closing_date || null,
        priority: form.priority,
        notes: form.notes?.trim() || null
      }
      await onSubmit(payload)
      toast.success(initial ? 'Client updated' : 'Client added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit client' : 'Add client'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save client</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full name *" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Input label="Email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
        <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Brokerage name" value={form.brokerage_name || ''} onChange={(e) => set('brokerage_name', e.target.value)} hint="Their brokerage, if relevant (referrals/agents)" />

        <Select label="Client type" value={form.client_type} onChange={(e) => set('client_type', e.target.value)} options={CLIENT_TYPES} />
        <Select label="Transaction status" value={form.transaction_status} onChange={(e) => set('transaction_status', e.target.value)} options={TRANSACTION_STATUSES} />

        <Select label="Property type" value={form.property_type || ''} onChange={(e) => set('property_type', e.target.value)}>
          <option value="">Select type…</option>
          {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select label="Preferred contact" value={form.preferred_contact || ''} onChange={(e) => set('preferred_contact', e.target.value)}>
          <option value="">Select…</option>
          {PREFERRED_CONTACT.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>

        {!quick && isBuyerLike && (
          <>
            <Input label="Budget min ($)" type="number" min="0" step="1000" value={form.budget_min} onChange={(e) => set('budget_min', e.target.value)} />
            <Input label="Budget max ($)" type="number" min="0" step="1000" value={form.budget_max} onChange={(e) => set('budget_max', e.target.value)} />
            <label className="flex items-center gap-2 md:col-span-2 px-3 py-2 bg-canvas rounded-btn cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.pre_approved}
                onChange={(e) => set('pre_approved', e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm text-ink">Pre-approved for financing</span>
            </label>
            {form.pre_approved && (
              <>
                <Input label="Pre-approval amount ($)" type="number" min="0" step="1000" value={form.pre_approval_amount} onChange={(e) => set('pre_approval_amount', e.target.value)} />
                <Input label="Pre-approval expiry" type="date" value={form.pre_approval_expiry || ''} onChange={(e) => set('pre_approval_expiry', e.target.value)} />
              </>
            )}
          </>
        )}

        {!quick && (
          <>
            <Input label="Desired location" className="md:col-span-2" value={form.desired_location || ''} onChange={(e) => set('desired_location', e.target.value)} placeholder="e.g. Highland Park, Wash Park, Capitol Hill" />
            <Textarea label="Must-haves" className="md:col-span-2" rows={2} value={form.must_haves || ''} onChange={(e) => set('must_haves', e.target.value)} placeholder="3+ beds, fenced yard, walkable, etc." />
            <Textarea label="Deal-breakers" className="md:col-span-2" rows={2} value={form.deal_breakers || ''} onChange={(e) => set('deal_breakers', e.target.value)} placeholder="No HOA, no busy street, etc." />

            <Select label="Timeline" value={form.timeline || ''} onChange={(e) => set('timeline', e.target.value)}>
              <option value="">Select timeline…</option>
              {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Referred by" value={form.referred_by || ''} onChange={(e) => set('referred_by', e.target.value)}>
              <option value="">Select source…</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>

            <Input label="Target / closing date" type="date" value={form.closing_date || ''} onChange={(e) => set('closing_date', e.target.value)} />
            <Select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value)} options={PRIORITY_LEVELS} />

            <Textarea label="Internal notes" className="md:col-span-2" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </>
        )}
      </form>
    </Modal>
  )
}
