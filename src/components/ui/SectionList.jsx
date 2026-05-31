// Grouped list of module rows (icon + label + optional badge + chevron).
// `sections` is an array of { label, items: [{ id, label, icon, onClick, badge? }] }

export default function SectionList({ sections }) {
  return (
    <div style={{ padding: '0 16px' }}>
      {sections.map((section, si) => (
        <div key={si} style={{ marginBottom: 24 }}>
          {/* Section label */}
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--fs-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '16px 0 6px',
          }}>
            {section.label}
          </div>

          {/* Items */}
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '0.5px solid var(--fs-line)',
            overflow: 'hidden',
          }}>
            {section.items.map((item, ii) => (
              <button
                key={item.id}
                onClick={item.onClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: ii < section.items.length - 1
                    ? '0.5px solid var(--fs-line)'
                    : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  minHeight: 52,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(15,45,26,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--fs-green)',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>

                {/* Label */}
                <span style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--fs-ink)',
                  letterSpacing: '-0.01em',
                }}>
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge !== undefined && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'var(--fs-bright)',
                    borderRadius: 999,
                    padding: '2px 8px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}>
                    {item.badge}
                  </span>
                )}

                {/* Chevron */}
                <svg
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#cccccc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
