import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Home, Upload, Download, AlertTriangle } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import CSVImport from '../components/ui/CSVImport'
import ListingForm from '../components/forms/ListingForm'
import { useListings } from '../hooks/useListings'
import { useClients } from '../hooks/useClients'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toCSV, downloadCSV } from '../lib/csv'
import { LISTING_STATUSES, PROPERTY_TYPES } from '../lib/realtorConstants'
import { formatCurrency, formatDate } from '../lib/format'
import { toast } from '../lib/toast'

const STATUS_FILTER = ['All', ...LISTING_STATUSES]
const PROPERTY_TYPE_FILTER = ['All', ...PROPERTY_TYPES]

// Status pill colors — inline styles so we don't depend on the Badge palette
const STATUS_STYLES = {
  'Coming Soon':    { bg: '#ede9fe', fg: '#5b21b6' }, // purple
  'Active':         { bg: '#dcfce7', fg: '#166534' }, // green
  'Under Contract': { bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  'Pending':        { bg: '#fef3c7', fg: '#92400e' }, // amber
  'Sold':           { bg: '#ccfbf1', fg: '#115e59' }, // teal
  'Expired':        { bg: '#fee2e2', fg: '#991b1b' }, // red
  'Withdrawn':      { bg: '#f1f5f9', fg: '#475569' }, // gray
  'Price Reduced':  { bg: '#ffedd5', fg: '#9a3412' }, // orange
}

function StatusPill({ value }) {
  const s = STATUS_STYLES[value] || { bg: '#f1f5f9', fg: '#475569' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {value || '—'}
    </span>
  )
}

function daysOnMarket(listingDate, fallback) {
  if (!listingDate) return Number(fallback || 0)
  const d = new Date(listingDate + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return Number(fallback || 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.max(0, Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
  return diff
}

function domColor(days) {
  if (days <= 30) return { text: 'text-green-700', bar: 'bg-green-500' }
  if (days <= 60) return { text: 'text-amber-700', bar: 'bg-amber-500' }
  return { text: 'text-red-600', bar: 'bg-red-500' }
}

function DOMCell({ days }) {
  const { text, bar } = domColor(days)
  const pct = Math.min(100, Math.round((days / 90) * 100))
  return (
    <div className="min-w-[110px]">
      <div className={`text-xs font-medium ${text} mb-1`}>{days}d</div>
      <div className="h-1.5 w-full bg-canvas rounded-full overflow-hidden">
        <div className={bar} style={{ width: `${pct}%`, height: '100%' }} />
      </div>
    </div>
  )
}

export default function Listings() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const { listings, loading, addListing, updateListing, deleteListing } = useListings()
  const { clients } = useClients()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const filtered = useMemo(() => {
    return listings.filter(p => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false
      if (typeFilter !== 'All' && p.property_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.property_address?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.mls_number?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [listings, search, statusFilter, typeFilter])

  function openEdit(p) { setEditing(p); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditing(null) }

  async function handleSubmit(payload) {
    if (editing) await updateListing(editing.id, payload)
    else await addListing(payload)
  }

  async function handleDelete() {
    try {
      await deleteListing(deleting.id)
      toast.success('Listing deleted')
    } catch (err) { toast.error(err.message) }
  }

  function handleExport() {
    if (!filtered.length) { toast.error('Nothing to export'); return }
    const headers = [
      'property_address', 'city', 'state', 'zip',
      'status', 'property_type', 'listing_type',
      'list_price', 'sale_price', 'commission_rate',
      'bedrooms', 'bathrooms', 'square_feet', 'year_built',
      'mls_number', 'listing_date', 'listing_expiry',
      'showing_count', 'offer_count', 'open_house_count',
      'priority', 'notes'
    ]
    const csv = toCSV(filtered.map(p => ({
      property_address: p.property_address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      status: p.status,
      property_type: p.property_type,
      listing_type: p.listing_type,
      list_price: p.list_price,
      sale_price: p.sale_price,
      commission_rate: p.commission_rate,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      square_feet: p.square_feet,
      year_built: p.year_built,
      mls_number: p.mls_number,
      listing_date: p.listing_date,
      listing_expiry: p.listing_expiry,
      showing_count: p.showing_count,
      offer_count: p.offer_count,
      open_house_count: p.open_house_count,
      priority: p.priority,
      notes: p.notes
    })), headers)
    downloadCSV(`listings-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    toast.success('Exported')
  }

  // Minimal CSV import: maps the same headers we export
  const importConfig = useMemo(() => ({
    templateHeaders: [
      'property_address', 'city', 'state', 'zip',
      'status', 'property_type', 'listing_type',
      'list_price', 'commission_rate',
      'bedrooms', 'bathrooms', 'square_feet', 'year_built',
      'mls_number', 'listing_date', 'listing_expiry',
      'priority', 'notes'
    ],
    templateSample: [{
      property_address: '123 Main St',
      city: 'Boulder',
      state: 'CO',
      zip: '80302',
      status: 'Active',
      property_type: 'Single Family',
      listing_type: 'Exclusive Right to Sell',
      list_price: '750000',
      commission_rate: '3.0',
      bedrooms: '4',
      bathrooms: '2.5',
      square_feet: '2400',
      year_built: '1998',
      mls_number: 'MLS-12345',
      listing_date: '2026-04-01',
      listing_expiry: '2026-10-01',
      priority: 'High',
      notes: 'Owner motivated'
    }],
    requiredHeaders: ['property_address'],
    mapRow: (r) => {
      if (!r.property_address?.trim()) return null
      return {
        name: r.property_address.trim(),
        property_address: r.property_address.trim(),
        city: r.city?.trim() || null,
        state: r.state?.trim() || null,
        zip: r.zip?.trim() || null,
        status: r.status?.trim() || 'Active',
        property_type: r.property_type?.trim() || null,
        listing_type: r.listing_type?.trim() || 'Exclusive Right to Sell',
        list_price: Number(r.list_price) || 0,
        commission_rate: Number(r.commission_rate) || 3.0,
        bedrooms: r.bedrooms ? parseInt(r.bedrooms, 10) : null,
        bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
        square_feet: r.square_feet ? parseInt(r.square_feet, 10) : null,
        year_built: r.year_built ? parseInt(r.year_built, 10) : null,
        mls_number: r.mls_number?.trim() || null,
        listing_date: r.listing_date?.trim() || null,
        listing_expiry: r.listing_expiry?.trim() || null,
        priority: r.priority?.trim() || 'Medium',
        notes: r.notes?.trim() || null
      }
    },
    validateRow: (r) => r.property_address ? null : 'Property address is required'
  }), [])

  async function handleImport(rows) {
    const payload = rows.map(r => ({ ...r, user_id: user.id }))
    const { error } = await supabase.from('projects').insert(payload)
    if (error) throw error
    window.location.reload()
  }

  return (
    <>
      <Topbar
        title="Active Listings"
        subtitle="Every property you represent — status, showings, and days on market"
        onMenuClick={openSidebar}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" /> Import
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus className="w-4 h-4" /> Add Listing
            </Button>
          </>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address, city, or MLS…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_FILTER} className="md:w-48" />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={PROPERTY_TYPE_FILTER} className="md:w-48" />
      </div>

      <Card padding="p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={6} cols={7} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Home}
            title={listings.length === 0 ? 'No active listings' : 'No listings match your filters'}
            description={listings.length === 0
              ? 'Add your first listing to track showings, offers, and days on market.'
              : 'Try clearing the filters or search.'}
            action={listings.length === 0
              ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4" /> Import CSV</Button>
                  <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Add listing</Button>
                </div>
              )
              : <Button size="sm" variant="outline" onClick={() => { setSearch(''); setStatusFilter('All'); setTypeFilter('All') }}>Clear filters</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Property</th>
                  <th className="text-right font-medium px-3 py-3">List Price</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3 hidden md:table-cell">DOM</th>
                  <th className="text-center font-medium px-3 py-3 hidden lg:table-cell">Showings / Offers</th>
                  <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Expires</th>
                  <th className="text-right font-medium px-3 py-3 hidden xl:table-cell">Est. Commission</th>
                  <th className="px-3 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y-hairline divide-line">
                {filtered.map(p => {
                  const dom = daysOnMarket(p.listing_date, p.days_on_market)
                  const list = Number(p.list_price || 0)
                  const rate = Number(p.commission_rate || 0)
                  const commission = list * (rate / 100)
                  const offers = Number(p.offer_count || 0)
                  const showings = Number(p.showing_count || 0)
                  const needsPriceCut = p.status === 'Active' && dom > 21 && offers === 0
                  return (
                    <tr key={p.id} className="hover:bg-canvas/30">
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.property_address || p.name || 'Untitled listing'}</div>
                            <div className="text-xs text-ink-muted truncate">
                              {[p.city, p.state, p.zip].filter(Boolean).join(', ') || (p.mls_number ? `MLS ${p.mls_number}` : '—')}
                            </div>
                            {needsPriceCut && (
                              <span
                                className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={{ background: '#fef3c7', color: '#92400e' }}
                              >
                                <AlertTriangle className="w-3 h-3" /> Consider price reduction
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{formatCurrency(p.list_price)}</td>
                      <td className="px-3 py-3"><StatusPill value={p.status} /></td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <DOMCell days={dom} />
                      </td>
                      <td className="px-3 py-3 text-center text-ink-muted hidden lg:table-cell">
                        <span className="font-medium text-ink">{showings}</span> / <span className="font-medium text-ink">{offers}</span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-ink-muted">{formatDate(p.listing_expiry)}</td>
                      <td className="px-3 py-3 hidden xl:table-cell text-right text-ink-muted">{formatCurrency(commission)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => openEdit(p)} aria-label="Edit">
                            <Pencil className="w-4 h-4 text-ink-muted" />
                          </button>
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => setDeleting(p)} aria-label="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ListingForm open={formOpen} onClose={closeForm} onSubmit={handleSubmit} initial={editing} clients={clients} />

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting?.property_address || deleting?.name || 'listing'}
      />

      <CSVImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entityName="listings"
        templateHeaders={importConfig.templateHeaders}
        templateSample={importConfig.templateSample}
        requiredHeaders={importConfig.requiredHeaders}
        mapRow={importConfig.mapRow}
        validateRow={importConfig.validateRow}
        onImport={handleImport}
      />
    </>
  )
}
