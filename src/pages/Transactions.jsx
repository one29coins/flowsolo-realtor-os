import { useMemo, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, CheckSquare, CheckCircle2, Circle, Clock, AlertTriangle,
  Pencil, Trash2, Home, Calendar, DollarSign, ChevronRight, FileText
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input, { Textarea } from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import { useTransactions } from '../hooks/useTransactions'
import { useClients } from '../hooks/useClients'
import { useListings } from '../hooks/useListings'
import { TRANSACTION_TYPES } from '../lib/realtorConstants'
import { formatCurrency, formatDate, toISODate } from '../lib/format'
import { toast } from '../lib/toast'

const ACTIVE_STATUSES = ['Under Contract', 'Pending']
const ALL_STATUSES = ['Under Contract', 'Pending', 'Closed', 'Cancelled']

const EMPTY_TX = {
  listing_id: '',
  client_id: '',
  transaction_type: 'Sale',
  status: 'Under Contract',
  offer_price: '',
  accepted_price: '',
  earnest_money: '',
  commission_rate: 3.0,
  brokerage_split: 70,
  closing_date: '',
  notes: ''
}

// Milestone configuration — order matches spec
const MILESTONES = [
  { key: 'offer_accepted',         label: 'Offer accepted',              dateField: 'created_at',                   type: 'derived-status' },
  { key: 'earnest_money_sent',     label: 'Earnest money sent',          dateField: null,                            type: 'bool',   boolField: 'earnest_money_received', subtitle: 'Sent by buyer' },
  { key: 'earnest_money_received', label: 'Earnest money received',      dateField: null,                            type: 'bool',   boolField: 'earnest_money_received' },
  { key: 'inspection_scheduled',   label: 'Inspection scheduled',        dateField: 'inspection_date',               type: 'date-set' },
  { key: 'inspection_complete',    label: 'Inspection completed',        dateField: 'inspection_date',               type: 'bool',   boolField: 'inspection_complete' },
  { key: 'inspection_objections',  label: 'Inspection objections deadline', dateField: 'inspection_objections_deadline', type: 'deadline' },
  { key: 'inspection_resolved',    label: 'Inspection resolution',       dateField: 'inspection_objections_deadline', type: 'bool',   boolField: 'inspection_resolved' },
  { key: 'appraisal_ordered',      label: 'Appraisal ordered',           dateField: 'appraisal_date',                type: 'date-set' },
  { key: 'appraisal_complete',     label: 'Appraisal completed',         dateField: 'appraisal_date',                type: 'bool',   boolField: 'appraisal_complete' },
  { key: 'appraisal_contingency',  label: 'Appraisal contingency deadline', dateField: 'appraisal_contingency_deadline', type: 'deadline' },
  { key: 'financing_deadline',     label: 'Financing deadline',          dateField: 'financing_deadline',            type: 'deadline' },
  { key: 'financing_approved',     label: 'Financing approved',          dateField: 'financing_deadline',            type: 'bool',   boolField: 'financing_approved' },
  { key: 'title_ordered',          label: 'Title ordered',               dateField: null,                            type: 'bool',   boolField: 'title_ordered' },
  { key: 'title_clear',            label: 'Title clear',                 dateField: null,                            type: 'bool',   boolField: 'title_clear' },
  { key: 'final_walkthrough_scheduled', label: 'Final walkthrough scheduled', dateField: 'final_walkthrough_date',   type: 'date-set' },
  { key: 'final_walkthrough_complete',  label: 'Final walkthrough completed', dateField: 'final_walkthrough_date',   type: 'bool',   boolField: 'final_walkthrough_complete' },
  { key: 'closing_docs_sent',      label: 'Closing docs sent',           dateField: 'closing_docs_sent_date',        type: 'date-set' },
  { key: 'closing_day',            label: 'Closing day',                 dateField: 'closing_date',                  type: 'bool',   boolField: 'closing_complete' },
  { key: 'keys_delivered',         label: 'Keys delivered',              dateField: 'closing_date',                  type: 'bool',   boolField: 'keys_delivered' },
  { key: 'commission_received',    label: 'Commission received',         dateField: 'closing_date',                  type: 'bool',   boolField: 'commission_received' }
]

function StatusPill({ status }) {
  const styles = {
    'Under Contract': { bg: '#dbeafe', fg: '#1e40af' },
    'Pending':        { bg: '#fef9c3', fg: '#854d0e' },
    'Closed':         { bg: '#dcfce7', fg: '#166534' },
    'Cancelled':      { bg: '#fee2e2', fg: '#991b1b' }
  }
  const s = styles[status] || styles['Under Contract']
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  )
}

