import { useState } from 'react'
import BottomTabBar from './BottomTabBar'

// Mobile app shell: sticky header + scrolling content + fixed bottom tab bar.
//
// Note: this relies on normal document scroll (the header is sticky, the tab bar
// is fixed) rather than clipping #root to 100dvh. That keeps every other page —
// which renders inside the same shared Layout — scrollable on mobile.
//
// `activeTab` may be controlled (pass activeTab + onTabChange) or uncontrolled
// (pass defaultTab). The bottom bar's `top` offset accounts for the iOS safe area.

export default function MobileLayout({
  header,
  content,
  tabs,
  activeTab,
  defaultTab,
  onTabChange,
}) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id || '')
  const isControlled = activeTab !== undefined
  const active = isControlled ? activeTab : internalTab

  function handleTabChange(id) {
    if (!isControlled) setInternalTab(id)
    onTabChange?.(id)
  }

  return (
    <div style={{
      background: 'var(--fs-bg)',
      minHeight: '100dvh',
    }}>
      {/* Header — pinned below the safe-area inset while scrolling */}
      <div style={{
        position: 'sticky',
        top: 'var(--safe-top)',
        zIndex: 50,
      }}>
        {header}
      </div>

      {/* Scrollable content — padded so the last rows clear the fixed tab bar */}
      <div style={{
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 16px)',
      }}>
        {content}
      </div>

      {/* Bottom tab bar */}
      <BottomTabBar
        tabs={tabs}
        activeTab={active}
        onChange={handleTabChange}
      />
    </div>
  )
}
