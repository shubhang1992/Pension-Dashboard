'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

type SidebarItem = {
  label: string
  href: string
}

const items: SidebarItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Fund Managers', href: '/fund-managers' },
  { label: 'Reports', href: '/reports' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col border-r border-slate-700/50 bg-slate-900/80 px-4 py-6 backdrop-blur">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-white">
          Pension Dashboard
        </h1>
        <p className="text-xs text-slate-400">
          India · Overview &amp; leaderboards
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="mt-8 border-t border-slate-700/50 pt-4 text-xs text-slate-500">
        Source: PFRDA M1, A22, A6, M7
      </div>
    </aside>
  )
}
