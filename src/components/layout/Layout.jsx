import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] flex bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Extra bottom padding on mobile so the last rows clear the iOS Safari
            chrome bar; #root already adds the safe-area inset on top of this. */}
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-24 md:pb-8 max-w-[1400px] mx-auto">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
        </div>
      </main>
    </div>
  )
}
