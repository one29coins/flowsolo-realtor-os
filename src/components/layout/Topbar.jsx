import { Menu } from 'lucide-react'

export default function Topbar({ title, subtitle, actions, onMenuClick }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4 mb-6">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden -ml-1 p-2 rounded-btn hover:bg-white border-hairline border-transparent hover:border-line flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap md:flex-shrink-0 -mt-1 md:mt-0">
          {actions}
        </div>
      )}
    </div>
  )
}
