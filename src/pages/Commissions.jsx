import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Pencil, Trash2, Receipt, AlertTriangle, Home, Calculator } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import CommissionForm from '../components/forms/CommissionForm'
import CommissionCalculator from '../components/CommissionCalculator'
import { useCommissions } from '../hooks/useCommissions'
import { useClients } from '../hooks/useClients'
import { useListings } from '../hooks/useListings'
import { formatCurrency, formatDate } from '../lib/format'
import { toast } from '../lib/toast'

const STATUS_STYLES = {
  Expected:            { bg: '#f1f5f9', fg: '#475569' },
  'Under Contract':    { bg: '#e0e7ff', fg: '#3730a3' },
  'Closing Scheduled': { bg: '#fef3c7', fg: '#92400e' },
  Paid:                { bg: '#dcfce7', fg: '#166534' },
  Split:               { bg: '#ccfbf1', fg: '#115e59' },
  Cancelled:           { bg: '#fee2e2', fg: '#991b1b' }
}

function StatusPill({ value }) {
  const s = STATUS_STYLES[value] || { bg: '#f1f5f9', fg: '#475569' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {value || '—'}
    </span>
  )
}

function ExpiringListingsBanner({ listings }) {
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const limit = new Date(today); limit.setDate(today.getDate() + 30)
    return listings
      .filter(l => l.listing_expiry)
      .map(l => ({ l, end: new Date(l.listing_expiry + 'T00:00:00') }))
      .filter(({ end }) => end >= today && end <= limit)
      .sort((a, b) => a.end - b.end)
  }, [listings])

  if (!upcoming.length) return null

  return (
    <div className="mb-4 space-y-2">
      {upcoming.slice(0, 5).map(({ l, end }) => (
        <div
          key={l.id}
          className="p-3 bg-amber-50 border-hairline border-amber-200 rounded-card flex items-center gap-3 text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-amber-900">
              {l.property_address || l.name} expires on {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-amber-800"> — time to discuss a renewal.</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function commissionLabel(c) {
  if (c.title) return c.title
  const addr = c.listing?.property_address || c.listing?.name
  if (addr) return `${addr} — Sale`
  if (c.client?.name) return `${c.client.name} — Commission`
  return 'Commission'
}

export default function Commissions() {
  const { openSidebar } = useOutletContext()
  const { commissions, loading, addCommission, updateCommission, deleteCommission } = useCommissions()
  const { clients } = useClients()
  const { listings } = useListings()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const totals = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    const expectedStatuses = new Set(['Expected', 'Under Contract', 'Closing Scheduled'])
    const totalExpected = commissions
      .filter(c => expectedStatuses.has(c.status))
      .reduce((s, c) => s + Number(c.net_commission || c.gross_commission || c.amount || 0), 0)

    const paid = commissions.filter(c => c.status === 'Paid')

    const paidYTD = paid
      .filter(c => {
        if (!c.closing_date) return false
        return new Date(c.closing_date + 'T00:00:00').getFullYear() === year
      })
      .reduce((s, c) => s + Number(c.net_commission || c.amount || 0), 0)

    const paidThisMonth = paid
      .filter(c => {
        if (!c.closing_date) return false
        const d = new Date(c.closing_date + 'T00:00:00')
        return d.getFullYear() === year && d.getMonth() === month
      })
      .reduce((s, c) => s + Number(c.net_commission || c.amount || 0), 0)

    const paidNets = paid
      .map(c => Number(c.net_commission || 0))
      .filter(n => n > 0)
    const avgPerDeal = paidNets.length
      ? paidNets.reduce((s, n) => s + n, 0) / paidNets.length
      : 0

    return { totalExpected, paidYTD, paidThisMonth, avgPerDeal }
  }, [commissions])

  function openEdit(c) { setEditing(c); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditing(null) }

  async function handleSubmit(payload) {
    if (editing) await updateCommission(editing.id, payload)
    else await addCommission(payload)
  }

  async function handleDelete() {
    try {
      await deleteCommission(deleting.id)
      toast.success('Commission deleted')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <>
      <Topbar
        title="Commission Hub"
        subtitle="Track every deal, commission, and payment"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4" /> Add commission
          </Button>
        }
      />

      <ExpiringListingsBanner listings={listings} />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Card>
          <div className="text-xs text-ink-muted">Total expected</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(totals.totalExpected)}</div>
          <div className="text-[11px] text-ink-muted mt-1">In the pipeline</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-muted">Paid YTD</div>
          <div className="text-xl font-semibold mt-1 text-green-700">{formatCurrency(totals.paidYTD)}</div>
          <div className="text-[11px] text-ink-muted mt-1">{new Date().getFullYear()}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-muted">Paid this month</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(totals.paidThisMonth)}</div>
          <div className="text-[11px] text-ink-muted mt-1">{new Date().toLocaleString('en-US', { month: 'long' })}</div>
        </Card>
        <Card>
          <div className="text-xs text-ink-muted">Avg per deal</div>
          <div className="text-xl font-semibold mt-1">{formatCurrency(totals.avgPerDeal)}</div>
          <div className="text-[11px] text-ink-muted mt-1">Net, closed deals</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        {/* Commission table */}
        <Card padding="p-0">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={5} cols={7} /></div>
          ) : commissions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No commissions tracked"
              description="Add your first transaction to start tracking your real estate income."
              action={
                <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <Plus className="w-4 h-4" /> Add commission
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">Title</th>
                    <th className="text-left font-medium px-3 py-3">Status</th>
                    <th className="text-right font-medium px-3 py-3 hidden md:table-cell">Sale price</th>
                    <th className="text-right font-medium px-3 py-3 hidden lg:table-cell">Rate</th>
                    <th className="text-right font-medium px-3 py-3 hidden md:table-cell">Gross</th>
                    <th className="text-right font-medium px-3 py-3">Net</th>
                    <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Closing</th>
                    <th className="px-3 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-hairline divide-line">
                  {commissions.map(c => (
                    <tr key={c.id} className="hover:bg-canvas/30">
                      <td className="px-5 py-3">
                        <div className="font-medium flex items-center gap-2">
                          <Home className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                          <span className="truncate">{commissionLabel(c)}</span>
                        </div>
                        {c.client?.name && (
                          <div className="text-xs text-ink-muted mt-0.5 ml-5">{c.client.name}</div>
                        )}
                      </td>
                      <td className="px-3 py-3"><StatusPill value={c.status} /></td>
                      <td className="px-3 py-3 text-right hidden md:table-cell">
                        {c.sale_price ? formatCurrency(c.sale_price) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right hidden lg:table-cell text-ink-muted">
                        {c.commission_rate != null ? `${Number(c.commission_rate).toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-3 py-3 text-right hidden md:table-cell">
                        {c.gross_commission ? formatCurrency(c.gross_commission) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(c.net_commission || c.amount || 0)}
                      </td>
                      <td className="px-3 py-3 text-ink-muted hidden lg:table-cell">
                        {formatDate(c.closing_date)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => openEdit(c)} aria-label="Edit">
                            <Pencil className="w-4 h-4 text-ink-muted" />
                          </button>
                          <button className="p-1.5 hover:bg-canvas rounded-btn" onClick={() => setDeleting(c)} aria-label="Delete">
                            <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* Quick calc sidebar */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-medium">Quick calc</h3>
            </div>
            <p className="text-xs text-ink-muted mb-3">
              Estimate gross and net commission before logging a deal.
            </p>
            <CommissionCalculator />
          </Card>
        </div>
      </div>

      <CommissionForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        initial={editing}
        clients={clients}
        listings={listings}
      />

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting ? commissionLabel(deleting) : 'commission'}
      />
    </>
  )
}
