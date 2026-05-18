import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, X } from 'lucide-react'

const DISMISS_KEY = 'realtor:sidebar-promo-dismissed'

// Rotating tips that point an agent toward the highest-value parts of the OS.
// Self-contained so the sidebar never depends on optional add-on modules.
const TIPS = [
  {
    badge: 'Pro Tip',
    name: 'Run the Commission Calculator',
    tagline: 'Quote net commission live with co-op splits factored in.',
    to: '/commissions'
  },
  {
    badge: 'New',
    name: 'Weekly Business Review',
    tagline: 'Lock in this week’s top 3 priorities in under 5 minutes.',
    to: '/weekly'
  },
  {
    badge: 'Boost GCI',
    name: 'Work your Lead Pipeline',
    tagline: 'Move warm leads to Showing stage before the weekend.',
    to: '/pipeline'
  },
  {
    badge: 'Stay sharp',
    name: 'Plan an Open House',
    tagline: 'Capture sign-ins and auto-flag follow-ups.',
    to: '/open-houses'
  }
]

export default function SidebarPromo() {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  // Rotate every 8 seconds
  useEffect(() => {
    if (TIPS.length < 2) return
    const id = setInterval(() => setIdx(i => (i + 1) % TIPS.length), 8000)
    return () => clearInterval(id)
  }, [])

  if (dismissed || TIPS.length === 0) return null
  const promo = TIPS[idx % TIPS.length]

  function go() {
    navigate(promo.to)
  }

  function dismiss(e) {
    e.stopPropagation()
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <button
      onClick={go}
      className="w-full text-left mx-3 mb-3 bg-white/5 hover:bg-white/10 transition-colors rounded-btn p-3 relative group"
      style={{ width: 'calc(100% - 1.5rem)' }}
    >
      <button
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 p-0.5 rounded text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-accent uppercase tracking-wider mb-1">
        <Sparkles className="w-3 h-3" />
        {promo.badge}
      </div>
      <div className="text-sm font-semibold text-white leading-tight">{promo.name}</div>
      <div className="text-[11px] text-white/60 mt-1 line-clamp-2 leading-tight">{promo.tagline}</div>
      <div className="flex items-center gap-1 text-[11px] text-accent font-medium mt-2">
        Open <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  )
}
