import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, Trash2, Download, Eye, Calendar, Clock, Star,
  Home, MapPin, CheckCircle2, XCircle, Pencil, NotebookPen
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Input, { Textarea } from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import { useShowings } from '../hooks/useShowings'
import { useClients } from '../hooks/useClients'
import { useListings } from '../hooks/useListings'
import { formatDate, toISODate } from '../lib/format'
import { toCSV, downloadCSV } from '../lib/csv'
import { toast } from '../lib/toast'

const STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Cancelled', 'Rescheduled']
const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' }
]

function StarRating({ value, onChange, size = 5, readOnly = false }) {
  const v = Number(value || 0)
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => {
        const active = n <= v
        const Tag = readOnly ? 'span' : 'button'
        const sizeCls = size === 4 ? 'w-3.5 h-3.5' : 'w-4 h-4'
        return (
          <Tag
            key={n}
            type={readOnly ? undefined : 'button'}
            onClick={readOnly ? undefined : () => onChange?.(active && v === n ? 0 : n)}
            className={readOnly ? '' : 'p-0.5'}
            aria-label={readOnly ? undefined : `Rate ${n}`}
          >
            <Star className={`${sizeCls} ${active ? 'text-amber-400 fill-amber-400' : 'text-line'}`} />
          </Tag>
        )
      })}
    </div>
  )
}

const emptyQuick = {
  client_id: '',
  use_own_listing: true,
  listing_id: '',
  property_address: '',
  showing_date: toISODate(new Date()),
  showing_time: '',
  duration_minutes: 30,
  status: 'Scheduled',
  interest_level: 0
}

const emptyNotes = {
  client_feedback: '',
  agent_notes: '',
  offer_likely: false,
  follow_up_needed: false
}