function daysUntil(iso) {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function computeMilestoneState(tx, m) {
  // Determines: { checked: bool, deadline: string|null, completedDate: string|null, status: 'done'|'overdue'|'due-soon'|'pending' }
  let checked = false
  let deadline = null
  let completedDate = null

  if (m.type === 'derived-status') {
    // Offer accepted = transaction exists at status Under Contract+
    checked = ['Under Contract', 'Pending', 'Closed'].includes(tx.status)
    completedDate = tx.created_at ? toISODate(tx.created_at) : null
  } else if (m.type === 'bool') {
    checked = !!tx[m.boolField]
    deadline = m.dateField ? tx[m.dateField] : null
    completedDate = checked && deadline ? deadline : null
  } else if (m.type === 'date-set') {
    checked = !!tx[m.dateField]
    deadline = tx[m.dateField] || null
    completedDate = checked ? deadline : null
  } else if (m.type === 'deadline') {
    deadline = tx[m.dateField] || null
    checked = false
  }

  let status = 'pending'
  if (checked) status = 'done'
  else if (deadline) {
    const d = daysUntil(deadline)
    if (d !== null && d < 0) status = 'overdue'
    else if (d !== null && d <= 3) status = 'due-soon'
  }

  return { checked, deadline, completedDate, status }
}

function MilestoneRow({ tx, milestone, idx, onToggle, onSetDate, onSaveNote }) {
  const state = computeMilestoneState(tx, milestone)
  const colors = {
    done:     'text-accent border-accent bg-accent/5',
    overdue:  'text-red-600 border-red-300 bg-red-50',
    'due-soon': 'text-warm-dark border-warm-light bg-warm-bg',
    pending:  'text-ink-muted border-line bg-white'
  }
  const Icon = state.checked ? CheckCircle2 : (state.status === 'overdue' ? AlertTriangle : (state.status === 'due-soon' ? Clock : Circle))

  const canToggle = milestone.type === 'bool' || milestone.type === 'derived-status'

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 border-hairline rounded-card ${colors[state.status]}`}>
      <div className="flex flex-col items-center pt-0.5">
        <button
          type="button"
          disabled={!canToggle}
          onClick={() => canToggle && onToggle(milestone, !state.checked)}
          className={`disabled:cursor-default ${canToggle ? 'hover:scale-110 transition-transform' : ''}`}
          title={canToggle ? 'Toggle milestone' : 'This milestone is set automatically'}
        >
          <Icon className="w-5 h-5" />
        </button>
        <div className="text-[10px] text-ink-muted mt-1">{idx + 1}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm font-medium ${state.checked ? 'line-through text-ink-muted' : 'text-ink'}`}>{milestone.label}</div>
          {state.status === 'overdue' && <span className="text-[11px] text-red-600 font-medium">Past due</span>}
          {state.status === 'due-soon' && <span className="text-[11px] text-warm-dark font-medium">Due soon</span>}
          {state.status === 'done' && state.completedDate && (
            <span className="text-[11px] text-accent-dark">Done {formatDate(state.completedDate)}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {milestone.dateField && milestone.type !== 'derived-status' && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3 text-ink-muted" />
              <input
                type="date"
                value={tx[milestone.dateField] || ''}
                onChange={(e) => onSetDate(milestone.dateField, e.target.value)}
                className="text-xs px-1.5 py-0.5 border-hairline border-line rounded bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Transactions() {
  const { openSidebar } = useOutletContext()
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions()
  const { clients } = useClients()
  const { listings } = useListings()

  const [selectedId, setSelectedId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_TX)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showClosed, setShowClosed] = useState(false)

  // Auto-select first active transaction
  const visible = useMemo(() => {
    return transactions.filter(t => showClosed ? true : ACTIVE_STATUSES.includes(t.status))
  }, [transactions, showClosed])

  useEffect(() => {
    if (!selectedId && visible.length > 0) {
      setSelectedId(visible[0].id)
    }
    if (selectedId && !transactions.some(t => t.id === selectedId)) {
      setSelectedId(visible[0]?.id || null)
    }
  }, [visible, selectedId, transactions])

  const selected = useMemo(() => transactions.find(t => t.id === selectedId) || null, [transactions, selectedId])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_TX)
    setFormOpen(true)
  }

  function openEdit(tx) {
    setEditing(tx)
    setForm({
      listing_id: tx.listing_id || '',
      client_id: tx.client_id || '',
      transaction_type: tx.transaction_type || 'Sale',
      status: tx.status || 'Under Contract',
      offer_price: tx.offer_price ?? '',
      accepted_price: tx.accepted_price ?? '',
      earnest_money: tx.earnest_money ?? '',
      commission_rate: tx.commission_rate ?? 3.0,
      brokerage_split: tx.brokerage_split ?? 70,
      closing_date: tx.closing_date || '',
      notes: tx.notes || ''
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_TX)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.closing_date) {
      toast.error('Closing date is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        listing_id: form.listing_id || null,
        client_id: form.client_id || null,
        offer_price: form.offer_price === '' ? null : Number(form.offer_price),
        accepted_price: form.accepted_price === '' ? null : Number(form.accepted_price),
        earnest_money: form.earnest_money === '' ? null : Number(form.earnest_money),
        commission_rate: form.commission_rate === '' ? null : Number(form.commission_rate),
        brokerage_split: form.brokerage_split === '' ? null : Number(form.brokerage_split)
      }
      if (editing) {
        await updateTransaction(editing.id, payload)
        toast.success('Transaction updated')
      } else {
        const created = await addTransaction(payload)
        toast.success('Transaction added')
        if (created?.id) setSelectedId(created.id)
      }
      closeForm()
    } catch (err) {
      toast.error(err.message || 'Could not save transaction')
    } finally {
      setSaving(false)
    }
  }

  async function toggleMilestone(milestone, checked) {
    if (!selected) return
    try {
      if (milestone.type === 'derived-status') {
        // Toggle status between Under Contract and Cancelled? Skip — derived.
        toast.info('Offer accepted is tied to transaction status')
        return
      }
      const patch = { [milestone.boolField]: checked }
      // Closing day toggle should also update status if completing
      if (milestone.boolField === 'closing_complete' && checked) {
        patch.status = 'Closed'
      }
      await updateTransaction(selected.id, patch)
    } catch (err) {
      toast.error(err.message || 'Could not update milestone')
    }
  }

  async function setMilestoneDate(field, value) {
    if (!selected) return
    try {
      await updateTransaction(selected.id, { [field]: value || null })
    } catch (err) {
      toast.error(err.message || 'Could not update date')
    }
  }

  async function handleDelete() {
    try {
      await deleteTransaction(deleting.id)
      toast.success('Transaction deleted')
      if (deleting.id === selectedId) setSelectedId(null)
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Summary
  const summary = useMemo(() => {
    if (!selected) return null
    const dtc = daysUntil(selected.closing_date)
    const commission = (Number(selected.accepted_price) || 0)
      * (Number(selected.commission_rate || 0) / 100)
      * (Number(selected.brokerage_split || 0) / 100)
    let done = 0
    let overdue = 0
    MILESTONES.forEach(m => {
      const s = computeMilestoneState(selected, m)
      if (s.checked) done++
      else if (s.status === 'overdue') overdue++
    })
    return { dtc, commission, done, overdue, total: MILESTONES.length }
  }, [selected])

  return (
    <>
      <Topbar
        title="Transaction Checklist"
        subtitle="Every deal from offer to close — nothing falls through the cracks"
        onMenuClick={openSidebar}
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              Show closed
            </label>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add transaction
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <Card padding="p-0" className="h-[600px] animate-pulse" />
          <Card padding="p-0" className="h-[600px] animate-pulse" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckSquare}
            title="No active transactions"
            description="Add a transaction when a deal goes under contract to track every milestone."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add transaction
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* LEFT: Transaction list */}
          <Card padding="p-0" className="lg:max-h-[calc(100vh-180px)] overflow-y-auto lg:sticky lg:top-4 lg:self-start">
            <div className="px-4 py-3 border-b-hairline border-line bg-canvas/40">
              <div className="text-xs font-semibold text-ink uppercase tracking-wide">
                {showClosed ? 'All transactions' : 'Active transactions'}
              </div>
              <div className="text-xs text-ink-muted mt-0.5">{visible.length} deal{visible.length === 1 ? '' : 's'}</div>
            </div>
            <div className="divide-y-hairline divide-line">
              {visible.map(tx => {
                const isSelected = tx.id === selectedId
                const dtc = daysUntil(tx.closing_date)
                const closingSoon = dtc !== null && dtc >= 0 && dtc <= 7
                const closingOverdue = dtc !== null && dtc < 0 && tx.status !== 'Closed'
                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedId(tx.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-realtor-bg/60' : 'hover:bg-canvas/40'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink truncate">
                          {tx.listing?.property_address || tx.listing?.name || 'Unlinked deal'}
                        </div>
                        <div className="text-xs text-ink-muted truncate mt-0.5">
                          {tx.client?.name || 'No client'}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusPill status={tx.status} />
                          <span className={`text-[11px] ${closingOverdue || closingSoon ? 'text-red-600 font-medium' : 'text-ink-muted'}`}>
                            {tx.closing_date ? formatDate(tx.closing_date) : 'No close date'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-realtor' : 'text-ink-muted'}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* RIGHT: Detail */}
          <div className="space-y-5 min-w-0">
            {selected ? (
              <>
                {/* Header */}
                <Card padding="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-4 h-4 text-realtor" />
                        <h2 className="text-xl font-semibold text-ink truncate">
                          {selected.listing?.property_address || selected.listing?.name || 'Unlinked transaction'}
                        </h2>
                      </div>
                      <div className="text-sm text-ink-muted">
                        {selected.client?.name || 'No client'}{selected.client?.client_type ? ` · ${selected.client.client_type}` : ''}
                        {selected.transaction_type ? ` · ${selected.transaction_type}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(selected)} className="p-2 hover:bg-canvas rounded-btn" title="Edit">
                        <Pencil className="w-4 h-4 text-ink-muted" />
                      </button>
                      <button onClick={() => setDeleting(selected)} className="p-2 hover:bg-canvas rounded-btn" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <div className="text-[11px] uppercase text-ink-muted tracking-wide">Accepted price</div>
                      <div className="text-base font-semibold text-ink mt-0.5">{formatCurrency(selected.accepted_price)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-ink-muted tracking-wide">Status</div>
                      <div className="mt-1"><StatusPill status={selected.status} /></div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-ink-muted tracking-wide">Closing</div>
                      <div className="text-base font-semibold text-ink mt-0.5">{formatDate(selected.closing_date)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase text-ink-muted tracking-wide">Days to close</div>
                      <div className={`text-base font-semibold mt-0.5 ${summary?.dtc !== null && summary?.dtc !== undefined && summary.dtc <= 7 && summary.dtc >= 0 ? 'text-warm-dark' : (summary?.dtc < 0 && selected.status !== 'Closed' ? 'text-red-600' : 'text-ink')}`}>
                        {summary?.dtc === null || summary?.dtc === undefined
                          ? '—'
                          : summary.dtc === 0
                          ? 'Today'
                          : summary.dtc > 0
                          ? `${summary.dtc} day${summary.dtc === 1 ? '' : 's'}`
                          : `${Math.abs(summary.dtc)} day${Math.abs(summary.dtc) === 1 ? '' : 's'} ago`}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                  {/* Milestone timeline */}
                  <Card padding="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">Milestone timeline</h3>
                        <p className="text-xs text-ink-muted">20 checkpoints from offer to commission received</p>
                      </div>
                      <div className="text-xs text-ink-muted">
                        <span className="font-semibold text-ink">{summary?.done || 0}</span> / {MILESTONES.length} complete
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-canvas rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${((summary?.done || 0) / MILESTONES.length) * 100}%` }}
                      />
                    </div>

                    <div className="space-y-2">
                      {MILESTONES.map((m, idx) => (
                        <MilestoneRow
                          key={m.key}
                          idx={idx}
                          milestone={m}
                          tx={selected}
                          onToggle={toggleMilestone}
                          onSetDate={setMilestoneDate}
                        />
                      ))}
                    </div>
                  </Card>

                  {/* Summary card */}
                  <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                    <Card padding="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-semibold">Deal summary</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-ink-muted">Days to closing</div>
                          <div className="text-lg font-semibold text-ink">
                            {summary?.dtc === null || summary?.dtc === undefined
                              ? '—'
                              : summary.dtc >= 0
                              ? `${summary.dtc} day${summary.dtc === 1 ? '' : 's'}`
                              : `${Math.abs(summary.dtc)} day${Math.abs(summary.dtc) === 1 ? '' : 's'} past`}
                          </div>
                        </div>
                        <div className="border-t-hairline border-line pt-3">
                          <div className="text-xs text-ink-muted">Commission at close</div>
                          <div className="text-lg font-semibold text-accent">{formatCurrency(summary?.commission || 0)}</div>
                          <div className="text-[11px] text-ink-muted mt-0.5">
                            {selected.commission_rate || 0}% × {selected.brokerage_split || 0}% split
                          </div>
                        </div>
                        <div className="border-t-hairline border-line pt-3">
                          <div className="text-xs text-ink-muted">Milestones complete</div>
                          <div className="text-lg font-semibold text-ink">
                            {summary?.done || 0} <span className="text-sm text-ink-muted">of {MILESTONES.length}</span>
                          </div>
                        </div>
                        <div className="border-t-hairline border-line pt-3">
                          <div className="text-xs text-ink-muted">Past due</div>
                          <div className={`text-lg font-semibold ${summary?.overdue ? 'text-red-600' : 'text-ink'}`}>
                            {summary?.overdue || 0}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {selected.notes && (
                      <Card padding="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-ink-muted" />
                          <h3 className="text-sm font-semibold">Notes</h3>
                        </div>
                        <p className="text-sm text-ink-muted whitespace-pre-wrap leading-relaxed">{selected.notes}</p>
                      </Card>
                    )}
                  </aside>
                </div>
              </>
            ) : (
              <Card>
                <EmptyState icon={CheckSquare} title="Select a transaction" description="Pick a deal from the list to see its milestone timeline." />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit transaction' : 'Add transaction'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Add transaction'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Listing" value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })}>
            <option value="">— None —</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>{l.property_address || l.name}</option>
            ))}
          </Select>
          <Select label="Client" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
            <option value="">— None —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.client_type})</option>
            ))}
          </Select>
          <Select label="Transaction type" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })} options={TRANSACTION_TYPES} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={ALL_STATUSES} />
          <Input label="Offer price" type="number" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} />
          <Input label="Accepted price" type="number" value={form.accepted_price} onChange={(e) => setForm({ ...form, accepted_price: e.target.value })} />
          <Input label="Earnest money" type="number" value={form.earnest_money} onChange={(e) => setForm({ ...form, earnest_money: e.target.value })} />
          <Input label="Closing date *" type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} required />
          <Input label="Commission rate (%)" type="number" step="0.1" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} />
          <Input label="Brokerage split (%)" type="number" step="1" value={form.brokerage_split} onChange={(e) => setForm({ ...form, brokerage_split: e.target.value })} hint="Your share of the gross commission" />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="md:col-span-2" />
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting ? (deleting.listing?.property_address || 'transaction') : 'transaction'}
      />
    </>
  )
}
