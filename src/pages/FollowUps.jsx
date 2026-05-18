import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Mail, Check, Heart } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import FollowUpForm from '../components/forms/FollowUpForm'
import { useFollowUps } from '../hooks/useFollowUps'
import { useClients } from '../hooks/useClients'
import { formatDate, isOverdue } from '../lib/format'
import { toast } from '../lib/toast'

const TABS = [
  { key: 'All',         label: 'All' },
  { key: 'Scheduled',   label: 'Scheduled' },
  { key: 'Completed',   label: 'Completed' },
  { key: 'PastClient',  label: 'Past Client' }
]

function TypePill({ value }) {
  if (!value) return <span className="text-xs text-ink-muted">—</span>
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">
      {value}
    </span>
  )
}

export default function FollowUps() {
  const { openSidebar } = useOutletContext()
  const { followUps, loading, addFollowUp, updateFollowUp, deleteFollowUp } = useFollowUps()
  const { clients } = useClients()

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const clientById = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  )

  const filtered = useMemo(() => {
    return followUps.filter(f => {
      const client = f.client || clientById[f.client_id]

      if (tab === 'Scheduled' && f.status !== 'Scheduled' && f.status !== 'To Do') return false
      if (tab === 'Completed' && f.status !== 'Done' && f.status !== 'Completed') return false
      if (tab === 'PastClient' && client?.transaction_status !== 'Closed') return false

      if (search) {
        const q = search.toLowerCase()
        return (
          f.title?.toLowerCase().includes(q) ||
          client?.name?.toLowerCase().includes(q) ||
          f.property_interest?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [followUps, tab, search, clientById])

  const pastClientCount = useMemo(
    () => followUps.filter(f => {
      const c = f.client || clientById[f.client_id]
      return c?.transaction_status === 'Closed'
    }).length,
    [followUps, clientById]
  )

  async function handleSubmit(payload) {
    if (editing) await updateFollowUp(editing.id, payload)
    else await addFollowUp(payload)
  }

  async function handleDelete() {
    try {
      await deleteFollowUp(deleting.id)
      toast.success('Follow-up deleted')
    } catch (err) { toast.error(err.message) }
  }

  async function markDone(f) {
    try {
      await updateFollowUp(f.id, { status: 'Done' })
      toast.success('Marked done')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <Topbar
        title="Client Follow-Ups"
        subtitle="Stay proactive with every buyer, seller, and past client"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4" /> Add follow-up
          </Button>
        }
      />

      {/* Tabs + search */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border-hairline border-line rounded-btn p-1 overflow-x-auto">
          {TABS.map(t => {
            const active = tab === t.key
            const isPC = t.key === 'PastClient'
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-btn whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  active ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {isPC && <Heart className={`w-3.5 h-3.5 ${active ? '' : 'text-pink-500'}`} />}
                {t.label}
                {isPC && pastClientCount > 0 && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-canvas text-ink-muted'}`}>
                    {pastClientCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search follow-ups…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {tab === 'PastClient' && pastClientCount > 0 && (
        <div className="mb-4 p-3 bg-pink-50 border-hairline border-pink-200 rounded-card text-sm text-pink-900 flex items-start gap-2">
          <Heart className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Sphere-of-influence touches.</span>{' '}
            Your past clients are your best referral source — keep these warm.
          </div>
        </div>
      )}

      <Card padding="p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={followUps.length === 0 ? 'No follow-ups scheduled' : 'No follow-ups match your filters'}
            description={followUps.length === 0
              ? 'Stay proactive — add a follow-up for any client or lead who needs attention.'
              : 'Try a different tab or clear the search.'}
            action={followUps.length === 0
              ? (
                <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <Plus className="w-4 h-4" /> Add follow-up
                </Button>
              )
              : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Title</th>
                  <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Client</th>
                  <th className="text-left font-medium px-3 py-3">Type</th>
                  <th className="text-left font-medium px-3 py-3">Status</th>
                  <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Channel</th>
                  <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Property interest</th>
                  <th className="px-3 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y-hairline divide-line">
                {filtered.map(f => {
                  const client = f.client || clientById[f.client_id]
                  const overdue = (f.status === 'Scheduled' || f.status === 'To Do') &&
                    f.follow_up_date && isOverdue(f.follow_up_date)
                  const isPast = client?.transaction_status === 'Closed'
                  return (
                    <tr key={f.id} className={`hover:bg-canvas/30 ${overdue ? 'bg-red-50/40' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium flex items-center gap-2">
                          {isPast && <Heart className="w-3 h-3 text-pink-500 flex-shrink-0" />}
                          <span>{f.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-muted hidden md:table-cell">
                        {client?.name || '—'}
                      </td>
                      <td className="px-3 py-3"><TypePill value={f.follow_up_type || f.type} /></td>
                      <td className="px-3 py-3"><Badge value={f.status} /></td>
                      <td className={`px-3 py-3 hidden md:table-cell ${overdue ? 'text-red-600 font-medium' : 'text-ink-muted'}`}>
                        {formatDate(f.follow_up_date)}
                      </td>
                      <td className="px-3 py-3 text-ink-muted hidden lg:table-cell">{f.channel || '—'}</td>
                      <td className="px-3 py-3 text-ink-muted hidden lg:table-cell truncate max-w-[200px]">
                        {f.property_interest || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {f.status !== 'Done' && f.status !== 'Completed' && (
                            <button
                              className="p-1.5 hover:bg-green-50 rounded-btn"
                              onClick={() => markDone(f)}
                              title="Mark done"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          <button
                            className="p-1.5 hover:bg-canvas rounded-btn"
                            onClick={() => { setEditing(f); setFormOpen(true) }}
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4 text-ink-muted" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-canvas rounded-btn"
                            onClick={() => setDeleting(f)}
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

      <FollowUpForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
        clients={clients}
      />

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting?.title || 'follow-up'}
      />
    </>
  )
}
