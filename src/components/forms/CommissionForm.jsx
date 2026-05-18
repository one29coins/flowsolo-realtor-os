import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/format'
import { COMMISSION_STATUSES } from '../../lib/realtorConstants'

const PAYMENT_METHODS = ['', 'Wire', 'Check', 'ACH', 'Bank transfer', 'Other']

const empty = {
  title: '',
  invoice_number: '',
  client_id: '',
  listing_id: '',
  transaction_id: '',
  status: 'Expected',
  closing_date: '',
  invoice_date: '',
  sale_price: '',
  commission_rate: '',
  brokerage_split_percent: '',
  payment_method: '',
  notes: ''
}

export default function CommissionForm({
  open,
  onClose,
  onSubmit,
  initial,
  clients = [],
  listings = [],
  transactions = []
}) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const next = initial
        ? { ...empty, ...initial }
        : { ...empty, invoice_number: `COM-${Date.now().toString().slice(-6)}` }
      setForm(next)
    }
  }, [open, initial])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  // Auto-calculated commission math
  const salePrice = Number(form.sale_price) || 0
  const rate = Number(form.commission_rate) || 0
  const split = Number(form.brokerage_split_percent) || 0
  const grossCommission = useMemo(
    () => Math.round(salePrice * (rate / 100) * 100) / 100,
    [salePrice, rate]
  )
  const netCommission = useMemo(
    () => Math.round(grossCommission * (split / 100) * 100) / 100,
    [grossCommission, split]
  )

  // When a transaction is chosen, prefill from it (but only if those fields are blank)
  function chooseTransaction(id) {
    set('transaction_id', id)
    if (!id) return
    const t = transactions.find(x => x.id === id)
    if (!t) return
    setForm(p => ({
      ...p,
      listing_id: p.listing_id || t.listing_id || '',
      client_id: p.client_id || t.client_id || '',
      sale_price: p.sale_price !== '' ? p.sale_price : (t.accepted_price ?? ''),
      commission_rate: p.commission_rate !== '' ? p.commission_rate : (t.commission_rate ?? ''),
      brokerage_split_percent: p.brokerage_split_percent !== '' ? p.brokerage_split_percent : (t.brokerage_split ?? ''),
      closing_date: p.closing_date || t.closing_date || ''
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.client_id) {
      toast.error('Please choose a client')
      return
    }
    try {
      setLoading(true)
      const payload = {
        invoice_number: form.invoice_number || null,
        title: form.title?.trim() || null,
        client_id: form.client_id,
        listing_id: form.listing_id || null,
        transaction_id: form.transaction_id || null,
        status: form.status,
        closing_date: form.closing_date || null,
        invoice_date: form.invoice_date || null,
        sale_price: form.sale_price !== '' ? salePrice : null,
        commission_rate: form.commission_rate !== '' ? rate : null,
        gross_commission: grossCommission || null,
        brokerage_split_percent: form.brokerage_split_percent !== '' ? split : null,
        net_commission: netCommission || null,
        amount: netCommission || grossCommission || 0,
        payment_method: form.payment_method || null,
        notes: form.notes?.trim() || null
      }
      await onSubmit(payload)
      toast.success(initial ? 'Commission updated' : 'Commission added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save commission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit commission' : 'Add commission'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save commission</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Commission title" className="md:col-span-2" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder='e.g. "1234 Maple St — Listing Side"' />

        <Select label="Listing" value={form.listing_id || ''} onChange={(e) => set('listing_id', e.target.value)}>
          <option value="">No listing</option>
          {listings.map(l => (
            <option key={l.id} value={l.id}>
              {l.property_address || l.name}
            </option>
          ))}
        </Select>
        <Select label="Transaction" value={form.transaction_id || ''} onChange={(e) => chooseTransaction(e.target.value)}>
          <option value="">No transaction</option>
          {transactions.map(t => (
            <option key={t.id} value={t.id}>
              {(t.listing?.property_address || t.listing?.name || 'Transaction')} — {t.status || ''}
            </option>
          ))}
        </Select>

        <Select label="Client *" value={form.client_id || ''} onChange={(e) => set('client_id', e.target.value)} required>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.client_type ? ` — ${c.client_type}` : ''}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={COMMISSION_STATUSES} />

        <Input label="Sale price ($)" type="number" min="0" step="1000" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} />
        <Input label="Commission rate (%)" type="number" min="0" step="0.1" value={form.commission_rate} onChange={(e) => set('commission_rate', e.target.value)} />

        <div>
          <span className="block text-sm font-medium text-ink mb-1">Gross commission</span>
          <div className="px-3 py-2 text-sm bg-canvas border-hairline border-line rounded-btn">
            {formatCurrency(grossCommission)}
          </div>
          <span className="block text-xs text-ink-muted mt-1">Sale price × rate</span>
        </div>
        <Input label="Brokerage split (%)" type="number" min="0" max="100" step="1" value={form.brokerage_split_percent} onChange={(e) => set('brokerage_split_percent', e.target.value)} hint="Your share of gross" />

        <div className="md:col-span-2 px-3 py-2 bg-canvas rounded-btn text-sm flex justify-between">
          <span className="text-ink-muted">Net commission (your take-home)</span>
          <span className="font-medium text-ink">{formatCurrency(netCommission)}</span>
        </div>

        <Input label="Closing date" type="date" value={form.closing_date || ''} onChange={(e) => set('closing_date', e.target.value)} />
        <Input label="Date paid" type="date" value={form.invoice_date || ''} onChange={(e) => set('invoice_date', e.target.value)} hint="When commission hit your account" />

        <Select label="Payment method" className="md:col-span-2" value={form.payment_method || ''} onChange={(e) => set('payment_method', e.target.value)}>
          {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p || 'Select method…'}</option>)}
        </Select>

        <Textarea label="Notes" className="md:col-span-2" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
      </form>
    </Modal>
  )
}
