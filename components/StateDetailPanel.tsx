'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { STATE_WORKING_AGE_POPULATION } from '@/lib/census-data'

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
      <div className="flex min-h-[120px] flex-col items-center justify-center p-4 text-center sm:min-h-[280px] sm:p-8">
        <p className="text-xs text-slate-500 sm:text-sm">Select a state on the map</p>
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
    <div className="flex h-full flex-col rounded-xl border border-slate-700/50 bg-slate-900/80 shadow-xl backdrop-blur sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2 sm:px-4 sm:py-3">
        <h3 className="text-sm font-semibold text-white sm:text-lg">{stateName}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors sm:px-2.5 sm:py-1.5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center py-6 text-cyan-400 sm:py-8">
          Loading…
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-900/20 px-3 py-2 text-xs text-red-300 sm:mt-4 sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
          {data.isAllIndiaFallback && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1.5 text-[11px] text-amber-200 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
              <strong>All-India totals (reference)</strong> — State-wise data not available.
            </div>
          )}
          {data.message && !data.isAllIndiaFallback && (
            <p className="text-xs text-amber-400 sm:text-sm">{data.message}</p>
          )}

          {data.subscribers > 0 && (() => {
            const pop = STATE_WORKING_AGE_POPULATION[stateName] ?? 0
            const penetration = pop > 0 ? ((data.subscribers / pop) * 100).toFixed(2) : null
            return penetration ? (
              <div className="rounded-lg bg-slate-800/70 px-3 py-2 border border-slate-700/40 sm:rounded-xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                  Penetration Rate
                </p>
                <p className="mt-0.5 text-lg font-bold text-cyan-400 sm:mt-1 sm:text-2xl">
                  {penetration}%
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Subscribers / Working-age pop ({(pop / 1000000).toFixed(1)}M)
                </p>
              </div>
            ) : null
          })()}

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg bg-slate-800/70 px-3 py-2 border border-slate-700/40 sm:rounded-xl sm:px-4 sm:py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                {showAumAsAllIndia ? 'AUM — All-India' : 'AUM (₹ Cr)'}
              </p>
              <p className="mt-0.5 text-base font-bold text-cyan-400 sm:mt-1 sm:text-xl">
                {data.aumCrore > 0
                  ? Math.round(data.aumCrore).toLocaleString()
                  : (data.allIndiaAumCrore ?? 0) > 0
                    ? Math.round(data.allIndiaAumCrore!).toLocaleString()
                    : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/70 px-3 py-2 border border-slate-700/40 sm:rounded-xl sm:px-4 sm:py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                Subscribers
              </p>
              <p className="mt-0.5 text-base font-bold text-cyan-400 sm:mt-1 sm:text-xl">
                {data.subscribers > 0
                  ? data.subscribers.toLocaleString()
                  : '—'}
              </p>
            </div>
            {data.contributionCrore != null && data.contributionCrore > 0 && (
              <div className="col-span-2 rounded-lg bg-slate-800/70 px-3 py-2 border border-slate-700/40 sm:rounded-xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                  SG contribution (₹ Cr)
                </p>
                <p className="mt-0.5 text-base font-bold text-cyan-400 sm:mt-1 sm:text-xl">
                  {Math.round(data.contributionCrore).toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Cumulative · PFRDA M7
                </p>
              </div>
            )}
          </div>

          {latestMonths.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-slate-300 sm:mb-2 sm:text-sm">
                Monthly SG contribution (₹ Cr)
              </h4>
              <ul className="space-y-1 max-h-32 overflow-y-auto sm:max-h-40 sm:space-y-1.5">
                {latestMonths.map(([month, value]) => (
                  <li
                    key={month}
                    className="flex justify-between rounded-lg bg-slate-800/60 px-2 py-1 text-[11px] sm:py-1.5 sm:text-xs"
                  >
                    <span className="text-slate-300">{month}</span>
                    <span className="font-mono text-cyan-400">
                      {Math.round(value).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-end sm:mt-3">
                <Link
                  href={`/states/${encodeURIComponent(stateName)}/contributions`}
                  className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 sm:text-xs"
                >
                  View full details →
                </Link>
              </div>
            </div>
          )}

          {hasGender && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-slate-300 sm:mb-2 sm:text-sm">
                Gender (APY)
              </h4>
              <div className="space-y-1.5 sm:space-y-2">
                {[
                  { label: 'Female', value: data.genderFemale ?? 0, color: 'bg-pink-500' },
                  { label: 'Male', value: data.genderMale ?? 0, color: 'bg-blue-500' },
                  { label: 'Trans.', value: data.genderTransgender ?? 0, color: 'bg-violet-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-12 text-[11px] text-slate-400 sm:w-20 sm:text-xs">{label}</span>
                    <div className="flex-1 rounded-lg bg-slate-700/80 h-4 overflow-hidden sm:h-5">
                      <div
                        className={`h-full ${color}`}
                        style={{
                          width: totalGender > 0 ? `${(value / totalGender) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <span className="w-14 text-right text-[11px] font-mono text-slate-300 sm:w-16 sm:text-xs">
                      {value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasAge && data.ageBreakdown && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-slate-300 sm:mb-2 sm:text-sm">
                Age (NPS All Citizen)
              </h4>
              <ul className="space-y-1 max-h-32 overflow-y-auto sm:max-h-40 sm:space-y-1.5">
                {Object.entries(data.ageBreakdown)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([band, count]) => (
                    <li
                      key={band}
                      className="flex justify-between rounded-lg bg-slate-800/60 px-2 py-1 text-[11px] sm:py-1.5 sm:text-xs"
                    >
                      <span className="text-slate-300">{band}</span>
                      <span className="font-mono text-cyan-400">{count.toLocaleString()}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {data.asOfDate && (
            <p className="text-[10px] text-slate-500 sm:text-xs">
              As of {data.asOfDate}
              {data.source === 'state_wise_snapshot' && (
                <span className="ml-1"> · PFRDA A22 + A6</span>
              )}
            </p>
          )}

          <div>
            <h4 className="mb-1.5 text-xs font-semibold text-slate-300 sm:mb-2 sm:text-sm">
              Fund manager leaderboard
            </h4>
            {(data.leaderboard?.length ?? 0) > 0 ? (
              <ul className="space-y-1.5 max-h-40 overflow-y-auto sm:max-h-48 sm:space-y-2">
                {data.leaderboard!.slice(0, 10).map((mg, i) => (
                  <li
                    key={mg.name}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-2 py-1.5 text-xs border border-slate-700/40 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <span className="w-4 text-slate-500 font-mono text-[10px] sm:w-5 sm:text-xs">{i + 1}</span>
                    <span className="flex-1 truncate text-slate-200">{mg.name}</span>
                    <span className="font-mono text-cyan-400 shrink-0 text-[11px] sm:text-sm">
                      {mg.aumCrore > 0
                        ? `${Math.round(mg.aumCrore).toLocaleString()} Cr`
                        : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                No AUM data. Click <strong>Refresh from PFRDA</strong> to load M1 data.
              </p>
            )}
          </div>

          {data.managers.length > 0 && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-slate-300 sm:mb-2 sm:text-sm">
                Fund managers in this state
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {data.managers.map((mg) => (
                  <li
                    key={mg.name}
                    className="flex justify-between rounded-lg bg-slate-800/60 px-2 py-1.5 text-xs border border-slate-700/40 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
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
