import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  Plus, BarChart3, TrendingUp, TrendingDown, Minus, Pencil, Trash2, MapPin
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea } from '../components/ui/Input'
import Select from '../components/ui/Select'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDelete from '../components/ui/ConfirmDelete'
import { useMarketNotes } from '../hooks/useMarketNotes'
import { MARKET_TREND_OPTIONS } from '../lib/realtorConstants'
import { formatCurrency, formatDate, toISODate } from '../lib/format'
import { toast } from '../lib/toast'

const EMPTY_NOTE = {
  week_date: toISODate(new Date()),
  area: '',
  avg_list_price: '',
  avg_sale_price: '',
  avg_dom: '',
  list_to_sale_ratio: '',
  active_listings: '',
  new_listings: '',
  closed_sales: '',
  months_of_inventory: '',
  market_trend: 'Balanced Market',
  notes: ''
}

function TrendBadge({ trend }) {
  const styles = {
    "Seller's Market": { bg: '#dcfce7', fg: '#166534', Icon: TrendingUp },
    "Buyer's Market":  { bg: '#fee2e2', fg: '#991b1b', Icon: TrendingDown },
    'Balanced Market': { bg: '#f1f5f9', fg: '#475569', Icon: Minus },
    'Neutral':         { bg: '#f1f5f9', fg: '#475569', Icon: Minus }
  }
  const s = styles[trend] || styles['Neutral']
  const Icon = s.Icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.fg }}>
      <Icon className="w-3 h-3" />
      {trend || 'Neutral'}
    </span>
  )
}

