import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, Calendar, ClipboardList, UserPlus, CheckCircle2,
  Pencil, Trash2, Users, Home, MapPin, X, TrendingUp, Mail
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
import { useOpenHouses } from '../hooks/useOpenHouses'
import { useListings } from '../hooks/useListings'
import { formatDate, toISODate } from '../lib/format'
import { toast } from '../lib/toast'

const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled']

const EMPTY_OH = {
  listing_id: '',
  date: toISODate(new Date()),
  start_time: '',
  end_time: '',
  status: 'Scheduled',
  expected_visitors: '',
  visitors: '',
  sign_ins: [],
  notes: '',
  follow_ups_sent: false,
  leads_generated: ''
}

const EMPTY_SIGNIN = { name: '', phone: '', email: '', has_agent: false }

function StatusBadge({ status }) {
  const styles = {
    Scheduled: { bg: '#dcfce7', fg: '#166534' },
    Completed: { bg: '#ccfbf1', fg: '#0f766e' },
    Cancelled: { bg: '#f1f5f9', fg: '#64748b' }
  }
  const s = styles[status] || styles.Cancelled
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  )
}

function listingLabel(listing) {
  if (!listing) return 'Unlinked open house'
  const addr = listing.property_address || listing.name
  const cityState = [listing.city, listing.state].filter(Boolean).join(', ')
  return cityState ? `${addr} — ${cityState}` : addr
}

function timeRange(start, end) {
  if (!start && !end) return null
  const fmt = (t) => t ? t.slice(0, 5) : ''
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  return fmt(start || end)
}

