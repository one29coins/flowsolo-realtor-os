// AlertBanner — compact, 48px max, small dot indicator, tappable.

export default function AlertBanner({ message, actionLabel, onAction }) {
  return (
    <div
      onClick={onAction}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '10px 16px 0',
        padding: '8px 12px',
        background: '#fee2e2',
        borderRadius: 10,
        cursor: onAction ? 'pointer' : 'default',
        maxHeight: 48,
      }}
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#dc2626',
        flexShrink: 0,
      }} />
      <span style={{
        flex: 1,
        fontSize: 12,
        color: '#991b1b',
        fontWeight: 500,
        lineHeight: 1.3,
      }}>
        {message}
      </span>
      {actionLabel && (
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#991b1b',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {actionLabel}
        </span>
      )}
    </div>
  )
}
