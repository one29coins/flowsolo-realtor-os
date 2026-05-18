export default function AuthShell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-md bg-brand flex items-center justify-center">
              <span className="text-accent font-semibold text-lg">R</span>
            </div>
            <div className="leading-tight text-left">
              <div className="text-base font-semibold text-brand tracking-tight">The Realtor OS</div>
              <div className="text-xs text-ink-muted -mt-0.5">by FlowSolo Systems</div>
            </div>
          </div>
          <div className="text-xs text-ink-muted max-w-sm">
            Your complete real estate business — listings, leads, and commissions in one place.
          </div>
        </div>
        <div className="bg-white border-hairline border-line rounded-card p-8">
          <h1 className="text-xl font-semibold mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