export default function OpenHouses() {
  const { openSidebar } = useOutletContext()
  const { openHouses, loading, addOpenHouse, updateOpenHouse, deleteOpenHouse } = useOpenHouses()
  const { listings } = useListings()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_OH)
  const [saving, setSaving] = useState(false)

  const [signInOpen, setSignInOpen] = useState(false)
  const [signInOH, setSignInOH] = useState(null)

  const [deleting, setDeleting] = useState(null)

  const upcoming = useMemo(
    () => openHouses
      .filter(o => o.status === 'Scheduled')
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [openHouses]
  )
  const history = useMemo(
    () => openHouses
      .filter(o => o.status !== 'Scheduled')
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [openHouses]
  )

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthList = openHouses.filter(o => new Date(o.date) >= monthStart)
    const totalMonth = monthList.length
    const completed = openHouses.filter(o => o.status === 'Completed')
    const totalVisitors = completed.reduce((sum, o) => sum + (Number(o.visitors) || 0), 0)
    const avgVisitors = completed.length ? Math.round(totalVisitors / completed.length) : 0
    const totalLeads = openHouses.reduce((sum, o) => sum + (Number(o.leads_generated) || 0), 0)
    const conversionRate = totalVisitors ? Math.round((totalLeads / totalVisitors) * 100) : 0
    return { totalMonth, avgVisitors, totalLeads, conversionRate }
  }, [openHouses])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_OH)
    setFormOpen(true)
  }

  function openEdit(oh) {
    setEditing(oh)
    setForm({
      listing_id: oh.listing_id || '',
      date: oh.date || toISODate(new Date()),
      start_time: oh.start_time || '',
      end_time: oh.end_time || '',
      status: oh.status || 'Scheduled',
      expected_visitors: oh.expected_visitors ?? '',
      visitors: oh.visitors ?? '',
      sign_ins: Array.isArray(oh.sign_ins) ? oh.sign_ins : [],
      notes: oh.notes || '',
      follow_ups_sent: !!oh.follow_ups_sent,
      leads_generated: oh.leads_generated ?? ''
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_OH)
  }

  function addSignInRow() {
    setForm(f => ({ ...f, sign_ins: [...(f.sign_ins || []), { ...EMPTY_SIGNIN }] }))
  }

  function updateSignIn(idx, patch) {
    setForm(f => ({
      ...f,
      sign_ins: f.sign_ins.map((s, i) => i === idx ? { ...s, ...patch } : s)
    }))
  }

  function removeSignIn(idx) {
    setForm(f => ({ ...f, sign_ins: f.sign_ins.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.date) {
      toast.error('Date is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        listing_id: form.listing_id || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        expected_visitors: form.expected_visitors === '' ? 0 : Number(form.expected_visitors),
        visitors: form.visitors === '' ? 0 : Number(form.visitors),
        leads_generated: form.leads_generated === '' ? 0 : Number(form.leads_generated),
        sign_ins: form.sign_ins || []
      }
      if (editing) {
        await updateOpenHouse(editing.id, payload)
        toast.success('Open house updated')
      } else {
        await addOpenHouse(payload)
        toast.success('Open house scheduled')
      }
      closeForm()
    } catch (err) {
      toast.error(err.message || 'Could not save open house')
    } finally {
      setSaving(false)
    }
  }

  function openSignIns(oh) {
    setSignInOH(oh)
    setSignInOpen(true)
  }

  async function quickAddVisitor(oh) {
    const name = window.prompt('Visitor name:')
    if (!name || !name.trim()) return
    const phone = window.prompt('Phone (optional):') || ''
    const email = window.prompt('Email (optional):') || ''
    const newRow = { name: name.trim(), phone: phone.trim(), email: email.trim(), has_agent: false }
    const sign_ins = [...(Array.isArray(oh.sign_ins) ? oh.sign_ins : []), newRow]
    try {
      await updateOpenHouse(oh.id, { sign_ins, visitors: (Number(oh.visitors) || 0) + 1 })
      toast.success('Visitor added')
    } catch (err) {
      toast.error(err.message || 'Could not add visitor')
    }
  }

  async function markComplete(oh) {
    const input = window.prompt(`Mark "${listingLabel(oh.listing)}" as completed.\nHow many visitors showed up?`, String(oh.visitors || oh.expected_visitors || 0))
    if (input === null) return
    const visitors = Math.max(0, Number(input) || 0)
    try {
      await updateOpenHouse(oh.id, { status: 'Completed', visitors })
      toast.success('Open house marked complete')
    } catch (err) {
      toast.error(err.message || 'Could not update')
    }
  }

  async function handleDelete() {
    try {
      await deleteOpenHouse(deleting.id)
      toast.success('Open house deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <Topbar
        title="Open Houses"
        subtitle="Plan, run, and follow up on every open house"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Schedule open house
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-6">
          {/* Upcoming */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">Upcoming open houses</h2>
              <span className="text-xs text-ink-muted">{upcoming.length} scheduled</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[0,1].map(i => <div key={i} className="bg-white border-hairline border-line rounded-card h-44 animate-pulse" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Calendar}
                  title="No open houses scheduled"
                  description="Schedule your next open house to track visitors and generate leads."
                  action={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Schedule one</Button>}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming.map(oh => {
                  const mls = oh.listing?.mls_number
                  const address = oh.listing?.property_address || oh.listing?.name || 'No listing linked'
                  const cityState = oh.listing && [oh.listing.city, oh.listing.state].filter(Boolean).join(', ')
                  const range = timeRange(oh.start_time, oh.end_time)
                  return (
                    <Card key={oh.id} padding="p-4" className="hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-ink leading-snug truncate" title={address}>{address}</div>
                          {cityState && (
                            <div className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {cityState}
                            </div>
                          )}
                          {mls && <div className="text-[11px] text-ink-muted mt-0.5">MLS #{mls}</div>}
                        </div>
                        <StatusBadge status={oh.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <div className="text-[11px] text-ink-muted uppercase">Date</div>
                          <div className="font-medium">{formatDate(oh.date)}</div>
                          {range && <div className="text-xs text-ink-muted">{range}</div>}
                        </div>
                        <div>
                          <div className="text-[11px] text-ink-muted uppercase">Expected</div>
                          <div className="font-medium flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-ink-muted" />
                            {oh.expected_visitors || 0} visitors
                          </div>
                          <div className="text-xs text-ink-muted">{(oh.sign_ins?.length || 0)} signed in</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t-hairline border-line flex flex-wrap items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openSignIns(oh)}>
                          <ClipboardList className="w-3.5 h-3.5" /> Sign-in sheet
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => quickAddVisitor(oh)}>
                          <UserPlus className="w-3.5 h-3.5" /> Add visitor
                        </Button>
                        <Button size="sm" variant="accent" onClick={() => markComplete(oh)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark complete
                        </Button>
                        <div className="ml-auto flex items-center gap-1">
                          <button onClick={() => openEdit(oh)} className="p-1.5 hover:bg-canvas rounded-btn" title="Edit">
                            <Pencil className="w-3.5 h-3.5 text-ink-muted" />
                          </button>
                          <button onClick={() => setDeleting(oh)} className="p-1.5 hover:bg-canvas rounded-btn" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">Open house history</h2>
              <span className="text-xs text-ink-muted">{history.length} past</span>
            </div>
            <Card padding="p-0">
              {history.length === 0 ? (
                <div className="text-center text-sm text-ink-muted py-10">
                  No past open houses yet. Completed events show up here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Date</th>
                        <th className="text-left font-medium px-3 py-3">Address</th>
                        <th className="text-right font-medium px-3 py-3">Visitors</th>
                        <th className="text-right font-medium px-3 py-3 hidden md:table-cell">Leads</th>
                        <th className="text-center font-medium px-3 py-3 hidden md:table-cell">Follow-ups</th>
                        <th className="text-left font-medium px-3 py-3">Status</th>
                        <th className="px-3 py-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-hairline divide-line">
                      {history.map(oh => (
                        <tr key={oh.id} className="hover:bg-canvas/30">
                          <td className="px-4 py-3 text-ink-muted">{formatDate(oh.date)}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium truncate max-w-[260px]">{oh.listing?.property_address || oh.listing?.name || '—'}</div>
                            {oh.listing?.city && <div className="text-xs text-ink-muted">{oh.listing.city}</div>}
                          </td>
                          <td className="px-3 py-3 text-right font-medium">{oh.visitors || 0}</td>
                          <td className="px-3 py-3 text-right hidden md:table-cell">{oh.leads_generated || 0}</td>
                          <td className="px-3 py-3 text-center hidden md:table-cell">
                            {oh.follow_ups_sent
                              ? <CheckCircle2 className="w-4 h-4 text-accent inline" />
                              : <span className="text-ink-muted">—</span>}
                          </td>
                          <td className="px-3 py-3"><StatusBadge status={oh.status} /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => openEdit(oh)} className="p-1.5 hover:bg-canvas rounded-btn" title="Edit">
                                <Pencil className="w-3.5 h-3.5 text-ink-muted" />
                              </button>
                              <button onClick={() => setDeleting(oh)} className="p-1.5 hover:bg-canvas rounded-btn" title="Delete">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Performance sidebar */}
        <aside className="lg:sticky lg:top-4 space-y-3 lg:self-start">
          <Card padding="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-realtor" />
              <h3 className="text-sm font-semibold">Performance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-muted">This month</div>
                <div className="text-xl font-semibold text-ink">{stats.totalMonth}</div>
                <div className="text-xs text-ink-muted">open houses</div>
              </div>
              <div className="border-t-hairline border-line pt-3">
                <div className="text-xs text-ink-muted">Avg visitors</div>
                <div className="text-xl font-semibold text-ink">{stats.avgVisitors}</div>
                <div className="text-xs text-ink-muted">per completed event</div>
              </div>
              <div className="border-t-hairline border-line pt-3">
                <div className="text-xs text-ink-muted">Leads generated</div>
                <div className="text-xl font-semibold text-warm">{stats.totalLeads}</div>
                <div className="text-xs text-ink-muted">total from all events</div>
              </div>
              <div className="border-t-hairline border-line pt-3">
                <div className="text-xs text-ink-muted">Visitor-to-lead</div>
                <div className="text-xl font-semibold text-accent">{stats.conversionRate}%</div>
                <div className="text-xs text-ink-muted">conversion rate</div>
              </div>
            </div>
          </Card>

          <Card padding="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-ink-muted" />
              <h3 className="text-sm font-semibold">Follow-up reminder</h3>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Send a thank-you message to every signed-in visitor within 24 hours. Toggle &ldquo;Follow-ups sent&rdquo; on each open house once done.
            </p>
          </Card>
        </aside>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit open house' : 'Schedule open house'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Schedule'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Listing" value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })} className="md:col-span-2">
              <option value="">— Unlinked —</option>
              {listings.map(l => (
                <option key={l.id} value={l.id}>{listingLabel(l)}</option>
              ))}
            </Select>
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
            <Input label="Start time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="End time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <Input label="Expected visitors" type="number" min="0" value={form.expected_visitors} onChange={(e) => setForm({ ...form, expected_visitors: e.target.value })} />
            <Input label="Actual visitors" type="number" min="0" value={form.visitors} onChange={(e) => setForm({ ...form, visitors: e.target.value })} />
            <Input label="Leads generated" type="number" min="0" value={form.leads_generated} onChange={(e) => setForm({ ...form, leads_generated: e.target.value })} />
            <label className="flex items-center gap-2 self-end h-10">
              <input
                type="checkbox"
                checked={form.follow_ups_sent}
                onChange={(e) => setForm({ ...form, follow_ups_sent: e.target.checked })}
                className="w-4 h-4 rounded border-line"
              />
              <span className="text-sm">Follow-ups sent</span>
            </label>
          </div>

          {/* Sign-ins */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink">Sign-ins</span>
              <Button type="button" size="sm" variant="outline" onClick={addSignInRow}>
                <Plus className="w-3.5 h-3.5" /> Add row
              </Button>
            </div>
            <div className="space-y-2">
              {(form.sign_ins || []).length === 0 && (
                <div className="text-xs text-ink-muted py-3 text-center border-hairline border-dashed border-line rounded-card">
                  No visitors yet. Add rows here or use the &ldquo;Add visitor&rdquo; button on the card.
                </div>
              )}
              {(form.sign_ins || []).map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1.4fr_auto_auto] gap-2 items-center">
                  <input
                    placeholder="Name"
                    value={row.name || ''}
                    onChange={(e) => updateSignIn(idx, { name: e.target.value })}
                    className="px-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <input
                    placeholder="Phone"
                    value={row.phone || ''}
                    onChange={(e) => updateSignIn(idx, { phone: e.target.value })}
                    className="px-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <input
                    placeholder="Email"
                    value={row.email || ''}
                    onChange={(e) => updateSignIn(idx, { email: e.target.value })}
                    className="px-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={!!row.has_agent}
                      onChange={(e) => updateSignIn(idx, { has_agent: e.target.checked })}
                      className="w-3.5 h-3.5"
                    />
                    Has agent
                  </label>
                  <button type="button" onClick={() => removeSignIn(idx)} className="p-1.5 hover:bg-canvas rounded-btn">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Marketing channels, signage placed, neighbors notified…" />
        </form>
      </Modal>

      {/* Sign-in viewer */}
      <Modal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        title={signInOH ? `Sign-ins — ${signInOH.listing?.property_address || signInOH.listing?.name || formatDate(signInOH.date)}` : 'Sign-ins'}
        size="lg"
        footer={<Button onClick={() => setSignInOpen(false)}>Close</Button>}
      >
        {signInOH ? (
          (signInOH.sign_ins || []).length === 0 ? (
            <div className="text-center text-sm text-ink-muted py-6">
              No sign-ins yet for this open house.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Name</th>
                    <th className="text-left font-medium px-3 py-2">Phone</th>
                    <th className="text-left font-medium px-3 py-2">Email</th>
                    <th className="text-center font-medium px-3 py-2">Has agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y-hairline divide-line">
                  {(signInOH.sign_ins || []).map((s, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium">{s.name || '—'}</td>
                      <td className="px-3 py-2 text-ink-muted">{s.phone || '—'}</td>
                      <td className="px-3 py-2 text-ink-muted">{s.email || '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {s.has_agent
                          ? <Badge value="Low">Yes</Badge>
                          : <Badge value="Done">No</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting ? (deleting.listing?.property_address || `open house on ${formatDate(deleting.date)}`) : 'open house'}
      />
    </>
  )
}
