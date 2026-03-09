'use client'

import React, { useState } from 'react'

type Props = {
  stateName: string
  total: number
  ordered: [string, number][]
}

type TabId = 'overview' | 'analytics'

export function StateContributionsTabs({ stateName, total, ordered }: Props) {
  const [tab, setTab] = useState<TabId>('overview')

  const monthsCount = ordered.length
  const avgPerMonth = monthsCount > 0 ? total / monthsCount : 0
  const latest = ordered[ordered.length - 1] ?? null

  // Analytics: best/worst month and last-12 vs previous-12
  let best: [string, number] | null = null
  let worst: [string, number] | null = null
  for (const [label, value] of ordered) {
    if (!best || value > best[1]) best = [label, value]
    if ((!worst || value < worst[1]) && value > 0) worst = [label, value]
  }

  const last12 = ordered.slice(-12)
  const prev12 = ordered.slice(-24, -12)
  const last12Total = last12.reduce((s, [, v]) => s + v, 0)
  const prev12Total = prev12.reduce((s, [, v]) => s + v, 0)
  const last12Avg = last12.length ? last12Total / last12.length : 0
  const prev12Avg = prev12.length ? prev12Total / prev12.length : 0
  let yoyChangePct: number | null = null
  if (prev12Total > 0) {
    yoyChangePct = ((last12Total - prev12Total) / prev12Total) * 100
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            SG contributions — {stateName}
          </h1>
          <p className="text-sm text-slate-400">
            Monthly SG-sector contribution trend from PFRDA M7.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-900/70 p-1">
          {(['overview', 'analytics'] as TabId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              {id === 'overview' ? 'Overview' : 'Analytics'}
            </button>
          ))}
        </div>
      </header>

      {tab === 'overview' && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total SG contribution
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                ₹ {Math.round(total).toLocaleString()} Cr
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Number of months
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                {monthsCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Avg per month
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                ₹ {Math.round(avgPerMonth).toLocaleString()} Cr
              </p>
            </div>
          </section>

          {latest && (
            <p className="text-xs text-slate-500">
              Latest month in M7: {latest[0]} · ₹{' '}
              {Math.round(latest[1]).toLocaleString()} Cr
            </p>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Monthly SG contribution history
            </h2>
            {ordered.length === 0 ? (
              <p className="text-sm text-slate-500">
                No monthly contribution data available.
              </p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900/70">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-slate-700/60 bg-slate-800/80">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-300">
                        Month
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-300">
                        Contribution (₹ Cr)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map(([label, value]) => (
                      <tr
                        key={label}
                        className="border-b border-slate-800/60 last:border-0"
                      >
                        <td className="px-4 py-2 text-slate-200">{label}</td>
                        <td className="px-4 py-2 text-right font-mono text-cyan-400">
                          {Math.round(value).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'analytics' && (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last 12 months total
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                ₹ {Math.round(last12Total).toLocaleString()} Cr
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Prev. 12 months total
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                ₹ {Math.round(prev12Total).toLocaleString()} Cr
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                YoY change (last 12 vs prev 12)
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                {yoyChangePct === null
                  ? '—'
                  : `${yoyChangePct >= 0 ? '+' : ''}${yoyChangePct.toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Avg last 12 months
              </p>
              <p className="mt-2 text-2xl font-bold text-cyan-400">
                ₹ {Math.round(last12Avg).toLocaleString()} Cr
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Best month
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-200">
                {best ? best[0] : '—'}
              </p>
              <p className="text-lg font-bold text-cyan-400">
                {best ? `₹ ${Math.round(best[1]).toLocaleString()} Cr` : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Weakest month (non-zero)
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-200">
                {worst ? worst[0] : '—'}
              </p>
              <p className="text-lg font-bold text-cyan-400">
                {worst ? `₹ ${Math.round(worst[1]).toLocaleString()} Cr` : '—'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

