import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Plus, TrendingUp, ArrowRight, MessageSquare, UserCheck,
  Pencil, Trash2, Mail, Phone, Clock, MapPin
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
import { useLeads } from '../hooks/useLeads'
import { useClients } from '../hooks/useClients'
import {
  LEAD_STAGES,
  LEAD_SOURCES,
  PROPERTY_TYPES,
  TIMELINE_OPTIONS
} from '../lib/realtorConstants'
import { formatCurrency, formatDate, isOverdue, toISODate } from '../lib/format'
import { toast } from '../lib/toast'

const STAGE_STYLES = {
  'New Lead':       { bar: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  'Contacted':      { bar: 'bg-blue-500',   chip: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  'Qualified':      { bar: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  'Showing':        { bar: 'bg-amber-500',  chip: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500' },
  'Offer Stage':    { bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  'Under Contract': { bar: 'bg-green-500',  chip: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  'Closed':         { bar: 'bg-teal-500',   chip: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' }
}

const EMPTY_LEAD = {
  name: '',
  email: '',
  phone: '',
  lead_type: 'Buyer',
  lead_source: '',
  stage: 'New Lead',
  property_type: '',
  budget_min: '',
  budget_max: '',
  desired_location: '',
  timeline: '',
  last_contact: '',
  next_follow_up: '',
  notes: ''
}

function StatCard({ label, value, hint, accent = 'brand' }) {
  const accents = {
    brand: 'text-brand',
    realtor: 'text-realtor',
    warm: 'text-warm',
    accent: 'text-accent'
  }
  return (
    <Card padding="p-4">
      <div className="text-xs text-ink-muted uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accents[accent] || ''}`}>{value}</div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </Card>
  )
}

function daysSince(iso) {
  if (!iso) return 0
  const then = new Date(iso)
  return Math.max(0, Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24)))
}

function formatBudget(min, max) {
  const fmt = (v) => {
    const n = Number(v)
    if (!n) return null
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1000) return `$${Math.round(n / 1000)}k`
    return `$${n}`
  }
  const lo = fmt(min)
  const hi = fmt(max)
  if (lo && hi) return `${lo} – ${hi}`
  if (lo) return `${lo}+`
  if (hi) return `up to ${hi}`
  return null
}

export default function LeadPipeline() {
  const { openSidebar } = useOutletContext()
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads()
  const { addClient } = useClients()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_LEAD)
  const [saving, setSaving] = useState(false)

  const [contactOpen, setContactOpen] = useState(false)
  const [contactLead, setContactLead] = useState(null)
  const [contactNote, setContactNote] = useState('')
  const [contactNext, setContactNext] = useState('')

  const [deleting, setDeleting] = useState(null)

  // Summary metrics
  const stats = useMemo(() => {
    const total = leads.length
    const buyers = leads.filter(l => l.lead_type === 'Buyer').length
    const sellers = leads.filter(l => l.lead_type === 'Seller').length
    const converted = leads.filter(l => l.converted).length
    const rate = total ? Math.round((converted / total) * 100) : 0
    return { total, buyers, sellers, converted, rate }
  }, [leads])

  // Group by stage
  const grouped = useMemo(() => {
    const map = Object.fromEntries(LEAD_STAGES.map(s => [s, []]))
    leads.forEach(l => {
      const stage = LEAD_STAGES.includes(l.stage) ? l.stage : 'New Lead'
      map[stage].push(l)
    })
    return map
  }, [leads])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_LEAD)
    setFormOpen(true)
  }

  function openEdit(lead) {
    setEditing(lead)
    setForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      lead_type: lead.lead_type || 'Buyer',
      lead_source: lead.lead_source || '',
      stage: lead.stage || 'New Lead',
      property_type: lead.property_type || '',
      budget_min: lead.budget_min ?? '',
      budget_max: lead.budget_max ?? '',
      desired_location: lead.desired_location || '',
      timeline: lead.timeline || '',
      last_contact: lead.last_contact || '',
      next_follow_up: lead.next_follow_up || '',
      notes: lead.notes || ''
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_LEAD)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.name.trim()) {
      toast.error('Lead name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        budget_min: form.budget_min === '' ? null : Number(form.budget_min),
        budget_max: form.budget_max === '' ? null : Number(form.budget_max),
        last_contact: form.last_contact || null,
        next_follow_up: form.next_follow_up || null
      }
      if (editing) {
        await updateLead(editing.id, payload)
        toast.success('Lead updated')
      } else {
        await addLead(payload)
        toast.success('Lead added')
      }
      closeForm()
    } catch (err) {
      toast.error(err.message || 'Could not save lead')
    } finally {
      setSaving(false)
    }
  }

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return
    const nextStage = destination.droppableId
    try {
      await updateLead(draggableId, { stage: nextStage })
    } catch (err) {
      toast.error(err.message || 'Could not move lead')
    }
  }

  async function moveNext(lead) {
    const idx = LEAD_STAGES.indexOf(lead.stage)
    if (idx === -1 || idx === LEAD_STAGES.length - 1) return
    const nextStage = LEAD_STAGES[idx + 1]
    try {
      await updateLead(lead.id, { stage: nextStage })
      toast.success(`Moved to ${nextStage}`)
    } catch (err) {
      toast.error(err.message || 'Could not move lead')
    }
  }

  function openContact(lead) {
    setContactLead(lead)
    setContactNote('')
    setContactNext(lead.next_follow_up || '')
    setContactOpen(true)
  }

  async function saveContact() {
    if (!contactLead) return
    try {
      const today = toISODate(new Date())
      const stamp = `[${today}] ${contactNote.trim() || 'Logged contact'}`
      const merged = contactLead.notes ? `${stamp}\n${contactLead.notes}` : stamp
      await updateLead(contactLead.id, {
        last_contact: today,
        next_follow_up: contactNext || null,
        notes: merged
      })
      toast.success('Contact logged')
      setContactOpen(false)
      setContactLead(null)
    } catch (err) {
      toast.error(err.message || 'Could not log contact')
    }
  }

  async function convertLead(lead) {
    if (!['Under Contract', 'Closed'].includes(lead.stage)) {
      toast.error('Move lead to Under Contract or Closed before converting')
      return
    }
    if (lead.converted) {
      toast.info('Lead already converted')
      return
    }
    try {
      const clientPayload = {
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        client_type: lead.lead_type === 'Seller' ? 'Seller' : 'Buyer',
        property_type: lead.property_type || null,
        budget_min: lead.budget_min ?? null,
        budget_max: lead.budget_max ?? null,
        desired_location: lead.desired_location || null,
        timeline: lead.timeline || null,
        referred_by: lead.lead_source || null,
        notes: lead.notes || null,
        transaction_status: lead.stage === 'Closed' ? 'Closed' : 'Active'
      }
      const newClient = await addClient(clientPayload)
      await updateLead(lead.id, { converted: true, converted_client_id: newClient.id })
      toast.success(`${lead.name} is now a client`)
    } catch (err) {
      toast.error(err.message || 'Could not convert lead')
    }
  }

  async function handleDelete() {
    try {
      await deleteLead(deleting.id)
      toast.success('Lead deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <>
      <Topbar
        title="Lead Pipeline"
        subtitle="Every prospect from first contact to closed deal"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        }
      />

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total leads" value={stats.total} />
        <StatCard label="Buyer leads" value={stats.buyers} accent="realtor" hint={`${stats.total ? Math.round(stats.buyers / stats.total * 100) : 0}% of pipeline`} />
        <StatCard label="Seller leads" value={stats.sellers} accent="warm" hint={`${stats.total ? Math.round(stats.sellers / stats.total * 100) : 0}% of pipeline`} />
        <StatCard label="Conversion rate" value={`${stats.rate}%`} accent="accent" hint={`${stats.converted} converted`} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {LEAD_STAGES.map(c => (
            <div key={c} className="bg-white border-hairline border-line rounded-card p-3 h-64 animate-pulse">
              <div className="h-1.5 w-full bg-canvas mb-3 rounded" />
              <div className="h-3 w-20 bg-canvas mb-2 rounded" />
              <div className="h-16 bg-canvas/60 mb-2 rounded" />
              <div className="h-16 bg-canvas/60 rounded" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={TrendingUp}
            title="No leads yet"
            description="Add your first prospect to start building your buyer and seller pipeline."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4" /> Add your first lead
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="overflow-x-auto -mx-6 md:-mx-10 px-6 md:px-10 pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-flow-col auto-cols-[280px] md:auto-cols-[300px] gap-3">
              {LEAD_STAGES.map(stage => {
                const style = STAGE_STYLES[stage]
                const cards = grouped[stage] || []
                return (
                  <Droppable droppableId={stage} key={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-canvas/30 border-hairline border-line rounded-card overflow-hidden transition-colors ${snapshot.isDraggingOver ? 'bg-canvas/80' : ''}`}
                      >
                        <div className={`h-1 ${style.bar}`} />
                        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            <h3 className="text-sm font-semibold text-ink">{stage}</h3>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.chip}`}>{cards.length}</span>
                        </div>
                        <div className="px-2 pb-3 space-y-2 min-h-[120px]">
                          {cards.map((lead, idx) => {
                            const budget = formatBudget(lead.budget_min, lead.budget_max)
                            const overdue = lead.next_follow_up && isOverdue(lead.next_follow_up)
                            const pipelineDays = daysSince(lead.created_at)
                            const canConvert = ['Under Contract', 'Closed'].includes(lead.stage) && !lead.converted
                            const isLast = LEAD_STAGES.indexOf(lead.stage) === LEAD_STAGES.length - 1
                            return (
                              <Draggable draggableId={lead.id} index={idx} key={lead.id}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    className={`bg-white border-hairline border-line rounded-card p-3 cursor-grab active:cursor-grabbing transition-shadow ${snap.isDragging ? 'shadow-lg' : 'hover:shadow-sm'}`}
                                    style={prov.draggableProps.style}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="text-sm font-semibold text-ink leading-snug truncate">{lead.name}</div>
                                      <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full ${lead.lead_type === 'Seller' ? 'bg-warm-bg text-warm-dark' : 'bg-realtor-bg text-realtor-dark'}`}>
                                        {lead.lead_type}
                                      </span>
                                    </div>

                                    {lead.lead_source && (
                                      <div className="text-xs text-ink-muted mb-1.5">via {lead.lead_source}</div>
                                    )}

                                    {(budget || lead.desired_location) && (
                                      <div className="text-xs text-ink mb-1.5 space-y-0.5">
                                        {lead.lead_type === 'Seller' && lead.desired_location ? (
                                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-ink-muted" />{lead.desired_location}</div>
                                        ) : budget ? (
                                          <div className="font-medium">{budget}</div>
                                        ) : lead.desired_location ? (
                                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-ink-muted" />{lead.desired_location}</div>
                                        ) : null}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[11px] mb-2">
                                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-ink-muted'}`}>
                                        <Clock className="w-3 h-3" />
                                        {lead.next_follow_up ? formatDate(lead.next_follow_up) : 'No follow-up'}
                                      </span>
                                      <span className="text-ink-muted">{pipelineDays}d in pipe</span>
                                    </div>

                                    {lead.converted && (
                                      <div className="text-[11px] text-accent-dark bg-accent/10 px-2 py-1 rounded mb-2 inline-block">
                                        Converted to client
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t-hairline border-line">
                                      <button
                                        disabled={isLast}
                                        onClick={() => moveNext(lead)}
                                        className="text-[11px] px-1.5 py-1 rounded hover:bg-canvas text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                        title="Advance to next stage"
                                      >
                                        <ArrowRight className="w-3 h-3" /> Move
                                      </button>
                                      <button
                                        onClick={() => openContact(lead)}
                                        className="text-[11px] px-1.5 py-1 rounded hover:bg-canvas text-ink-muted hover:text-ink inline-flex items-center gap-1"
                                        title="Log a contact"
                                      >
                                        <MessageSquare className="w-3 h-3" /> Log
                                      </button>
                                      <button
                                        disabled={!canConvert}
                                        onClick={() => convertLead(lead)}
                                        className="text-[11px] px-1.5 py-1 rounded text-accent-dark hover:bg-accent/10 disabled:text-ink-muted disabled:hover:bg-transparent disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                        title="Convert to client (Under Contract or Closed only)"
                                      >
                                        <UserCheck className="w-3 h-3" /> Convert
                                      </button>
                                      <div className="ml-auto flex items-center gap-0.5">
                                        {lead.email && (
                                          <a href={`mailto:${lead.email}`} className="p-1 hover:bg-canvas rounded" title={lead.email} onClick={(e) => e.stopPropagation()}>
                                            <Mail className="w-3 h-3 text-ink-muted" />
                                          </a>
                                        )}
                                        {lead.phone && (
                                          <a href={`tel:${lead.phone}`} className="p-1 hover:bg-canvas rounded" title={lead.phone} onClick={(e) => e.stopPropagation()}>
                                            <Phone className="w-3 h-3 text-ink-muted" />
                                          </a>
                                        )}
                                        <button onClick={() => openEdit(lead)} className="p-1 hover:bg-canvas rounded" title="Edit">
                                          <Pencil className="w-3 h-3 text-ink-muted" />
                                        </button>
                                        <button onClick={() => setDeleting(lead)} className="p-1 hover:bg-canvas rounded" title="Delete">
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                          {cards.length === 0 && !snapshot.isDraggingOver && (
                            <div className="text-center text-[11px] text-ink-muted py-6 border-hairline border-dashed border-line rounded-card">
                              Drop leads here
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit lead' : 'Add lead'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Add lead'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lead full name" required />
          <Select label="Lead type" value={form.lead_type} onChange={(e) => setForm({ ...form, lead_type: e.target.value })} options={['Buyer', 'Seller', 'Both']} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Lead source" value={form.lead_source} onChange={(e) => setForm({ ...form, lead_source: e.target.value })}>
            <option value="">Select source…</option>
            {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} options={LEAD_STAGES} />
          <Select label="Property type" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
            <option value="">Any</option>
            {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select label="Timeline" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}>
            <option value="">Select…</option>
            {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Budget min" type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} placeholder="300000" />
          <Input label="Budget max" type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} placeholder="450000" />
          <Input label="Desired location" value={form.desired_location} onChange={(e) => setForm({ ...form, desired_location: e.target.value })} placeholder="Neighborhood, city, zip" className="md:col-span-2" />
          <Input label="Last contact" type="date" value={form.last_contact} onChange={(e) => setForm({ ...form, last_contact: e.target.value })} />
          <Input label="Next follow-up" type="date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="md:col-span-2" placeholder="What they're looking for, key context, motivation…" />
        </form>
      </Modal>

      {/* Contact modal */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={contactLead ? `Log contact — ${contactLead.name}` : 'Log contact'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button onClick={saveContact}>Save contact</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">Last contact will be set to today. The note below is prepended to the lead&rsquo;s notes.</p>
          <Textarea label="What happened?" value={contactNote} onChange={(e) => setContactNote(e.target.value)} rows={3} placeholder="Called, left voicemail. Followed up with text…" />
          <Input label="Next follow-up" type="date" value={contactNext} onChange={(e) => setContactNext(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting?.name || 'lead'}
      />
    </>
  )
}
