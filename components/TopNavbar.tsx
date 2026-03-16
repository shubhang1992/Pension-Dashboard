'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/GlobalSearch'

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
    let timeout: ReturnType<typeof setTimeout> | null = null
    try {
      const controller = new AbortController()
      timeout = setTimeout(() => controller.abort(), 120_000)
      const res = await fetch('/api/sync-pfrda', {
        method: 'POST',
        signal: controller.signal,
      })
      if (timeout) clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error ?? `HTTP ${res.status}`,
        })
        return
      }
      const m1 = data.m1Rows ?? 0
      const state = data.stateUpserted ?? 0
      const asOf = data.m1LatestAsOf ? ` (M1 as of ${data.m1LatestAsOf})` : ''
      setMessage({
        type: 'success',
        text: state
          ? `Synced: ${m1} AUM rows, ${state} state snapshots${asOf}.`
          : `Synced ${m1} rows from PFRDA${asOf}.`,
      })
      router.refresh()
    } catch (err) {
      setMessage({
        type: 'error',
        text:
          err instanceof Error && err.name === 'AbortError'
            ? 'Sync is taking too long. Refresh the page in 1-2 minutes to see updated data.'
            : err instanceof Error
              ? err.message
              : 'Refresh failed',
      })
    } finally {
      if (timeout) clearTimeout(timeout)
      setSyncing(false)
    }
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-700/50 bg-slate-900/80 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-4 sm:py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white sm:h-9 sm:w-9"
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
          <h2 className="truncate text-sm font-semibold text-white sm:text-base">
            India Pension Market
          </h2>
          <p className="hidden text-xs text-slate-400 sm:block">
            State-wise data · Fund managers · Auto-sync from PFRDA
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
        <GlobalSearch />
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handleRefreshFromPfrda}
          disabled={syncing}
          className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-2.5 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          title="Fetch latest M1, A22, A6, M7 from PFRDA and update the dashboard"
        >
          {syncing ? 'Syncing…' : (
            <>
              <span className="sm:hidden">Sync</span>
              <span className="hidden sm:inline">Refresh from PFRDA</span>
            </>
          )}
        </button>
        {message && (
          <span
            className={`hidden max-w-[220px] text-xs sm:inline ${
              message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {message.text}
          </span>
        )}
        <span className="hidden rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400 sm:inline-block">
          Internal
        </span>
      </div>
    </header>
  )
}
