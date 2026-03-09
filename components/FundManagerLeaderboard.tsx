'use client'

import React, { useEffect, useState } from 'react'

type SchemeRow = { schemeName: string; aumCrore: number }
type LeaderboardEntry = {
  rank: number
  name: string
  aumCrore: number
  sharePct: number
  schemes: SchemeRow[]
}

export function FundManagerLeaderboard() {
  const [data, setData] = useState<{
    leaderboard: LeaderboardEntry[]
    asOfDate: string | null
    totalAumCrore: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch('/api/fund-managers/leaderboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (rank: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(rank)) next.delete(rank)
      else next.add(rank)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-900/50 py-16">
        <p className="text-slate-400">Loading leaderboard…</p>
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 px-6 py-8 text-center text-red-300">
        {error ?? 'No data'}
      </div>
    )
  }
  const { leaderboard, asOfDate, totalAumCrore } = data
  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 px-6 py-12 text-center text-slate-400">
        <p>No fund manager data yet.</p>
        <p className="mt-2 text-sm">Click <strong>Refresh from PFRDA</strong> in the top bar to load M1 data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Fund managers by AUM</h2>
          <p className="text-sm text-slate-400">
            All-India totals · as of {asOfDate ?? '—'} · ₹ {Math.round(totalAumCrore).toLocaleString()} Cr total
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/60">
                <th className="px-4 py-3 font-semibold text-slate-300">#</th>
                <th className="px-4 py-3 font-semibold text-slate-300">Fund manager</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">AUM (₹ Cr)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Share</th>
                <th className="w-10 px-2 py-3" aria-label="Expand" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {leaderboard.map((row) => {
                const isOpen = expanded.has(row.rank)
                return (
                  <React.Fragment key={row.name}>
                    <tr
                      className="group transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono text-slate-500">{row.rank}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{row.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-cyan-400">
                        {Math.round(row.aumCrore).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {row.sharePct.toFixed(1)}%
                      </td>
                      <td className="px-2 py-3">
                        {row.schemes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggle(row.rank)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-700/60 hover:text-cyan-400"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? 'Collapse schemes' : 'Show scheme breakdown'}
                          >
                            <span className="text-xs font-medium">
                              {isOpen ? '−' : '+'}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && row.schemes.length > 0 && (
                      <tr className="bg-slate-800/30">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="rounded-lg border border-slate-700/50 bg-slate-900/60 py-2 pl-6 pr-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Scheme-wise AUM
                            </p>
                            <ul className="space-y-1.5">
                              {row.schemes.map((s) => (
                                <li
                                  key={s.schemeName}
                                  className="flex justify-between gap-4 text-sm"
                                >
                                  <span className="text-slate-300">{s.schemeName}</span>
                                  <span className="font-mono text-cyan-400/90">
                                    ₹ {Math.round(s.aumCrore).toLocaleString()} Cr
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
