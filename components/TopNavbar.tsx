'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

type TopNavbarProps = {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export function TopNavbar({ onMenuClick, sidebarOpen = true }: TopNavbarProps) {
  const router = useRouter()
  const [syncing, setSyncing] = React.useState(false)
  const [message, setMessage] = React.useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function handleRefreshFromPfrda() {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sync-pfrda', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error ?? `HTTP ${res.status}`,
        })
        return
      }
      const m1 = data.m1Rows ?? data.rowsImported ?? 0
      const state = data.stateUpserted ?? 0
      setMessage({
        type: 'success',
        text: state
          ? `Synced: ${m1} AUM rows, ${state} state snapshots.`
          : `Synced ${m1} rows from PFRDA.`,
      })
      router.refresh()
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Refresh failed',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 bg-slate-900/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">
            India Pension Market
          </h2>
          <p className="text-xs text-slate-400">
            State-wise data · Fund managers · Auto-sync from PFRDA (no uploads)
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRefreshFromPfrda}
          disabled={syncing}
          className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
          title="Fetch latest M1, A22, A6, M7 from PFRDA and update the dashboard"
        >
          {syncing ? 'Syncing…' : 'Refresh from PFRDA'}
        </button>
        {message && (
          <span
            className={`max-w-[200px] text-xs ${
              message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {message.text}
          </span>
        )}
        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
          Internal
        </span>
      </div>
    </header>
  )
}
