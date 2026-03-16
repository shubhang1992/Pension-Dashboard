'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopNavbar } from '@/components/TopNavbar'

const SIDEBAR_STORAGE_KEY = 'pension-dashboard-sidebar-open'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored !== null) setSidebarOpen(stored === 'true')
    } catch {
      // ignore
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <div className="flex h-screen">
      <aside
        className={`flex-none overflow-hidden border-r border-slate-700/50 bg-slate-900/80 backdrop-blur transition-[width] duration-200 ease-out ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="w-64">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onMenuClick={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
