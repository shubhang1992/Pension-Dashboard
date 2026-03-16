'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopNavbar } from '@/components/TopNavbar'

const SIDEBAR_STORAGE_KEY = 'pension-dashboard-sidebar-open'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored !== null) setSidebarOpen(stored === 'true')
    } catch {
      // ignore
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false')
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: overlay on mobile, push on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform overflow-hidden bg-slate-900 transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:transform-none lg:transition-[width]
          ${sidebarOpen ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-0'}
        `}
        aria-hidden={!sidebarOpen}
      >
        <div className="h-full w-64">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onMenuClick={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
