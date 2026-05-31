// Horizontally scrollable row of compact summary chips.

export default function StatRow({ stats }) {
  return (
    <div
      className="fs-statrow"
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 16px 0',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: '#ffffff',
            border: '0.5px solid var(--fs-line)',
            borderRadius: 12,
            padding: '10px 14px',
            flexShrink: 0,
            minWidth: 100,
          }}
        >
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: stat.variant === 'warning'
              ? '#dc2626'
              : stat.variant === 'success'
                ? 'var(--fs-bright)'
                : 'var(--fs-ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 4,
          }}>
            {stat.value}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--fs-muted)',
            lineHeight: 1.2,
          }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
