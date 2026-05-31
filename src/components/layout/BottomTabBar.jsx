// Fixed bottom navigation. Icons are passed in as React nodes.

export default function BottomTabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(var(--bottom-nav-height) + var(--safe-bottom))',
      paddingBottom: 'var(--safe-bottom)',
      background: '#ffffff',
      borderTop: '0.5px solid var(--fs-line)',
      display: 'flex',
      zIndex: 100,
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              color: isActive ? 'var(--fs-green)' : 'var(--fs-muted)',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--fs-green)' : '#aaaaaa',
            }}>
              {tab.icon}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              lineHeight: 1,
              color: isActive ? 'var(--fs-green)' : '#aaaaaa',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
