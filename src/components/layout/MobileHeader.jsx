// MobileHeader — compact one-row header used on screens <= 768px.
// Avatar (initials, doubles as menu trigger) + user name + product subtitle
// + optional secondary + primary action buttons.
// All colors flow from --fs-primary / --fs-primary-light so the mobile
// header matches whatever the user picked as their desktop theme.

export default function MobileHeader({
  userName,
  productName,
  primaryAction,
  secondaryAction,
  onMenuOpen,
}) {
  const initials = (userName || '?')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{
      background: 'var(--fs-primary, #0f2d1a)',
      padding: '10px 16px 10px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar — also opens the side drawer */}
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--fs-primary-light, #22c55e)',
            color: 'var(--fs-primary, #0f2d1a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
            padding: 0,
          }}
        >
          {initials}
        </button>

        {/* Name + product */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {userName}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 1,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {productName}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: 7,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                minHeight: 32,
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              style={{
                background: 'var(--fs-primary-light, #22c55e)',
                color: 'var(--fs-primary, #0f2d1a)',
                border: 'none',
                borderRadius: 7,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                minHeight: 32,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
