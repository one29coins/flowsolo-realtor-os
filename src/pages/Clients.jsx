import { useMemo, useState, useEffect } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Users, Upload, Download, Mail, Phone, CheckCircle2 } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import CSVImport from '../components/ui/CSVImport'
import ClientForm from '../components/forms/ClientForm'
import ClientDetail from './ClientDetail'
import { useClients } from '../hooks/useClients'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toCSV, downloadCSV } from '../lib/csv'
import { clientImport } from '../lib/importHelpers'
import { CLIENT_TYPES, TRANSACTION_STATUSES } from '../lib/realtorConstants'
import { formatCurrency, formatDate } from '../lib/format'
import { toast } from '../lib/toast'

const CLIENT_TYPE_FILTER = ['All', ...CLIENT_TYPES]
const STATUS_FILTER = ['All', ...TRANSACTION_STATUSES]
const PRIORITY_FILTER = ['All', 'High', 'Medium', 'Low']

// Status pill colors per spec
const STATUS_STYLES = {
  'Active':         { bg: '#dcfce7', fg: '#166534' }, // green
  'Under Contract': { bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  'Closed':         { bg: '#ccfbf1', fg: '#115e59' }, // teal
  'Paused':         { bg: '#f1f5f9', fg: '#475569' }, // gray
  'Lost':           { bg: '#fee2e2', fg: '#991b1b' }, // red
}

const TYPE_STYLES = {
  'Buyer':  { bg: '#dbeafe', fg: '#1e40af' },
  'Seller': { bg: '#fef9c3', fg: '#854d0e' },
  'Both':   { bg: '#ede9fe', fg: '#5b21b6' },
  'Past Client': { bg: '#f1f5f9', fg: '#475569' },
}

function Pill({ value, palette }) {
  const map = palette || {}
  const s = map[value] || { bg: '#f1f5f9', fg: '#475569' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {value || '—'}
    </span>
  )
}

function budgetOrAddress(c) {
  // Buyers show budget; sellers show their listing address (desired_location is buyer's target,
  // sellers store the property they're selling on the projects table, but client can also have
  // desired_location, so we fall back to it for sellers).
  if (c.client_type === 'Seller') {
    return c.desired_location || '—'
  }
  const min = Number(c.budget_min || 0)
  const max = Number(c.budget_max || 0)
  if (!min && !max) return '—'
  if (min && max) return `${formatCurrency(min)} – ${formatCurrency(max)}`
  if (min) return `From ${formatCurrency(min)}`
  return `Up to ${formatCurrency(max)}`
}

export default function Clients() {
  const { openSidebar } = useOutletContext()
  const { user } = useAuth()
  const { clients, loading, addClient, updateClient, deleteClient, refetch } = useClients()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [detailId, setDetailId] = useState(null)

  useEffect(() => {
    const id = params.get('id')
    if (id) setDetailId(id)
  }, [params])

  const filtered = useMemo(() => {
    return clients.filter(c => {
      if (typeFilter !== 'All' && c.client_type !== typeFilter) return false
      if (statusFilter !== 'All' && c.transaction_status !== statusFilter) return false
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.desired_location?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [clients, search, typeFilter, statusFilter, priorityFilter])

  function openEdit(c) { setEditing(c); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditing(null) }
  function openDetail(id) { setDetailId(id); setParams({ id }, { replace: true }) }
  function closeDetail() {
    setDetailId(null)
    const next = new URLSearchParams(params); next.delete('id')
    setParams(next, { replace: true })
  }

  async function handleSubmit(payload) {
    if (editing) await updateClient(editing.id, payload)
    else await addClient(payload)
  }

  async function handleDelete() {
    try {
      await deleteClient(deleting.id)
      toast.success('Client deleted')
    } catch (err) { toast.error(err.message) }
  }

  async function handleImport(rows) {
    const payload = rows.map(r => ({ ...r, user_id: user.id }))
    const { error } = await supabase.from('clients').insert(payload)
    if (error) throw error
    await refetch()
  }

  function handleExport() {
    if (!filtered.length) { toast.error('Nothing to export'); return }
    const headers = [
      'name', 'email', 'phone', 'client_type', 'transaction_status',
      'property_type', 'budget_min', 'budget_max',
      'pre_approved', 'pre_approval_amount', 'pre_approval_expiry',
      'desired_location', 'must_haves', 'deal_breakers', 'timeline',
      'referred_by', 'closing_date', 'preferred_contact', 'priority', 'notes'
    ]
    const csv = toCSV(filtered.map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      client_type: c.client_type,
      transaction_status: c.transaction_status,
      property_type: c.property_type,
      budget_min: c.budget_min,
      budget_max: c.budget_max,
      pre_approved: c.pre_approved,
      pre_approval_amount: c.pre_approval_amount,
      pre_approval_expiry: c.pre_approval_expiry,
      desired_location: c.desired_location,
      must_haves: c.must_haves,
      deal_breakers: c.deal_breakers,
      timeline: c.timeline,
      referred_by: c.referred_by,
      closing_date: c.closing_date,
      preferred_contact: c.preferred_contact,
      priority: c.priority,
      notes: c.notes
    })), headers)
    downloadCSV(`clients-${new Date().toISOString().slice(0,10)}.csv`, csv)
    toast.success('Exported')
  }

  const detailClient = detailId ? clients.find(c => c.id === detailId) : null

  return (
    <>
      <Topbar
        title="Clients"
        subtitle="Buyers, sellers, and past clients — every relationship in one place"
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
              <Plus className="w-4 h-4" /> Add Client
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
            placeholder="Search clients…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={CLIENT_TYPE_FILTER} className="md:w-40" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_FILTER} className="md:w-44" />
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} options={PRIORITY_FILTER} className="md:w-32" />
      </div>

      <Card padding="p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={6} cols={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
            description={clients.length === 0
              ? 'Add your first buyer or seller to start tracking your real estate business.'
              : 'Try clearing the filters or search.'}
            action={clients.length === 0
              ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4" /> Import CSV</Button>
                  <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> Add client</Button>
                </div>
              )
              : <Button size="sm" variant="outline" onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setPriorityFilter('All') }}>Clear filters</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Budget / Property</th>
                  <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Pre-Approved</th>
                  <th className="text-left font-medium px-3 py-3 hidden xl:table-cell">Timeline</th>
                  <th className="px-3 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y-hairline divide-line">
                {filtered.map(c => {
                  const isBuyer = c.client_type === 'Buyer' || c.client_type === 'Both'
                  return (
                    <tr key={c.id} className="hover:bg-canvas/30 cursor-pointer" onClick={() => openDetail(c.id)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size={32} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-xs text-ink-muted truncate">{c.email || c.phone || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <Pill value={c.client_type} palette={TYPE_STYLES} />
                      </td>
                      <td className="px-3 py-3">
                        <Pill value={c.transaction_status} palette={STATUS_STYLES} />
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-ink-muted">
                        {budgetOrAddress(c)}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        {isBuyer
                          ? (c.pre_approved
                              ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                  {c.pre_approval_amount ? <span className="text-ink-muted font-normal">· {formatCurrency(c.pre_approval_amount)}</span> : null}
                                </span>
                              )
                              : <span className="text-xs text-ink-muted">Not yet</span>)
                          : <span className="text-xs text-ink-muted">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 hidden xl:table-cell text-ink-muted">{c.timeline || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="p-1.5 hover:bg-canvas rounded-btn" aria-label="Email" title={c.email}>
                              <Mail className="w-4 h-4 text-ink-muted" />
                            </a>
                          )}
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="p-1.5 hover:bg-canvas rounded-btn" aria-label="Call" title={c.phone}>
                              <Phone className="w-4 h-4 text-ink-muted" />
                            </a>
                          )}
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => openEdit(c)} aria-label="Edit">
                            <Pencil className="w-4 h-4 text-ink-muted" />
                          </button>
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => setDeleting(c)} aria-label="Delete">
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

      <ClientForm open={formOpen} onClose={closeForm} onSubmit={handleSubmit} initial={editing} />

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting?.name || 'client'}
      />

      <CSVImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entityName="clients"
        templateHeaders={clientImport.templateHeaders}
        templateSample={clientImport.templateSample}
        requiredHeaders={clientImport.requiredHeaders}
        mapRow={clientImport.mapRow}
        validateRow={clientImport.validateRow}
        onImport={handleImport}
      />

      {detailClient && (
        <ClientDetail client={detailClient} onClose={closeDetail} onEdit={() => openEdit(detailClient)} />
      )}
    </>
  )
}
