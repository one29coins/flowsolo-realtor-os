// BottomTabBar — fixed bottom nav, 5 tabs, safe-area aware.

export default function BottomTabBar({ tabs, activeTab, onChange }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(56px + var(--safe-bottom, 0px))',
      paddingBottom: 'var(--safe-bottom, 0px)',
      background: '#ffffff',
      borderTop: '0.5px solid #eeeeee',
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
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 4px',
              color: isActive ? 'var(--fs-primary, #0f2d1a)' : '#aaaaaa',
              fontFamily: 'inherit',
              minHeight: 44,
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--fs-primary, #0f2d1a)' : '#bbbbbb',
            }}>
              {tab.icon}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
