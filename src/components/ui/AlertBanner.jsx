// Compact full-width tappable alert/CTA banner.

export default function AlertBanner({
  message,
  subtext,
  variant = 'warning',
  onPress,
}) {
  const bg = {
    warning: '#fee2e2',
    info: '#0f2d1a',
    success: 'rgba(34,197,94,0.1)',
  }[variant]

  const color = {
    warning: '#991b1b',
    info: '#ffffff',
    success: '#166534',
  }[variant]

  const iconColor = {
    warning: '#dc2626',
    info: '#22c55e',
    success: '#16a34a',
  }[variant]

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '12px 16px 0',
        padding: '12px 14px',
        background: bg,
        borderRadius: 12,
        border: 'none',
        cursor: onPress ? 'pointer' : 'default',
        width: 'calc(100% - 32px)',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: variant === 'info'
          ? 'rgba(34,197,94,0.15)'
          : 'rgba(255,255,255,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: iconColor,
      }}>
        <svg width="16" height="16"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: color,
          lineHeight: 1.3,
        }}>
          {message}
        </div>
        {subtext && (
          <div style={{
            fontSize: 12,
            color: color,
            opacity: 0.75,
            marginTop: 2,
            lineHeight: 1.3,
          }}>
            {subtext}
          </div>
        )}
      </div>

      {/* Chevron */}
      {onPress && (
        <svg width="16" height="16"
          viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2.5"
          strokeLinecap="round"
          style={{ flexShrink: 0, opacity: 0.6 }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </button>
  )
}
