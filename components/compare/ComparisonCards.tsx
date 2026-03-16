'use client'

import React, { useState } from 'react'

type GrowthRate = { '3m': number | null; '6m': number | null; '12m': number | null }

type ManagerData = {
  name: string
  latestAumCrore: number
  totalSubscribers: number
  marketSharePct: number
  growthRate: GrowthRate
}

type Props = {
  managers: ManagerData[]
}

const COLORS = ['text-cyan-400', 'text-emerald-400', 'text-amber-400']
const BORDER_COLORS = ['border-cyan-500/40', 'border-emerald-500/40', 'border-amber-500/40']

function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-500">N/A</span>
  const positive = value >= 0
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        positive
          ? 'bg-emerald-400/10 text-emerald-400'
          : 'bg-red-400/10 text-red-400'
      }`}
    >
      {positive ? '+' : ''}{value}%
    </span>
  )
}

export function ComparisonCards({ managers }: Props) {
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('3m')

  const maxAum = Math.max(...managers.map((m) => m.latestAumCrore), 1)
  const maxSubs = Math.max(...managers.map((m) => m.totalSubscribers), 1)
  const maxShare = Math.max(...managers.map((m) => m.marketSharePct), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Growth period:</span>
        {(['3m', '6m', '12m'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              period === p
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {managers.map((m, i) => {
          const isTopAum = m.latestAumCrore === maxAum
          const isTopSubs = m.totalSubscribers === maxSubs
          const isTopShare = m.marketSharePct === maxShare
          return (
            <div
              key={m.name}
              className={`rounded-2xl border bg-slate-800/70 p-5 ${BORDER_COLORS[i]} transition-shadow hover:shadow-lg`}
            >
              <h3 className={`text-lg font-bold ${COLORS[i]}`}>{m.name}</h3>

              <div className="mt-4 space-y-3">
                <div className={isTopAum ? 'rounded-lg bg-cyan-500/5 p-2 ring-1 ring-cyan-500/20' : ''}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Total AUM
                  </p>
                  <p className="text-xl font-bold text-white">
                    {'\u20B9'} {m.latestAumCrore.toLocaleString('en-IN')} Cr
                  </p>
                </div>

                <div className={isTopSubs ? 'rounded-lg bg-cyan-500/5 p-2 ring-1 ring-cyan-500/20' : ''}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Subscribers
                  </p>
                  <p className="text-xl font-bold text-white">
                    {m.totalSubscribers.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className={isTopShare ? 'rounded-lg bg-cyan-500/5 p-2 ring-1 ring-cyan-500/20' : ''}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Market Share
                  </p>
                  <p className="text-xl font-bold text-white">
                    {m.marketSharePct}%
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Growth ({period})
                  </p>
                  <div className="mt-1">
                    <GrowthBadge value={m.growthRate[period]} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
