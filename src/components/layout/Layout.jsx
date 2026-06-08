import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="flex flex-1 min-h-0 bg-canvas">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true), isMobile: true }} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true), isMobile: false }} />
        </div>
      </main>
    </div>
  )
}
