import { useState, useMemo, useEffect } from 'react'
import { X, Mail, Phone, Pencil, Clock, FileText, Plus, Home, Calendar, DollarSign, MessageCircle } from 'lucide-react'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import { Textarea } from '../components/ui/Input'
import FollowUpForm from '../components/forms/FollowUpForm'
import { useListings } from '../hooks/useListings'
import { useShowings } from '../hooks/useShowings'
import { useTransactions } from '../hooks/useTransactions'
import { useFollowUps } from '../hooks/useFollowUps'
import { useDocuments } from '../hooks/useDocuments'
import { useClients } from '../hooks/useClients'
import { formatCurrency, formatDate } from '../lib/format'
import { toast } from '../lib/toast'

const TABS = ['Overview', 'Listings', 'Showings', 'Transactions', 'Follow-Ups', 'Documents', 'Notes']

const STATUS_STYLES = {
  'Active':         { bg: '#dcfce7', fg: '#166534' },
  'Under Contract': { bg: '#e0e7ff', fg: '#3730a3' },
  'Closed':         { bg: '#ccfbf1', fg: '#115e59' },
  'Paused':         { bg: '#f1f5f9', fg: '#475569' },
  'Lost':           { bg: '#fee2e2', fg: '#991b1b' },
}

const TYPE_STYLES = {
  'Buyer':       { bg: '#dbeafe', fg: '#1e40af' },
  'Seller':      { bg: '#fef9c3', fg: '#854d0e' },
  'Both':        { bg: '#ede9fe', fg: '#5b21b6' },
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

export default function ClientDetail({ client, onClose, onEdit }) {
  const [tab, setTab] = useState('Overview')
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState(client.notes || '')
  const [notesSaving, setNotesSaving] = useState(false)

  const { listings } = useListings()
  const { showings } = useShowings()
  const { transactions } = useTransactions()
  const { followUps, addFollowUp } = useFollowUps()
  const { documents } = useDocuments()
  const { updateClient } = useClients()

  useEffect(() => { setNotesDraft(client.notes || '') }, [client.id, client.notes])

  const clientListings = useMemo(
    () => listings.filter(l => l.seller_id === client.id || l.client_id === client.id),
    [listings, client.id]
  )
  const clientShowings = useMemo(
    () => showings.filter(s => s.client_id === client.id),
    [showings, client.id]
  )
  const clientTransactions = useMemo(
    () => transactions.filter(t => t.client_id === client.id),
    [transactions, client.id]
  )
  const clientFollowUps = useMemo(
    () => followUps.filter(f => f.client_id === client.id),
    [followUps, client.id]
  )
  const clientDocuments = useMemo(
    () => documents.filter(d => d.client_id === client.id),
    [documents, client.id]
  )

  async function saveNotes() {
    try {
      setNotesSaving(true)
      await updateClient(client.id, { notes: notesDraft })
      toast.success('Notes saved')
    } catch (err) {
      toast.error(err.message || 'Could not save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  async function handleAddFollowUp(payload) {
    await addFollowUp({ ...payload, client_id: client.id })
  }

  const isBuyer = client.client_type === 'Buyer' || client.client_type === 'Both'
  const isSeller = client.client_type === 'Seller' || client.client_type === 'Both'

  // Available tabs depend on client type
  const visibleTabs = TABS.filter(t => {
    if (t === 'Listings' && !isSeller) return false
    if (t === 'Showings' && !isBuyer) return false
    return true
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch md:items-center justify-end md:justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-4xl md:rounded-card border-l-hairline md:border-hairline border-line h-full md:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b-hairline border-line flex items-start gap-4">
          <Avatar name={client.name} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <Pill value={client.client_type} palette={TYPE_STYLES} />
              <Pill value={client.transaction_status} palette={STATUS_STYLES} />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-ink-muted">
              {client.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {client.email}</span>}
              {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {client.phone}</span>}
              {client.preferred_contact && (
                <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Prefers {client.preferred_contact}</span>
              )}
              {client.closing_date && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Closing {formatDate(client.closing_date)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-canvas rounded-btn" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b-hairline border-line">
          <div className="flex items-center gap-1 overflow-x-auto -mb-px">
            {visibleTabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-3 text-sm border-b-2 transition-colors whitespace-nowrap
                  ${tab === t ? 'border-brand text-ink font-medium' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                {t}
                {t === 'Listings' && clientListings.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">({clientListings.length})</span>}
                {t === 'Showings' && clientShowings.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">({clientShowings.length})</span>}
                {t === 'Transactions' && clientTransactions.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">({clientTransactions.length})</span>}
                {t === 'Follow-Ups' && clientFollowUps.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">({clientFollowUps.length})</span>}
                {t === 'Documents' && clientDocuments.length > 0 && <span className="ml-1.5 text-xs text-ink-muted">({clientDocuments.length})</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === 'Overview' && <OverviewTab client={client} isBuyer={isBuyer} isSeller={isSeller} />}

          {tab === 'Listings' && (
            <List
              items={clientListings}
              emptyIcon={Home}
              emptyText="No listings for this seller yet."
              render={(l) => (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.property_address || l.name || 'Untitled listing'}</div>
                    <div className="text-xs text-ink-muted truncate">
                      {[l.city, l.state].filter(Boolean).join(', ')} · {l.property_type || 'Property'}
                    </div>
                  </div>
                  <Pill value={l.status} palette={STATUS_STYLES} />
                  <div className="text-sm w-28 text-right">{formatCurrency(l.list_price)}</div>
                </div>
              )}
            />
          )}

          {tab === 'Showings' && (
            <List
              items={clientShowings}
              emptyIcon={Clock}
              emptyText="No showings yet for this buyer."
              render={(s) => (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.property_address || 'Showing'}</div>
                    <div className="text-xs text-ink-muted">
                      {formatDate(s.showing_date)}{s.showing_time ? ` · ${s.showing_time}` : ''}
                      {s.duration_minutes ? ` · ${s.duration_minutes}m` : ''}
                    </div>
                  </div>
                  {typeof s.interest_level === 'number' && (
                    <span className="text-xs text-ink-muted">★ {s.interest_level}/5</span>
                  )}
                  <Pill value={s.status} palette={STATUS_STYLES} />
                </div>
              )}
            />
          )}

          {tab === 'Transactions' && (
            <List
              items={clientTransactions}
              emptyIcon={DollarSign}
              emptyText="No transactions yet for this client."
              render={(t) => (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.transaction_type || 'Transaction'}</div>
                    <div className="text-xs text-ink-muted">
                      Closing {formatDate(t.closing_date) || '—'}
                      {t.accepted_price ? ` · ${formatCurrency(t.accepted_price)}` : ''}
                    </div>
                  </div>
                  <Pill value={t.status} palette={STATUS_STYLES} />
                  <div className="text-sm w-28 text-right">{formatCurrency(t.net_commission || t.gross_commission)}</div>
                </div>
              )}
            />
          )}

          {tab === 'Follow-Ups' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-ink-muted">
                  {clientFollowUps.length
                    ? `${clientFollowUps.length} follow-up${clientFollowUps.length === 1 ? '' : 's'}`
                    : 'Schedule check-ins to keep this relationship warm.'}
                </div>
                <Button size="sm" onClick={() => setFollowUpOpen(true)}>
                  <Plus className="w-4 h-4" /> Add Follow-Up
                </Button>
              </div>
              <List
                items={clientFollowUps}
                emptyIcon={MessageCircle}
                emptyText="No follow-ups scheduled."
                render={(f) => (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{f.title}</div>
                      <div className="text-xs text-ink-muted">
                        {[f.follow_up_type || f.type, formatDate(f.follow_up_date), f.channel].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <Pill value={f.status} palette={STATUS_STYLES} />
                  </div>
                )}
              />
            </>
          )}

          {tab === 'Documents' && (
            <List
              items={clientDocuments}
              emptyIcon={FileText}
              emptyText="No documents for this client yet."
              render={(d) => (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-ink-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.title}</div>
                    <div className="text-xs text-ink-muted truncate">
                      {[d.category, d.document_type].filter(Boolean).join(' · ') || 'Uncategorized'}
                    </div>
                  </div>
                  {d.file_link
                    ? <a href={d.file_link} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">Open</a>
                    : null}
                </div>
              )}
            />
          )}

          {tab === 'Notes' && (
            <div className="space-y-3">
              <Textarea
                label="Internal notes"
                rows={10}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Track preferences, conversation history, deal context — anything you want to remember about this client."
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={notesSaving || notesDraft === (client.notes || '')}
                  onClick={() => setNotesDraft(client.notes || '')}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  loading={notesSaving}
                  disabled={notesDraft === (client.notes || '')}
                  onClick={saveNotes}
                >
                  Save notes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FollowUpForm
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        onSubmit={handleAddFollowUp}
        initial={null}
        clients={[client]}
        defaultClientId={client.id}
      />
    </div>
  )
}

function OverviewTab({ client, isBuyer, isSeller }) {
  const min = Number(client.budget_min || 0)
  const max = Number(client.budget_max || 0)
  const budgetText = (min || max)
    ? (min && max
        ? `${formatCurrency(min)} – ${formatCurrency(max)}`
        : (min ? `From ${formatCurrency(min)}` : `Up to ${formatCurrency(max)}`))
    : '—'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Client type" value={client.client_type || '—'} />
        <Stat label="Status" value={client.transaction_status || '—'} />
        <Stat label="Priority" value={client.priority || '—'} />
        <Stat label="Timeline" value={client.timeline || '—'} />
      </div>

      {isBuyer && (
        <Section title="Buyer details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Field label="Budget" value={budgetText} />
            <Field label="Property type" value={client.property_type || '—'} />
            <Field label="Desired location" value={client.desired_location || '—'} />
            <Field
              label="Pre-approved"
              value={
                client.pre_approved
                  ? `Yes${client.pre_approval_amount ? ` · ${formatCurrency(client.pre_approval_amount)}` : ''}${client.pre_approval_expiry ? ` (exp. ${formatDate(client.pre_approval_expiry)})` : ''}`
                  : 'Not yet'
              }
            />
            {client.must_haves && <Field label="Must-haves" value={client.must_haves} wide />}
            {client.deal_breakers && <Field label="Deal-breakers" value={client.deal_breakers} wide />}
          </div>
        </Section>
      )}

      {isSeller && (
        <Section title="Seller details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Field label="Property type" value={client.property_type || '—'} />
            <Field label="Listing location" value={client.desired_location || '—'} />
            <Field label="Target closing" value={formatDate(client.closing_date)} />
          </div>
        </Section>
      )}

      <Section title="Contact preferences">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="Email" value={client.email || '—'} />
          <Field label="Phone" value={client.phone || '—'} />
          <Field label="Preferred contact" value={client.preferred_contact || '—'} />
          <Field label="Referred by" value={client.referred_by || '—'} />
        </div>
      </Section>

      {client.notes && (
        <Section title="Notes">
          <p className="text-sm whitespace-pre-wrap text-ink">{client.notes}</p>
        </Section>
      )}
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="border-hairline border-line rounded-card p-3">
      <div className={`text-base font-semibold ${tone === 'warn' ? 'text-red-600' : ''}`}>{value}</div>
      <div className="text-xs text-ink-muted mt-1">{label}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-3">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 whitespace-pre-wrap">{value}</div>
    </div>
  )
}

function List({ items, render, emptyText, emptyIcon: Icon }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6 text-ink-muted">
        {Icon && <Icon className="w-8 h-8 mb-2 opacity-50" />}
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }
  return (
    <div className="border-hairline border-line rounded-card divide-y-hairline divide-line">
      {items.map((it) => (
        <div key={it.id} className="px-4 py-3">{render(it)}</div>
      ))}
    </div>
  )
}