function StatTile({ label, value, hint, accent = 'ink' }) {
  const colors = {
    ink: 'text-ink',
    accent: 'text-accent',
    realtor: 'text-realtor',
    warm: 'text-warm'
  }
  return (
    <Card padding="p-4">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${colors[accent]}`}>{value}</div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </Card>
  )
}

function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function compactCurrency(v) {
  const n = Number(v) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

export default function MarketAnalytics() {
  const { openSidebar } = useOutletContext()
  const { notes, loading, addNote, updateNote, deleteNote } = useMarketNotes()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_NOTE)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const [areaFilter, setAreaFilter] = useState('All')
  const [trendFilter, setTrendFilter] = useState('All')

  const areas = useMemo(() => {
    const set = new Set()
    notes.forEach(n => { if (n.area) set.add(n.area) })
    return ['All', ...Array.from(set).sort()]
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (areaFilter !== 'All' && n.area !== areaFilter) return false
      if (trendFilter !== 'All' && n.market_trend !== trendFilter) return false
      return true
    })
  }, [notes, areaFilter, trendFilter])

  // Most recent entry for snapshot
  const latest = useMemo(() => {
    return filtered.slice().sort((a, b) => new Date(b.week_date) - new Date(a.week_date))[0] || null
  }, [filtered])

  // Chart data — chronological order
  const chartData = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => new Date(a.week_date) - new Date(b.week_date))
      .map(n => ({
        date: n.week_date,
        label: shortDate(n.week_date),
        avg_sale_price: Number(n.avg_sale_price) || null,
        avg_list_price: Number(n.avg_list_price) || null,
        avg_dom: Number(n.avg_dom) || null,
        list_to_sale_ratio: Number(n.list_to_sale_ratio) || null
      }))
  }, [filtered])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_NOTE, area: areaFilter !== 'All' ? areaFilter : '' })
    setFormOpen(true)
  }

  function openEdit(note) {
    setEditing(note)
    setForm({
      week_date: note.week_date || toISODate(new Date()),
      area: note.area || '',
      avg_list_price: note.avg_list_price ?? '',
      avg_sale_price: note.avg_sale_price ?? '',
      avg_dom: note.avg_dom ?? '',
      list_to_sale_ratio: note.list_to_sale_ratio ?? '',
      active_listings: note.active_listings ?? '',
      new_listings: note.new_listings ?? '',
      closed_sales: note.closed_sales ?? '',
      months_of_inventory: note.months_of_inventory ?? '',
      market_trend: note.market_trend || 'Balanced Market',
      notes: note.notes || ''
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_NOTE)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.week_date) {
      toast.error('Week date is required')
      return
    }
    setSaving(true)
    try {
      const num = (v) => v === '' ? null : Number(v)
      const payload = {
        week_date: form.week_date,
        area: form.area || null,
        avg_list_price: num(form.avg_list_price),
        avg_sale_price: num(form.avg_sale_price),
        avg_dom: num(form.avg_dom),
        list_to_sale_ratio: num(form.list_to_sale_ratio),
        active_listings: num(form.active_listings),
        new_listings: num(form.new_listings),
        closed_sales: num(form.closed_sales),
        months_of_inventory: num(form.months_of_inventory),
        market_trend: form.market_trend,
        notes: form.notes || null
      }
      if (editing) {
        await updateNote(editing.id, payload)
        toast.success('Market entry updated')
      } else {
        await addNote(payload)
        toast.success('Market entry logged')
      }
      closeForm()
    } catch (err) {
      toast.error(err.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteNote(deleting.id)
      toast.success('Entry deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const chartTooltipStyle = {
    background: '#fff',
    border: '0.5px solid #eeeeee',
    borderRadius: 10,
    fontSize: 12
  }

  return (
    <>
      <Topbar
        title="Market Analytics"
        subtitle="Track local market data and stay sharp on pricing"
        onMenuClick={openSidebar}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Log this week&rsquo;s numbers
          </Button>
        }
      />

      {/* Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatTile
          label="Avg list price"
          value={latest ? compactCurrency(latest.avg_list_price) : '—'}
          hint={latest ? `Week of ${shortDate(latest.week_date)}` : 'No data'}
          accent="realtor"
        />
        <StatTile
          label="Avg sale price"
          value={latest ? compactCurrency(latest.avg_sale_price) : '—'}
          hint={latest && latest.list_to_sale_ratio ? `${Number(latest.list_to_sale_ratio).toFixed(1)}% of list` : ''}
          accent="accent"
        />
        <StatTile
          label="Avg DOM"
          value={latest && latest.avg_dom !== null && latest.avg_dom !== undefined ? `${latest.avg_dom}` : '—'}
          hint="days on market"
          accent="warm"
        />
        <StatTile
          label="Months of inventory"
          value={latest && latest.months_of_inventory !== null && latest.months_of_inventory !== undefined ? Number(latest.months_of_inventory).toFixed(1) : '—'}
          hint={latest ? <span><TrendBadge trend={latest.market_trend} /></span> : ''}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative md:w-72">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={areaFilter === 'All' ? '' : areaFilter}
            onChange={(e) => setAreaFilter(e.target.value || 'All')}
            placeholder="Filter by area (or type to search)…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border-hairline border-line rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20"
            list="area-list"
          />
          <datalist id="area-list">
            {areas.filter(a => a !== 'All').map(a => <option key={a} value={a} />)}
          </datalist>
        </div>
        <Select value={trendFilter} onChange={(e) => setTrendFilter(e.target.value)} className="md:w-52">
          <option value="All">All trends</option>
          {MARKET_TREND_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        {(areaFilter !== 'All' || trendFilter !== 'All') && (
          <Button size="sm" variant="ghost" onClick={() => { setAreaFilter('All'); setTrendFilter('All') }}>Clear</Button>
        )}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {[0,1,2].map(i => <Card key={i} padding="p-4" className="h-64 animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No market data yet"
            description="Log your first week of market numbers to start tracking local trends."
            action={
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4" /> Log first week
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <Card padding="p-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-ink">Avg sale price</h3>
                <p className="text-xs text-ink-muted">Trend over time</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="#eeeeee" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#eeeeee' }} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '$0' : `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [formatCurrency(v), 'Avg sale price']} />
                  <Line type="monotone" dataKey="avg_sale_price" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="p-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-ink">Avg days on market</h3>
                <p className="text-xs text-ink-muted">Lower = hotter market</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="#eeeeee" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#eeeeee' }} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} days`, 'Avg DOM']} />
                  <Line type="monotone" dataKey="avg_dom" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card padding="p-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-ink">List-to-sale ratio</h3>
                <p className="text-xs text-ink-muted">% of list price achieved</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid stroke="#eeeeee" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#eeeeee' }} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'List-to-sale']} />
                  <Line type="monotone" dataKey="list_to_sale_ratio" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* History table */}
          <Card padding="p-0">
            <div className="px-4 py-3 border-b-hairline border-line bg-canvas/40 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Weekly history</h3>
              <span className="text-xs text-ink-muted">{filtered.length} entries</span>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-sm text-ink-muted py-10">No entries match the current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Week</th>
                      <th className="text-left font-medium px-3 py-3">Area</th>
                      <th className="text-right font-medium px-3 py-3">Avg sale</th>
                      <th className="text-right font-medium px-3 py-3 hidden md:table-cell">DOM</th>
                      <th className="text-left font-medium px-3 py-3 hidden md:table-cell">Trend</th>
                      <th className="text-left font-medium px-3 py-3 hidden lg:table-cell">Notes</th>
                      <th className="px-3 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-hairline divide-line">
                    {filtered.map(n => (
                      <tr key={n.id} className="hover:bg-canvas/30">
                        <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatDate(n.week_date)}</td>
                        <td className="px-3 py-3 font-medium">{n.area || '—'}</td>
                        <td className="px-3 py-3 text-right font-medium">{n.avg_sale_price ? compactCurrency(n.avg_sale_price) : '—'}</td>
                        <td className="px-3 py-3 text-right hidden md:table-cell">{n.avg_dom ?? '—'}</td>
                        <td className="px-3 py-3 hidden md:table-cell"><TrendBadge trend={n.market_trend} /></td>
                        <td className="px-3 py-3 text-ink-muted hidden lg:table-cell max-w-[300px]">
                          <span className="block truncate">{n.notes ? (n.notes.length > 80 ? n.notes.slice(0, 80) + '…' : n.notes) : '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEdit(n)} className="p-1.5 hover:bg-canvas rounded-btn" title="Edit">
                              <Pencil className="w-3.5 h-3.5 text-ink-muted" />
                            </button>
                            <button onClick={() => setDeleting(n)} className="p-1.5 hover:bg-canvas rounded-btn" title="Delete">
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
        </>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit market entry' : 'Log market numbers'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Save changes' : 'Log entry'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Week date *" type="date" value={form.week_date} onChange={(e) => setForm({ ...form, week_date: e.target.value })} required />
          <Input label="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Neighborhood, city, zip…" />
          <Input label="Avg list price" type="number" value={form.avg_list_price} onChange={(e) => setForm({ ...form, avg_list_price: e.target.value })} />
          <Input label="Avg sale price" type="number" value={form.avg_sale_price} onChange={(e) => setForm({ ...form, avg_sale_price: e.target.value })} />
          <Input label="Avg DOM" type="number" value={form.avg_dom} onChange={(e) => setForm({ ...form, avg_dom: e.target.value })} hint="days" />
          <Input label="List-to-sale ratio" type="number" step="0.1" value={form.list_to_sale_ratio} onChange={(e) => setForm({ ...form, list_to_sale_ratio: e.target.value })} hint="e.g. 98.5 (%)" />
          <Input label="Active listings" type="number" value={form.active_listings} onChange={(e) => setForm({ ...form, active_listings: e.target.value })} />
          <Input label="New listings" type="number" value={form.new_listings} onChange={(e) => setForm({ ...form, new_listings: e.target.value })} />
          <Input label="Closed sales" type="number" value={form.closed_sales} onChange={(e) => setForm({ ...form, closed_sales: e.target.value })} />
          <Input label="Months of inventory" type="number" step="0.1" value={form.months_of_inventory} onChange={(e) => setForm({ ...form, months_of_inventory: e.target.value })} />
          <Select label="Market trend" value={form.market_trend} onChange={(e) => setForm({ ...form, market_trend: e.target.value })} options={MARKET_TREND_OPTIONS} className="md:col-span-2" />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="md:col-span-2" placeholder="Buyer behavior, multiple offer activity, interest-rate impact…" />
        </form>
      </Modal>

      <ConfirmDelete
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        itemName={deleting ? `entry for ${formatDate(deleting.week_date)}` : 'entry'}
      />
    </>
  )
}
