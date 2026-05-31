import { useMemo, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Home, Users, TrendingUp, DollarSign, AlertCircle,
  Calendar, Plus, ArrowRight, Clock, MapPin,
  Building2, CheckSquare, FolderClosed, MessageCircle, BarChart,
  RefreshCw, Settings, LogOut, LayoutGrid
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import MobileLayout from '../components/layout/MobileLayout'
import MobileHeader from '../components/layout/MobileHeader'
import StatRow from '../components/ui/StatRow'
import ModuleTileGrid from '../components/ui/ModuleTileGrid'
import SectionList from '../components/ui/SectionList'
import AlertBanner from '../components/ui/AlertBanner'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useClients } from '../hooks/useClients'
import { useListings } from '../hooks/useListings'
import { useLeads } from '../hooks/useLeads'
import { useCommissions } from '../hooks/useCommissions'
import { useOpenHouses } from '../hooks/useOpenHouses'
import { useShowings } from '../hooks/useShowings'
import { useTransactions } from '../hooks/useTransactions'
import { useAuth } from '../context/AuthContext'
import { LEAD_STAGES } from '../lib/realtorConstants'
import { formatCurrency, formatDate, toISODate } from '../lib/format'

// Status pill palette (shared with Listings)
const STATUS_STYLES = {
  'Coming Soon':    { bg: '#ede9fe', fg: '#5b21b6' },
  'Active':         { bg: '#dcfce7', fg: '#166534' },
  'Under Contract': { bg: '#e0e7ff', fg: '#3730a3' },
  'Pending':        { bg: '#fef3c7', fg: '#92400e' },
  'Sold':           { bg: '#ccfbf1', fg: '#115e59' },
  'Expired':        { bg: '#fee2e2', fg: '#991b1b' },
  'Withdrawn':      { bg: '#f1f5f9', fg: '#475569' },
  'Price Reduced':  { bg: '#ffedd5', fg: '#9a3412' },
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
  return Math.max(0, Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

function domToneClass(days) {
  if (days <= 30) return 'text-green-700'
  if (days <= 60) return 'text-amber-700'
  return 'text-red-600'
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const { openSidebar } = useOutletContext()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { clients } = useClients()
  const { listings } = useListings()
  const { leads } = useLeads()
  const { commissions } = useCommissions()
  const { openHouses } = useOpenHouses()
  const { showings } = useShowings()
  const { transactions } = useTransactions()

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const [mobileView, setMobileView] = useState('overview') // 'overview' | 'more'
  const today = toISODate(new Date())
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // ───────── Stats ─────────
  const stats = useMemo(() => {
    const activeListings = listings.filter(l =>
      l.status === 'Active' || l.status === 'Under Contract'
    ).length

    const activeBuyers = clients.filter(c =>
      (c.client_type === 'Buyer' || c.client_type === 'Both') &&
      c.transaction_status === 'Active'
    ).length

    const pipelineLeads = leads.filter(l => !l.converted).length

    const commissionsThisMonth = commissions
      .filter(inv => {
        if (inv.status !== 'Paid') return false
        if (!inv.closing_date) return false
        const d = new Date(inv.closing_date + 'T00:00:00')
        if (Number.isNaN(d.getTime())) return false
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((s, inv) => s + Number(inv.net_commission || inv.amount || 0), 0)

    return { activeListings, activeBuyers, pipelineLeads, commissionsThisMonth }
  }, [listings, clients, leads, commissions, currentMonth, currentYear])

  // ───────── Active Listings Snapshot ─────────
  const snapshotListings = useMemo(() => {
    return listings
      .filter(l => l.status === 'Active' || l.status === 'Under Contract' || l.status === 'Coming Soon')
      .sort((a, b) => (b.listing_date || '').localeCompare(a.listing_date || ''))
      .slice(0, 6)
  }, [listings])

  // ───────── Lead Pipeline Overview ─────────
  const stageCounts = useMemo(() => {
    const counts = LEAD_STAGES.map(stage => ({
      stage,
      count: leads.filter(l => l.stage === stage).length
    }))
    const max = Math.max(1, ...counts.map(c => c.count))
    return { counts, max }
  }, [leads])

  // ───────── Today's Schedule ─────────
  const todaysSchedule = useMemo(() => {
    const todayShowings = showings
      .filter(s => s.showing_date === today)
      .map(s => ({
        id: `showing-${s.id}`,
        time: s.showing_time || '',
        title: s.property_address || 'Showing',
        client: clients.find(c => c.id === s.client_id)?.name || '',
        type: 'Showing'
      }))
    const todayOpenHouses = openHouses
      .filter(oh => oh.date === today)
      .map(oh => {
        const listing = listings.find(l => l.id === oh.listing_id)
        return {
          id: `oh-${oh.id}`,
          time: oh.start_time || '',
          title: listing?.property_address || 'Open House',
          client: '',
          type: 'Open House'
        }
      })
    return [...todayShowings, ...todayOpenHouses].sort((a, b) =>
      (a.time || '99:99').localeCompare(b.time || '99:99')
    )
  }, [showings, openHouses, listings, clients, today])

  // ───────── Expiring Listings ─────────
  const expiringListings = useMemo(() => {
    return listings
      .filter(l => {
        if (!l.listing_expiry) return false
        if (l.status === 'Sold' || l.status === 'Withdrawn') return false
        const days = daysUntil(l.listing_expiry)
        return days !== null && days >= 0 && days <= 30
      })
      .sort((a, b) => (a.listing_expiry || '').localeCompare(b.listing_expiry || ''))
  }, [listings])

  // ───────── Commission Pipeline ─────────
  const commissionPipeline = useMemo(() => {
    const pipeline = transactions
      .filter(t => t.status === 'Under Contract' || t.status === 'Pending')
      .map(t => {
        const listing = listings.find(l => l.id === t.listing_id)
        const price = Number(t.accepted_price || 0)
        const rate = Number(t.commission_rate || 0)
        const split = Number(t.brokerage_split || 100)
        const estCommission = price * (rate / 100) * (split / 100)
        return {
          id: t.id,
          address: listing?.property_address || 'Property',
          price,
          estCommission,
          closing: t.closing_date,
          status: t.status
        }
      })
      .sort((a, b) => (a.closing || '').localeCompare(b.closing || ''))
    const total = pipeline.reduce((s, p) => s + p.estCommission, 0)
    return { pipeline, total }
  }, [transactions, listings])

  // ───────── Mobile app shell config ─────────
  const go = (path) => () => navigate(path)
  const MOBILE_TABS = [
    { id: 'overview', label: 'Overview', icon: <Home size={20} /> },
    { id: '/pipeline', label: 'Leads', icon: <TrendingUp size={20} /> },
    { id: '/listings', label: 'Listings', icon: <Building2 size={20} /> },
    { id: '/commissions', label: 'Commission', icon: <DollarSign size={20} /> },
    { id: 'more', label: 'More', icon: <LayoutGrid size={20} /> },
  ]
  const handleMobileTab = (id) => {
    if (id === 'overview' || id === 'more') setMobileView(id)
    else navigate(id)
  }
  const mobileStats = [
    { label: 'Active listings', value: String(stats.activeListings) },
    { label: 'Buyer clients', value: String(stats.activeBuyers) },
    { label: 'Pipeline leads', value: String(stats.pipelineLeads) },
    { label: 'Commissions', value: formatCurrency(stats.commissionsThisMonth), variant: stats.commissionsThisMonth === 0 ? 'warning' : 'success' },
  ]
  const mobileModuleSections = [
    { label: 'Pipeline', tiles: [
      { id: 'pipeline', label: 'Lead Pipeline', featured: true, icon: <TrendingUp size={18} />, onClick: go('/pipeline') },
      { id: 'listings', label: 'Active Listings', icon: <Building2 size={18} />, onClick: go('/listings') },
      { id: 'openhouses', label: 'Open Houses', icon: <Calendar size={18} />, onClick: go('/open-houses') },
      { id: 'showings', label: 'Showing Tracker', icon: <MapPin size={18} />, onClick: go('/showings') },
    ] },
    { label: 'Transactions', tiles: [
      { id: 'transactions', label: 'Transactions', icon: <CheckSquare size={18} />, onClick: go('/transactions') },
      { id: 'documents', label: 'Document Vault', icon: <FolderClosed size={18} />, onClick: go('/documents') },
      { id: 'followups', label: 'Client Follow-Ups', icon: <MessageCircle size={18} />, onClick: go('/follow-ups') },
      { id: 'clients', label: 'Clients', icon: <Users size={18} />, onClick: go('/clients') },
    ] },
    { label: 'Finance & Review', tiles: [
      { id: 'commissions', label: 'Commission Hub', icon: <DollarSign size={18} />, onClick: go('/commissions') },
      { id: 'market', label: 'Market Analytics', icon: <BarChart size={18} />, onClick: go('/market') },
      { id: 'weekly', label: 'Weekly Review', icon: <RefreshCw size={18} />, onClick: go('/weekly') },
    ] },
  ]
  const mobileSectionList = [
    { label: 'Pipeline', items: [
      { id: 'pipeline', label: 'Lead Pipeline', icon: <TrendingUp size={16} />, onClick: go('/pipeline') },
      { id: 'listings', label: 'Active Listings', icon: <Building2 size={16} />, onClick: go('/listings') },
      { id: 'openhouses', label: 'Open Houses', icon: <Calendar size={16} />, onClick: go('/open-houses') },
      { id: 'showings', label: 'Showing Tracker', icon: <MapPin size={16} />, onClick: go('/showings') },
    ] },
    { label: 'Transactions', items: [
      { id: 'transactions', label: 'Transaction Checklist', icon: <CheckSquare size={16} />, onClick: go('/transactions') },
      { id: 'documents', label: 'Document Vault', icon: <FolderClosed size={16} />, onClick: go('/documents') },
      { id: 'followups', label: 'Client Follow-Ups', icon: <MessageCircle size={16} />, onClick: go('/follow-ups') },
    ] },
    { label: 'Finance', items: [
      { id: 'commissions', label: 'Commission Hub', icon: <DollarSign size={16} />, onClick: go('/commissions') },
      { id: 'market', label: 'Market Analytics', icon: <BarChart size={16} />, onClick: go('/market') },
    ] },
    { label: 'Clients & Review', items: [
      { id: 'clients', label: 'Clients', icon: <Users size={16} />, badge: clients.length || undefined, onClick: go('/clients') },
      { id: 'weekly', label: 'Weekly Business Review', icon: <RefreshCw size={16} />, onClick: go('/weekly') },
    ] },
    { label: 'Account', items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={16} />, onClick: go('/settings') },
    ] },
  ]

  return (
    <>
      {/* ───────── MOBILE: app shell (Overview / All modules) ───────── */}
      <div className="md:hidden -mx-4 -mt-6 -mb-24">
        <MobileLayout
          tabs={MOBILE_TABS}
          activeTab={mobileView}
          onTabChange={handleMobileTab}
          header={
            <MobileHeader
              productName="Realtor OS"
              productEmoji="🏡"
              userName={profile?.full_name || 'there'}
              onMenuOpen={() => signOut()}
              primaryAction={{ label: 'New Listing', onClick: () => navigate('/listings') }}
            />
          }
          content={
            mobileView === 'more' ? (
              <SectionList sections={mobileSectionList} />
            ) : (
              <>
                <StatRow stats={mobileStats} />
                {expiringListings.length > 0 && (
                  <AlertBanner
                    variant="warning"
                    message={`${expiringListings.length} listing${expiringListings.length > 1 ? 's' : ''} expiring soon`}
                    subtext="Tap to review your active listings"
                    onPress={() => navigate('/listings')}
                  />
                )}
                <ModuleTileGrid sections={mobileModuleSections} />
              </>
            )
          }
        />
      </div>

      {/* ───────── DESKTOP: full dashboard ───────── */}
      <div className="hidden md:block">
        <Topbar
          title="My Realtor Hub"
          subtitle={`Welcome back, ${firstName} — your real estate business at a glance.`}
          onMenuClick={openSidebar}
          actions={
            <>
              <Button size="sm" variant="outline" onClick={() => navigate('/pipeline')}>
                <TrendingUp className="w-4 h-4" /> Lead Pipeline
              </Button>
              <Button size="sm" onClick={() => navigate('/listings')}>
                <Plus className="w-4 h-4" /> New Listing
              </Button>
            </>
          }
        />

      {/* ─────── Stat cards — desktop ─────── */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Home className="w-5 h-5 text-green-600 mb-3" />
          <div className="text-2xl font-semibold leading-none">{stats.activeListings}</div>
          <div className="text-xs text-ink-muted mt-1.5">Active listings</div>
        </Card>
        <Card>
          <Users className="w-5 h-5 mb-3" style={{ color: '#6366f1' }} />
          <div className="text-2xl font-semibold leading-none">{stats.activeBuyers}</div>
          <div className="text-xs text-ink-muted mt-1.5">Active buyer clients</div>
        </Card>
        <Card>
          <TrendingUp className="w-5 h-5 mb-3" style={{ color: '#6366f1' }} />
          <div className="text-2xl font-semibold leading-none">{stats.pipelineLeads}</div>
          <div className="text-xs text-ink-muted mt-1.5">Pipeline leads</div>
        </Card>
        <Card className={stats.commissionsThisMonth === 0 ? 'border-amber-300 bg-amber-50/60' : ''}>
          <DollarSign className={`w-5 h-5 mb-3 ${stats.commissionsThisMonth === 0 ? 'text-amber-600' : 'text-green-600'}`} />
          <div className={`text-2xl font-semibold leading-none ${stats.commissionsThisMonth === 0 ? 'text-amber-700' : ''}`}>
            {formatCurrency(stats.commissionsThisMonth)}
          </div>
          <div className="text-xs text-ink-muted mt-1.5">Commissions this month</div>
        </Card>
      </div>

      {/* ─────── Active Listings Snapshot + Lead Pipeline ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card padding="p-0" className="lg:col-span-2">
          <div className="px-5 py-4 border-b-hairline border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Active Listings Snapshot</h3>
              <p className="text-xs text-ink-muted mt-0.5">Days on market, status, and showing momentum</p>
            </div>
            <button onClick={() => navigate('/listings')} className="text-[13px] font-medium text-[#16a34a] hover:text-[#15803d] py-2 -my-2 flex-shrink-0">View all</button>
          </div>
          {snapshotListings.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No active listings"
              description="Add your first listing to start tracking days on market."
              action={<Button size="sm" onClick={() => navigate('/listings')}><Plus className="w-4 h-4" /> Add listing</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-muted uppercase tracking-wide bg-canvas/40">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">Address</th>
                    <th className="text-right font-medium px-3 py-2.5">List Price</th>
                    <th className="text-center font-medium px-3 py-2.5">DOM</th>
                    <th className="text-left font-medium px-3 py-2.5">Status</th>
                    <th className="text-center font-medium px-3 py-2.5 hidden md:table-cell">Showings</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-hairline divide-line">
                  {snapshotListings.map(l => {
                    const dom = daysOnMarket(l.listing_date, l.days_on_market)
                    return (
                      <tr key={l.id} className="hover:bg-canvas/30 cursor-pointer" onClick={() => navigate('/listings')}>
                        <td className="px-5 py-2.5">
                          <div className="font-medium text-sm truncate max-w-[260px]">{l.property_address || l.name || 'Untitled listing'}</div>
                          {l.city && <div className="text-xs text-ink-muted truncate">{l.city}{l.state ? `, ${l.state}` : ''}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(l.list_price)}</td>
                        <td className={`px-3 py-2.5 text-center font-medium ${domToneClass(dom)}`}>{dom}d</td>
                        <td className="px-3 py-2.5"><StatusPill value={l.status} /></td>
                        <td className="px-3 py-2.5 text-center text-ink-muted hidden md:table-cell">{l.showing_count || 0}</td>
                        <td className="px-3 py-2.5">
                          <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card padding="p-0">
          <div className="px-5 py-4 border-b-hairline border-line">
            <h3 className="text-sm font-medium">Lead Pipeline</h3>
            <p className="text-xs text-ink-muted mt-0.5">Where your leads stand right now</p>
          </div>
          <div className="p-5 space-y-3">
            {stageCounts.counts.map(({ stage, count }) => {
              const pct = (count / stageCounts.max) * 100
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-muted">{stage}</span>
                    <span className="font-medium text-ink">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-canvas rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, background: '#6366f1' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-5 pb-4">
            <button
              onClick={() => navigate('/pipeline')}
              className="w-full text-xs px-3 py-2 rounded-btn border-hairline border-line hover:bg-canvas/40 flex items-center justify-center gap-1.5 text-ink-muted hover:text-ink"
            >
              Open lead pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* ─────── Today's Schedule + Expiring + Commission Pipeline ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Schedule */}
        <Card padding="p-0">
          <div className="px-5 py-4 border-b-hairline border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: '#6366f1' }} />
              <h3 className="text-sm font-medium">Today's Schedule</h3>
            </div>
            <span className="text-xs text-ink-muted">{formatDate(today)}</span>
          </div>
          {todaysSchedule.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Clock className="w-7 h-7 text-ink-muted/50 mx-auto mb-2" />
              <div className="text-sm font-medium">No schedule today</div>
              <div className="text-xs text-ink-muted mt-1">Take a breath or get ahead on tomorrow.</div>
            </div>
          ) : (
            <div className="divide-y-hairline divide-line">
              {todaysSchedule.map(item => (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-xs font-mono text-ink-muted w-14 flex-shrink-0">{item.time || '—'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    {item.client && <div className="text-xs text-ink-muted truncate">{item.client}</div>}
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                    style={{
                      background: item.type === 'Open House' ? '#ede9fe' : '#dbeafe',
                      color: item.type === 'Open House' ? '#5b21b6' : '#1e40af'
                    }}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expiring Listings */}
        <Card padding="p-0" className="border-l-4 border-l-amber-500">
          <div className="px-5 py-4 border-b-hairline border-line flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-medium">Expiring Listings</h3>
          </div>
          {expiringListings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-sm text-ink-muted">No listings expiring in the next 30 days.</div>
            </div>
          ) : (
            <div className="divide-y-hairline divide-line">
              {expiringListings.map(l => {
                const days = daysUntil(l.listing_expiry)
                return (
                  <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                    <MapPin className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.property_address || l.name}</div>
                      <div className="text-xs text-ink-muted">
                        Expires {formatDate(l.listing_expiry)}
                        <span className={`ml-1.5 font-medium ${days <= 7 ? 'text-red-600' : 'text-amber-700'}`}>
                          ({days}d left)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/follow-ups')}
                      className="text-xs px-2 py-1 rounded-btn border-hairline border-line hover:bg-canvas/60 text-ink whitespace-nowrap"
                    >
                      Contact Seller
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Commission Pipeline */}
        <Card padding="p-0">
          <div className="px-5 py-4 border-b-hairline border-line flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium">Commission Pipeline</h3>
          </div>
          {commissionPipeline.pipeline.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-sm text-ink-muted">No deals under contract yet.</div>
            </div>
          ) : (
            <>
              <div className="divide-y-hairline divide-line">
                {commissionPipeline.pipeline.map(p => (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.address}</div>
                      <div className="text-xs text-ink-muted">
                        {formatCurrency(p.price)}
                        {p.closing && <span> · closes {formatDate(p.closing)}</span>}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-700 whitespace-nowrap">{formatCurrency(p.estCommission)}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-canvas/40 border-t-hairline border-line flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wide">Estimated total</span>
                <span className="text-base font-semibold text-green-700">{formatCurrency(commissionPipeline.total)}</span>
              </div>
            </>
          )}
        </Card>
      </div>
      </div>
    </>
  )
}
