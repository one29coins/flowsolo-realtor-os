import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { Textarea } from '../ui/Input'
import Select from '../ui/Select'
import { toast } from '../../lib/toast'
import { formatCurrency } from '../../lib/format'
import {
  LISTING_TYPES,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  PRIORITY_LEVELS
} from '../../lib/realtorConstants'

const empty = {
  name: '',
  property_address: '',
  city: '',
  state: '',
  zip: '',
  mls_number: '',
  listing_type: 'Exclusive Right to Sell',
  property_type: '',
  status: 'Active',
  seller_id: '',
  list_price: '',
  sale_price: '',
  commission_rate: 3.0,
  listing_date: '',
  listing_expiry: '',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  year_built: '',
  showing_count: 0,
  offer_count: 0,
  photos_link: '',
  virtual_tour_link: '',
  priority: 'Medium',
  notes: ''
}

function daysBetween(fromIso, toDate) {
  if (!fromIso) return 0
  const from = new Date(fromIso + 'T00:00:00')
  if (Number.isNaN(from.getTime())) return 0
  const ms = toDate.getTime() - from.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export default function ListingForm({ open, onClose, onSubmit, initial, clients = [] }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty)
  }, [open, initial])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  // Auto-derived fields
  const salePrice = Number(form.sale_price) || 0
  const commissionRate = Number(form.commission_rate) || 0
  const commissionAmount = Math.round(salePrice * (commissionRate / 100) * 100) / 100
  const daysOnMarket = useMemo(() => daysBetween(form.listing_date, new Date()), [form.listing_date])

  // Only sellers (or "Both") can be listed as the seller on a listing
  const sellerOptions = clients.filter(c =>
    c.client_type === 'Seller' || c.client_type === 'Both' || !c.client_type
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.property_address?.trim() && !form.name?.trim()) {
      toast.error('Property address is required')
      return
    }
    try {
      setLoading(true)
      const derivedName = form.name?.trim() || form.property_address?.trim()
      const payload = {
        name: derivedName,
        property_address: form.property_address?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        zip: form.zip?.trim() || null,
        mls_number: form.mls_number?.trim() || null,
        listing_type: form.listing_type || null,
        property_type: form.property_type || null,
        status: form.status,
        seller_id: form.seller_id || null,
        client_id: form.seller_id || null,
        list_price: form.list_price !== '' ? Number(form.list_price) : null,
        sale_price: form.sale_price !== '' ? Number(form.sale_price) : null,
        commission_rate: commissionRate || 0,
        commission_amount: commissionAmount || 0,
        listing_date: form.listing_date || null,
        listing_expiry: form.listing_expiry || null,
        bedrooms: form.bedrooms !== '' ? Math.round(Number(form.bedrooms)) : null,
        bathrooms: form.bathrooms !== '' ? Number(form.bathrooms) : null,
        square_feet: form.square_feet !== '' ? Math.round(Number(form.square_feet)) : null,
        year_built: form.year_built !== '' ? Math.round(Number(form.year_built)) : null,
        days_on_market: daysOnMarket,
        showing_count: Number(form.showing_count) || 0,
        offer_count: Number(form.offer_count) || 0,
        photos_link: form.photos_link?.trim() || null,
        virtual_tour_link: form.virtual_tour_link?.trim() || null,
        priority: form.priority,
        notes: form.notes?.trim() || null
      }
      await onSubmit(payload)
      toast.success(initial ? 'Listing updated' : 'Listing added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not save listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit listing' : 'Add listing'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Save listing</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Property address *" required className="md:col-span-2" value={form.property_address || ''} onChange={(e) => set('property_address', e.target.value)} placeholder="e.g. 1234 Maple St" />
        <Input label="City" value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="State" value={form.state || ''} onChange={(e) => set('state', e.target.value)} maxLength={2} />
          <Input label="Zip" value={form.zip || ''} onChange={(e) => set('zip', e.target.value)} />
        </div>

        <Input label="MLS number" value={form.mls_number || ''} onChange={(e) => set('mls_number', e.target.value)} />
        <Select label="Listing type" value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)} options={LISTING_TYPES} />

        <Select label="Property type" value={form.property_type || ''} onChange={(e) => set('property_type', e.target.value)}>
          <option value="">Select type…</option>
          {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} options={LISTING_STATUSES} />

        <Select label="Seller" className="md:col-span-2" value={form.seller_id || ''} onChange={(e) => set('seller_id', e.target.value)}>
          <option value="">No seller linked</option>
          {sellerOptions.map(c => <option key={c.id} value={c.id}>{c.name}{c.client_type ? ` — ${c.client_type}` : ''}</option>)}
        </Select>

        <Input label="List price ($)" type="number" min="0" step="1000" value={form.list_price} onChange={(e) => set('list_price', e.target.value)} />
        <Input label="Sale price ($)" type="number" min="0" step="1000" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} />

        <Input label="Commission rate (%)" type="number" min="0" step="0.1" value={form.commission_rate} onChange={(e) => set('commission_rate', e.target.value)} hint="Default 3.0" />
        <div>
          <span className="block text-sm font-medium text-ink mb-1">Commission amount</span>
          <div className="px-3 py-2 text-sm bg-canvas border-hairline border-line rounded-btn">
            {formatCurrency(commissionAmount)}
          </div>
          <span className="block text-xs text-ink-muted mt-1">Auto-calculated from sale price × rate</span>
        </div>

        <Input label="Listing date" type="date" value={form.listing_date || ''} onChange={(e) => set('listing_date', e.target.value)} />
        <Input label="Listing expiry" type="date" value={form.listing_expiry || ''} onChange={(e) => set('listing_expiry', e.target.value)} />

        <Input label="Bedrooms" type="number" min="0" step="1" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
        <Input label="Bathrooms" type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
        <Input label="Square feet" type="number" min="0" step="50" value={form.square_feet} onChange={(e) => set('square_feet', e.target.value)} />
        <Input label="Year built" type="number" min="1700" max="2100" step="1" value={form.year_built} onChange={(e) => set('year_built', e.target.value)} />

        <div>
          <span className="block text-sm font-medium text-ink mb-1">Days on market</span>
          <div className="px-3 py-2 text-sm bg-canvas border-hairline border-line rounded-btn">
            {form.listing_date ? `${daysOnMarket} days` : '—'}
          </div>
          <span className="block text-xs text-ink-muted mt-1">Auto from listing date</span>
        </div>
        <Select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value)} options={PRIORITY_LEVELS} />

        <Input label="Showing count" type="number" min="0" step="1" value={form.showing_count || 0} onChange={(e) => set('showing_count', e.target.value)} />
        <Input label="Offer count" type="number" min="0" step="1" value={form.offer_count || 0} onChange={(e) => set('offer_count', e.target.value)} />

        <Input label="Photos link" type="url" className="md:col-span-2" placeholder="https://drive.google.com/…" value={form.photos_link || ''} onChange={(e) => set('photos_link', e.target.value)} />
        <Input label="Virtual tour link" type="url" className="md:col-span-2" placeholder="https://tour.example.com/…" value={form.virtual_tour_link || ''} onChange={(e) => set('virtual_tour_link', e.target.value)} />

        <Textarea label="Internal notes" className="md:col-span-2" rows={3} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
      </form>
    </Modal>
  )
}
