// Compact mobile app header: avatar (initials) + user/product + optional actions.
// Navigation lives in the bottom tab bar, so there is no hamburger here.

export default function MobileHeader({
  productName,
  productEmoji,
  userName,
  onMenuOpen,
  primaryAction,
  secondaryAction,
}) {
  const initials = (userName || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'FS'

  return (
    <div style={{
      background: '#ffffff',
      borderBottom: '0.5px solid var(--fs-line)',
      flexShrink: 0,
      padding: '12px 20px 12px',
    }}>

      {/* Top row — avatar + name + actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 0,
      }}>

        {/* Avatar circle */}
        <button
          onClick={onMenuOpen}
          aria-label="Log out"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--fs-green)',
            color: 'var(--fs-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: '0.02em',
            border: 'none',
            padding: 0,
            cursor: onMenuOpen ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          {initials}
        </button>

        {/* Name + product */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--fs-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {userName}
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--fs-muted)',
            marginTop: 1,
            lineHeight: 1.2,
          }}>
            {productEmoji} {productName}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                background: 'transparent',
                border: '0.5px solid var(--fs-line2)',
                color: 'var(--fs-ink)',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'inherit',
                minHeight: 36,
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="13" height="13"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round">
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
                background: 'var(--fs-green)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'inherit',
                minHeight: 36,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                fontSize: 18,
                lineHeight: 1,
                marginTop: -1,
              }}>+</span>
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
