import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  Building2,
  TrendingUp,
  Calendar,
  DollarSign,
  FolderClosed,
  MessageCircle,
  CheckSquare,
  RefreshCw,
  MapPin,
  BarChart,
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useClients } from '../../hooks/useClients'
import { initials } from '../../lib/format'

const MAIN = [
  { to: '/',              label: 'My Realtor Hub',        icon: Home,           end: true },
  { to: '/clients',       label: 'Clients',                icon: Users,          badgeKey: 'clients' },
  { to: '/listings',      label: 'Active Listings',        icon: Building2 },
  { to: '/pipeline',      label: 'Lead Pipeline',          icon: TrendingUp },
  { to: '/open-houses',   label: 'Open Houses',            icon: Calendar },
  { to: '/commissions',   label: 'Commission Hub',         icon: DollarSign },
  { to: '/documents',     label: 'Document Vault',         icon: FolderClosed },
  { to: '/follow-ups',    label: 'Client Follow-Ups',      icon: MessageCircle },
  { to: '/transactions',  label: 'Transaction Checklist',  icon: CheckSquare },
  { to: '/weekly',        label: 'Weekly Business Review', icon: RefreshCw }
]

const TOOLS = [
  { to: '/showings', label: 'Showing Tracker',   icon: MapPin },
  { to: '/market',   label: 'Market Analytics',  icon: BarChart },
  { to: '/settings', label: 'Settings',          icon: Settings }
]

export default function Sidebar({ open, onClose }) {
  const { user, profile, signOut } = useAuth()
  const { clients } = useClients()

  const counts = { clients: clients.length }
  const brandName = profile?.brokerage_name?.trim() || 'The Realtor OS'
  const tagline = profile?.brokerage_name ? 'Realtor OS' : 'by FlowSolo Systems'
  const logoText = profile?.brokerage_name
    ? initials(profile.brokerage_name).slice(0, 1) || 'R'
    : 'R'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-brand text-white flex flex-col transform transition-transform duration-200 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-md bg-white/95 flex items-center justify-center font-semibold text-brand flex-shrink-0 overflow-hidden">
              {profile?.logo_url
                ? <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain" />
                : <span className="text-base bg-accent w-full h-full flex items-center justify-center">{logoText}</span>
              }
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate">{brandName}</div>
              <div className="text-[11px] text-white/60 -mt-0.5 truncate">{tagline}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/70 hover:text-white flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2">Main</div>
          <div className="space-y-0.5 mb-5">
            {MAIN.map(item => {
              const Icon = item.icon
              const badge = item.badgeKey ? counts[item.badgeKey] : null
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-colors
                    ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {badge != null && badge > 0 && (
                    <span className="text-xs bg-white/15 text-white/90 px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>

          <div className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2">Tools</div>
          <div className="space-y-0.5">
            {TOOLS.map(item => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-colors
                    ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="px-3 pt-1 pb-2 text-xs text-white/60 truncate">{user?.email}</div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-btn text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
          <div className="text-[10px] text-white/40 text-center mt-3 mb-1">
            FlowSolo Systems · The Realtor OS
          </div>
        </div>
      </aside>
    </>
  )
}