export default function ShowingTracker() {
  const { openSidebar } = useOutletContext()
  const { showings, loading, addShowing, updateShowing, deleteShowing } = useShowings()
  const { clients } = useClients()
  const { listings } = useListings()

  const [quick, setQuick] = useState(emptyQuick)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesEditing, setNotesEditing] = useState(null) // showing object when editing existing
  const [notesForm, setNotesForm] = useState(emptyNotes)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState('')

  function setQ(k, v) { setQuick(p => ({ ...p, [k]: v })) }
  function setN(k, v) { setNotesForm(p => ({ ...p, [k]: v })) }

  function buildPayloadFromQuick() {
    if (!quick.client_id) {
      toast.error('Select a client first')
      return null
    }
    const useOwn = quick.use_own_listing
    const address = useOwn
      ? (listings.find(l => l.id === quick.listing_id)?.property_address || '')
      : quick.property_address.trim()
    if (!useOwn && !address) {
      toast.error('Enter a property address')
      return null
    }
    return {
      client_id: quick.client_id,
      listing_id: useOwn && quick.listing_id ? quick.listing_id : null,
      property_address: address || null,
      showing_date: quick.showing_date || toISODate(new Date()),
      showing_time: quick.showing_time || null,
      duration_minutes: Number(quick.duration_minutes) || 30,
      status: quick.status,
      interest_level: quick.interest_level ? Number(quick.interest_level) : null
    }
  }

  async function logShowing() {
    const base = buildPayloadFromQuick()
    if (!base) return

    // If completed, open notes modal so agent can add feedback before saving
    if (base.status === 'Completed') {
      setNotesEditing(null) // creating new with notes
      setNotesForm(emptyNotes)
      setNotesOpen(true)
      return
    }

    try {
      setSubmitting(true)
      await addShowing(base)
      toast.success('Showing logged')
      setQuick({ ...emptyQuick, showing_date: toISODate(new Date()) })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function saveWithNotes() {
    try {
      setSubmitting(true)
      if (notesEditing) {
        // Editing an existing showing's notes
        await updateShowing(notesEditing.id, {
          status: 'Completed',
          client_feedback: notesForm.client_feedback || null,
          agent_notes: notesForm.agent_notes || null,
          offer_likely: !!notesForm.offer_likely,
          follow_up_needed: !!notesForm.follow_up_needed
        })
        toast.success('Notes saved')
      } else {
        // New showing + notes from quick log
        const base = buildPayloadFromQuick()
        if (!base) { setSubmitting(false); return }
        await addShowing({
          ...base,
          status: 'Completed',
          client_feedback: notesForm.client_feedback || null,
          agent_notes: notesForm.agent_notes || null,
          offer_likely: !!notesForm.offer_likely,
          follow_up_needed: !!notesForm.follow_up_needed
        })
        toast.success('Showing logged')
        setQuick({ ...emptyQuick, showing_date: toISODate(new Date()) })
      }
      setNotesOpen(false)
      setNotesEditing(null)
      setNotesForm(emptyNotes)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function openNotesFor(s) {
    setNotesEditing(s)
    setNotesForm({
      client_feedback: s.client_feedback || '',
      agent_notes: s.agent_notes || '',
      offer_likely: !!s.offer_likely,
      follow_up_needed: !!s.follow_up_needed
    })
    setNotesOpen(true)
  }

  async function cancelShowing(s) {
    try {
      await updateShowing(s.id, { status: 'Cancelled' })
      toast.success('Showing cancelled')
    } catch (err) { toast.error(err.message) }
  }

  async function handleDelete() {
    try {
      await deleteShowing(deleting.id)
      toast.success('Showing deleted')
    } catch (err) { toast.error(err.message) }
  }

  // Derived
  const todayISO = toISODate(new Date())
  const upcoming = useMemo(() => {
    return showings
      .filter(s => s.status === 'Scheduled' && (s.showing_date || todayISO) >= todayISO)
      .sort((a, b) => {
        const ad = `${a.showing_date || ''} ${a.showing_time || ''}`
        const bd = `${b.showing_date || ''} ${b.showing_time || ''}`
        return ad.localeCompare(bd)
      })
  }, [showings, todayISO])

  const history = useMemo(() => {
    return showings
      .slice()
      .sort((a, b) => {
        const ad = `${a.showing_date || ''} ${a.showing_time || ''}`
        const bd = `${b.showing_date || ''} ${b.showing_time || ''}`
        return bd.localeCompare(ad)
      })
  }, [showings])

  const buyerSummary = useMemo(() => {
    if (!selectedClientId) return null
    const mine = showings.filter(s => s.client_id === selectedClientId)
    const total = mine.length
    const rated = mine.filter(s => s.interest_level != null)
    const avg = rated.length
      ? rated.reduce((s, x) => s + Number(x.interest_level || 0), 0) / rated.length
      : 0
    const hot = mine.filter(s => Number(s.interest_level || 0) >= 4).length
    const offers = mine.filter(s => s.offer_likely).length
    const conv = total ? (offers / total) * 100 : 0
    const client = clients.find(c => c.id === selectedClientId)
    return { client, total, avg, hot, offers, conv }
  }, [selectedClientId, showings, clients])

  function exportCSV() {
    if (!history.length) { toast.error('Nothing to export'); return }
    const rows = history.map(s => ({
      date: s.showing_date,
      time: s.showing_time || '',
      client: s.client?.name || clients.find(c => c.id === s.client_id)?.name || '',
      property_address: s.property_address || s.listing?.property_address || '',
      duration_minutes: s.duration_minutes || '',
      status: s.status,
      interest_level: s.interest_level ?? '',
      offer_likely: s.offer_likely ? 'yes' : 'no',
      follow_up_needed: s.follow_up_needed ? 'yes' : 'no',
      client_feedback: s.client_feedback || '',
      agent_notes: s.agent_notes || ''
    }))
    const csv = toCSV(rows, Object.keys(rows[0]))
    downloadCSV(`showings-${toISODate(new Date())}.csv`, csv)
    toast.success('Exported')
  }

  const ownListing = quick.use_own_listing
  const listingChosen = quick.listing_id ? listings.find(l => l.id === quick.listing_id) : null

  return (
    <>
      <Topbar
        title="Showing Tracker"
        subtitle="Log every showing, capture feedback, and track buyer interest"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Quick log */}
          <Card>
            <h3 className="text-sm font-medium mb-1">Quick log</h3>
            <p className="text-xs text-ink-muted mb-4">Capture a showing in seconds. Completed showings will prompt for notes.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Client *" value={quick.client_id} onChange={(e) => setQ('client_id', e.target.value)}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Property</label>
                <div className="flex items-center gap-1 bg-canvas border-hairline border-line rounded-btn p-1 mb-2 w-fit">
                  <button
                    type="button"
                    onClick={() => setQ('use_own_listing', true)}
                    className={`px-2.5 py-1 text-xs rounded-btn ${ownListing ? 'bg-white border-hairline border-line' : 'text-ink-muted'}`}
                  >
                    My listing
                  </button>
                  <button
                    type="button"
                    onClick={() => setQ('use_own_listing', false)}
                    className={`px-2.5 py-1 text-xs rounded-btn ${!ownListing ? 'bg-white border-hairline border-line' : 'text-ink-muted'}`}
                  >
                    Other property
                  </button>
                </div>
                {ownListing ? (
                  <Select value={quick.listing_id} onChange={(e) => setQ('listing_id', e.target.value)}>
                    <option value="">Select listing…</option>
                    {listings.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.property_address || l.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <input
                    type="text"
                    placeholder="123 Main St, Anytown"
                    value={quick.property_address}
                    onChange={(e) => setQ('property_address', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                )}
              </div>

              <Input
                label="Date"
                type="date"
                value={quick.showing_date}
                onChange={(e) => setQ('showing_date', e.target.value)}
              />
              <Input
                label="Time"
                type="time"
                value={quick.showing_time}
                onChange={(e) => setQ('showing_time', e.target.value)}
              />
              <Select label="Duration" value={quick.duration_minutes} onChange={(e) => setQ('duration_minutes', e.target.value)}>
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
              <Select label="Status" value={quick.status} onChange={(e) => setQ('status', e.target.value)} options={STATUSES} />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Interest level</label>
                <StarRating value={quick.interest_level} onChange={(v) => setQ('interest_level', v)} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <Button onClick={logShowing} loading={submitting}>
                <Plus className="w-4 h-4" /> {quick.status === 'Completed' ? 'Add notes & log' : 'Log showing'}
              </Button>
            </div>
          </Card>

          {/* Upcoming showings */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b-hairline border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-medium">Upcoming showings</h3>
              </div>
              <span className="text-xs text-ink-muted">{upcoming.length} scheduled</span>
            </div>
            {loading ? (
              <div className="p-5 text-sm text-ink-muted">Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">
                Nothing on the calendar — log your next showing above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {upcoming.map(s => {
                  const client = s.client || clients.find(c => c.id === s.client_id)
                  const address = s.property_address || s.listing?.property_address || s.listing?.name || 'Property TBD'
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedClientId(s.client_id)}
                      className="border-hairline border-line rounded-card p-4 hover:bg-canvas/30 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={client?.name || '?'} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium truncate">{client?.name || 'Unknown client'}</div>
                            <Badge value={s.status} />
                          </div>
                          <div className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{address}</span>
                          </div>
                          <div className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>
                              {formatDate(s.showing_date)}{s.showing_time ? ` · ${s.showing_time.slice(0, 5)}` : ''}
                              {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                            </span>
                          </div>
                          {s.interest_level != null && (
                            <div className="mt-2">
                              <StarRating value={s.interest_level} readOnly size={4} />
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); openNotesFor(s) }}
                            >
                              <NotebookPen className="w-3.5 h-3.5" /> Add notes
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); cancelShowing(s) }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* History */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b-hairline border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-ink-muted" />
                <h3 className="text-sm font-medium">Showing history</h3>
              </div>
              <span className="text-xs text-ink-muted">{history.length} total</span>
            </div>
            {loading ? (
              <div className="p-5 text-sm text-ink-muted">Loading…</div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={Home}
                title="No showings logged"
                description="Log your first showing to start tracking buyer interest and feedback."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                    <tr>
                      <th className="text-left font-medium px-5 py-3">Date</th>
                      <th className="text-left font-medium px-3 py-3">Client</th>
                      <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Address</th>
                      <th className="text-right font-medium px-3 py-3 hidden lg:table-cell">Duration</th>
                      <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Interest</th>
                      <th className="text-center font-medium px-3 py-3 hidden lg:table-cell">Offer likely</th>
                      <th className="text-left font-medium px-3 py-3">Status</th>
                      <th className="px-3 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-hairline divide-line">
                    {history.map(s => {
                      const client = s.client || clients.find(c => c.id === s.client_id)
                      const address = s.property_address || s.listing?.property_address || s.listing?.name || '—'
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedClientId(s.client_id)}
                          className="hover:bg-canvas/30 cursor-pointer"
                        >
                          <td className="px-5 py-3 whitespace-nowrap text-ink-muted">
                            {formatDate(s.showing_date)}
                            {s.showing_time && <span className="ml-1 text-xs">{s.showing_time.slice(0, 5)}</span>}
                          </td>
                          <td className="px-3 py-3 font-medium">{client?.name || '—'}</td>
                          <td className="px-3 py-3 text-ink-muted hidden md:table-cell truncate max-w-[220px]">{address}</td>
                          <td className="px-3 py-3 text-right text-ink-muted hidden lg:table-cell">
                            {s.duration_minutes ? `${s.duration_minutes}m` : '—'}
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            {s.interest_level != null
                              ? <StarRating value={s.interest_level} readOnly size={4} />
                              : <span className="text-xs text-ink-muted">—</span>}
                          </td>
                          <td className="px-3 py-3 text-center hidden lg:table-cell">
                            {s.offer_likely
                              ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                              : <span className="text-xs text-ink-muted">—</span>}
                          </td>
                          <td className="px-3 py-3"><Badge value={s.status} /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                className="p-1.5 hover:bg-canvas rounded-btn"
                                onClick={(e) => { e.stopPropagation(); openNotesFor(s) }}
                                title="Edit notes"
                              >
                                <Pencil className="w-4 h-4 text-ink-muted" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-canvas rounded-btn"
                                onClick={(e) => { e.stopPropagation(); setDeleting(s) }}
                                aria-label="Delete"
                              >
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
        </div>

        {/* Sidebar — buyer summary */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-medium">Buyer summary</h3>
            </div>

            <Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Pick a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            {!selectedClientId ? (
              <p className="text-xs text-ink-muted mt-3">
                Pick a client (or tap any showing) to see total showings, interest, and conversion rate.
              </p>
            ) : !buyerSummary || buyerSummary.total === 0 ? (
              <div className="text-xs text-ink-muted mt-3">No showings logged for this client yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar name={buyerSummary.client?.name} size={40} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{buyerSummary.client?.name}</div>
                    <div className="text-xs text-ink-muted">{buyerSummary.client?.client_type || 'Buyer'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-canvas/60 rounded-card">
                    <div className="text-[11px] text-ink-muted uppercase tracking-wide">Showings</div>
                    <div className="text-lg font-semibold">{buyerSummary.total}</div>
                  </div>
                  <div className="p-3 bg-canvas/60 rounded-card">
                    <div className="text-[11px] text-ink-muted uppercase tracking-wide">Avg interest</div>
                    <div className="text-lg font-semibold flex items-center gap-1">
                      {buyerSummary.avg.toFixed(1)}
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  </div>
                  <div className="p-3 bg-canvas/60 rounded-card">
                    <div className="text-[11px] text-ink-muted uppercase tracking-wide">High interest</div>
                    <div className="text-lg font-semibold">{buyerSummary.hot}</div>
                    <div className="text-[10px] text-ink-muted">4+ stars</div>
                  </div>
                  <div className="p-3 bg-canvas/60 rounded-card">
                    <div className="text-[11px] text-ink-muted uppercase tracking-wide">Conversion</div>
                    <div className="text-lg font-semibold">{buyerSummary.conv.toFixed(0)}%</div>
                    <div className="text-[10px] text-ink-muted">→ offer likely</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Notes Modal */}
      <Modal
        open={notesOpen}
        onClose={() => { setNotesOpen(false); setNotesEditing(null) }}
        title={notesEditing ? 'Showing notes' : 'Capture feedback for completed showing'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setNotesOpen(false); setNotesEditing(null) }} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={saveWithNotes} loading={submitting}>
              <CheckCircle2 className="w-4 h-4" /> Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Client feedback"
            rows={3}
            placeholder='Direct quotes — "Loved the kitchen, hated the yard"'
            value={notesForm.client_feedback}
            onChange={(e) => setN('client_feedback', e.target.value)}
          />
          <Textarea
            label="Agent notes"
            rows={3}
            placeholder="Your read of the room, next steps, anything to follow up on"
            value={notesForm.agent_notes}
            onChange={(e) => setN('agent_notes', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 border-hairline rounded-card cursor-pointer transition-colors ${notesForm.offer_likely ? 'border-brand bg-brand/5' : 'border-line hover:bg-canvas/40'}`}>
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand"
                checked={notesForm.offer_likely}
                onChange={(e) => setN('offer_likely', e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium">Offer likely</div>
                <div className="text-xs text-ink-muted">Buyer is seriously considering this property.</div>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 border-hairline rounded-card cursor-pointer transition-colors ${notesForm.follow_up_needed ? 'border-brand bg-brand/5' : 'border-line hover:bg-canvas/40'}`}>
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand"
                checked={notesForm.follow_up_needed}
                onChange={(e) => setN('follow_up_needed', e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium">Follow-up needed</div>
                <div className="text-xs text-ink-muted">Schedule a check-in before this lead goes cold.</div>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName="showing"
      />
    </>
  )
}
