import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto">
          <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
        </div>
      </main>
    </div>
  )
}
