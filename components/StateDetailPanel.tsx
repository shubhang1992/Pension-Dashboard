'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type StateData = {
  stateName: string
  aumCrore: number
  allIndiaAumCrore?: number
  subscribers: number
  contributionCrore?: number | null
  contributionHistory?: Record<string, number> | null
  asOfDate: string | null
  managers: { name: string; aumCrore: number }[]
  message?: string
  isAllIndiaFallback?: boolean
  source?: string
  genderFemale?: number | null
  genderMale?: number | null
  genderTransgender?: number | null
  ageBreakdown?: Record<string, number> | null
  leaderboard?: { name: string; aumCrore: number }[]
}

type Props = {
  stateName: string | null
  onClose: () => void
}

export function StateDetailPanel({ stateName, onClose }: Props) {
  const [data, setData] = useState<StateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!stateName) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/state/${encodeURIComponent(stateName)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load')
        setLoading(false)
      })
  }, [stateName])

  if (!stateName) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center p-8 text-center">
        <p className="text-slate-500">Select a state</p>
      </div>
    )
  }

  const hasGender =
    data &&
    ((data.genderFemale ?? 0) + (data.genderMale ?? 0) + (data.genderTransgender ?? 0) > 0)
  const hasAge =
    data?.ageBreakdown && Object.keys(data.ageBreakdown).length > 0
  const totalGender = hasGender
    ? (data!.genderFemale ?? 0) + (data!.genderMale ?? 0) + (data!.genderTransgender ?? 0)
    : 0
  const showAumAsAllIndia =
    data && data.aumCrore <= 0 && (data.allIndiaAumCrore ?? 0) > 0

  // Pick the latest 12 months from contributionHistory (rolling window)
  let latestMonths: [string, number][] = []
  if (data?.contributionHistory && Object.keys(data.contributionHistory).length > 0) {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    type Parsed = { label: string; value: number; year: number; monthIndex: number }
    const parsed: Parsed[] = []
    for (const [label, value] of Object.entries(data.contributionHistory)) {
      const m = /^([A-Za-z]{3})-(\d{2})$/.exec(label.trim())
      if (!m) continue
      const monthIdx = monthOrder.indexOf(m[1])
      if (monthIdx === -1) continue
      const yy = Number(m[2])
      const year = 2000 + yy
      parsed.push({ label, value, year, monthIndex: monthIdx })
    }
    if (parsed.length > 0) {
      parsed.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.monthIndex - b.monthIndex
      })
      const last = parsed.slice(-12)
      latestMonths = last.map((p) => [p.label, p.value])
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-3">
        <h3 className="text-lg font-semibold text-white">{stateName}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center py-8 text-cyan-400">
          Loading…
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {data.isAllIndiaFallback && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
              <strong>All-India totals (reference)</strong> — State-wise data not available for this state.
            </div>
          )}
          {data.message && !data.isAllIndiaFallback && (
            <p className="text-sm text-amber-400">{data.message}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-800/70 px-4 py-3 border border-slate-700/40">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {showAumAsAllIndia ? 'AUM (₹ Cr) — All-India' : 'AUM (₹ Cr)'}
              </p>
              <p className="mt-1 text-xl font-bold text-cyan-400">
                {data.aumCrore > 0
                  ? Math.round(data.aumCrore).toLocaleString()
                  : (data.allIndiaAumCrore ?? 0) > 0
                    ? Math.round(data.allIndiaAumCrore!).toLocaleString()
                    : '—'}
              </p>
              {showAumAsAllIndia && (
                <p className="mt-0.5 text-[10px] text-slate-500">State-wise AUM not in PFRDA A22/A6</p>
              )}
            </div>
            <div className="rounded-xl bg-slate-800/70 px-4 py-3 border border-slate-700/40">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Subscribers
              </p>
              <p className="mt-1 text-xl font-bold text-cyan-400">
                {data.subscribers > 0
                  ? data.subscribers.toLocaleString()
                  : '—'}
              </p>
            </div>
            {data.contributionCrore != null && data.contributionCrore > 0 && (
              <div className="col-span-2 rounded-xl bg-slate-800/70 px-4 py-3 border border-slate-700/40">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Total contribution (₹ Cr) — SG sector
                </p>
                <p className="mt-1 text-xl font-bold text-cyan-400">
                  {Math.round(data.contributionCrore).toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Cumulative from PFRDA M7 (since Dec-2014)
                </p>
              </div>
            )}
          </div>

          {latestMonths.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-300">
                Monthly SG contribution (₹ Cr)
              </h4>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {latestMonths.map(([month, value]) => (
                  <li
                    key={month}
                    className="flex justify-between rounded-lg bg-slate-800/60 px-2 py-1.5 text-xs"
                  >
                    <span className="text-slate-300">{month}</span>
                    <span className="font-mono text-cyan-400">
                      {Math.round(value).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/states/${encodeURIComponent(stateName)}/contributions`}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  View full contribution details →
                </Link>
              </div>
            </div>
          )}

          {hasGender && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-300">
                Gender (APY · latest year)
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Female', value: data.genderFemale ?? 0, color: 'bg-pink-500' },
                  { label: 'Male', value: data.genderMale ?? 0, color: 'bg-blue-500' },
                  { label: 'Transgender', value: data.genderTransgender ?? 0, color: 'bg-violet-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-slate-400">{label}</span>
                    <div className="flex-1 rounded-lg bg-slate-700/80 h-5 overflow-hidden">
                      <div
                        className={`h-full ${color}`}
                        style={{
                          width: totalGender > 0 ? `${(value / totalGender) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-mono text-slate-300">
                      {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasAge && data.ageBreakdown && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-300">
                Age (NPS All Citizen · latest year)
              </h4>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {Object.entries(data.ageBreakdown)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([band, count]) => (
                    <li
                      key={band}
                      className="flex justify-between rounded-lg bg-slate-800/60 px-2 py-1.5 text-xs"
                    >
                      <span className="text-slate-300">{band}</span>
                      <span className="font-mono text-cyan-400">{count.toLocaleString()}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {data.asOfDate && (
            <p className="text-xs text-slate-500">
              As of {data.asOfDate}
              {data.source === 'state_wise_snapshot' && (
                <span className="ml-1"> · PFRDA A22 + A6</span>
              )}
            </p>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-300">
              Fund manager leaderboard (All-India by AUM)
            </h4>
            {(data.leaderboard?.length ?? 0) > 0 ? (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {data.leaderboard!.slice(0, 15).map((mg, i) => (
                  <li
                    key={mg.name}
                    className="flex items-center gap-2 rounded-xl bg-slate-800/60 px-3 py-2 text-sm border border-slate-700/40"
                  >
                    <span className="w-5 text-slate-500 font-mono text-xs">{i + 1}</span>
                    <span className="flex-1 truncate text-slate-200">{mg.name}</span>
                    <span className="font-mono text-cyan-400 shrink-0">
                      {mg.aumCrore > 0
                        ? `${Math.round(mg.aumCrore).toLocaleString()} Cr`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No AUM data. Click <strong>Refresh from PFRDA</strong> to load M1 data.
              </p>
            )}
          </div>

          {data.managers.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-300">
                Fund managers in this state (by HQ)
              </h4>
              <ul className="space-y-2">
                {data.managers.map((mg) => (
                  <li
                    key={mg.name}
                    className="flex justify-between rounded-xl bg-slate-800/60 px-3 py-2 text-sm border border-slate-700/40"
                  >
                    <span className="text-slate-200">{mg.name}</span>
                    <span className="font-mono text-cyan-400">
                      {mg.aumCrore > 0
                        ? `${Math.round(mg.aumCrore).toLocaleString()} Cr`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
