// 2-up grid of square module tiles (icon top-left, label bottom-left).
// `sections` is an array of { label?, tiles: [{ id, label, icon, tint?, onClick, featured? }] }

export default function ModuleTileGrid({ sections }) {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--fs-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '16px 0 8px',
            }}>
              {section.label}
            </div>
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {section.tiles.map(tile => (
              <button
                key={tile.id}
                onClick={tile.onClick}
                style={{
                  background: tile.featured ? 'var(--fs-green)' : '#ffffff',
                  border: tile.featured ? 'none' : '0.5px solid var(--fs-line)',
                  borderRadius: 14,
                  padding: '14px 14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0,
                  cursor: 'pointer',
                  minHeight: 90,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: tile.featured
                    ? 'rgba(34,197,94,0.2)'
                    : tile.tint || 'rgba(15,45,26,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'auto',
                  color: tile.featured ? 'var(--fs-bright)' : 'var(--fs-green)',
                }}>
                  {tile.icon}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: tile.featured ? '#ffffff' : 'var(--fs-ink)',
                  lineHeight: 1.3,
                  marginTop: 10,
                  letterSpacing: '-0.01em',
                }}>
                  {tile.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
