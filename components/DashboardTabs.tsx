'use client'

import React, { useState } from 'react'
import { MapView } from '@/components/MapView'
import { InlineAskInput } from '@/components/InlineAskInput'
import { CurrentNewsPanel } from '@/components/CurrentNewsPanel'
import { OverviewHighlights } from '@/components/OverviewHighlights'

type Props = {
  totalAum: number
  totalManagers: number
  latestDate: Date | null
  hasPfrdaData: boolean
}

export function DashboardTabs({
  totalAum,
  totalManagers,
  latestDate,
  hasPfrdaData,
}: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'news'>('overview')
  const metricsSlot = (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          All India AUM
        </p>
        <p className="mt-0.5 text-lg font-bold text-cyan-400">
          {hasPfrdaData ? `₹ ${Math.round(totalAum).toLocaleString()} Cr` : '—'}
        </p>
        {hasPfrdaData && latestDate && (
          <p className="text-[10px] text-slate-500">
            As of {latestDate.toISOString().slice(0, 10)}
          </p>
        )}
      </div>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Fund managers
        </p>
        <p className="mt-0.5 text-lg font-bold text-cyan-400">
          {hasPfrdaData ? totalManagers : '—'}
        </p>
        <p className="text-[10px] text-slate-500">PFRDA-registered (M1)</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-[480px] flex-col">
      {!hasPfrdaData && (
        <div
          className="mb-3 flex-shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-200"
          role="alert"
        >
          <strong>No PFRDA data yet.</strong> Click{' '}
          <strong>Refresh from PFRDA</strong> in the top bar to fetch the latest
          data.
        </div>
      )}

      <section className="min-h-0 flex-1 rounded-2xl border border-slate-700/50 bg-slate-900/50 shadow-xl backdrop-blur overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-1.5 border-b border-slate-700/50 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full bg-slate-900/80 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`rounded-full px-3 py-1 transition ${
                    activeTab === 'overview'
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('news')}
                  className={`rounded-full px-3 py-1 transition ${
                    activeTab === 'news'
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Current news
                </button>
              </div>
              {activeTab === 'news' && (
                <p className="hidden text-xs text-slate-500 sm:block">
                  Live news and articles about the Indian pension market.
                </p>
              )}
            </div>
            {activeTab === 'overview' && <OverviewHighlights />}
          </div>
          <div className="min-h-0 flex-1">
            {activeTab === 'overview' ? (
              <MapView
                rightTopSlot={metricsSlot}
                rightBottomSlot={<InlineAskInput />}
              />
            ) : (
              <div className="h-full px-3 py-3">
                <CurrentNewsPanel />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
