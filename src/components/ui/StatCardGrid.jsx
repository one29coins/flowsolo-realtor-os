// StatCardGrid — compact 2x2 grid of stat cards. Variants: primary, default, warning.
// Primary card uses the live theme color via --fs-primary.

export default function StatCardGrid({ cards }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      padding: '12px 16px 0',
    }}>
      {cards.map((card, i) => {
        const isPrimary = card.variant === 'primary'
        const isWarning = card.variant === 'warning'
        return (
          <div
            key={i}
            style={{
              background: isPrimary ? 'var(--fs-primary, #0f2d1a)'
                : isWarning ? '#fff8f0'
                : '#ffffff',
              border: isPrimary ? 'none'
                : isWarning ? '0.5px solid #fed7aa'
                : '0.5px solid #eeeeee',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minHeight: 0,
              maxHeight: 100,
            }}
          >
            <div style={{
              color: isPrimary ? 'var(--fs-primary-light, #22c55e)'
                : isWarning ? '#f97316'
                : 'var(--fs-primary-mid, #16a34a)',
              lineHeight: 1,
            }}>
              {card.icon}
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: isPrimary ? '#ffffff'
                : isWarning ? '#c2410c'
                : '#111111',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: 11,
              color: isPrimary ? 'rgba(255,255,255,0.6)' : '#666666',
              lineHeight: 1.3,
            }}>
              {card.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
