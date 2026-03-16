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
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          All India AUM
        </p>
        <p className="mt-0.5 text-base font-bold text-cyan-400 sm:text-lg">
          {hasPfrdaData ? `₹ ${Math.round(totalAum).toLocaleString()} Cr` : '—'}
        </p>
        {hasPfrdaData && latestDate && (
          <p className="text-[10px] text-slate-500">
            As of {latestDate.toISOString().slice(0, 10)}
          </p>
        )}
      </div>
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-2.5 py-2 sm:px-3 sm:py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Fund managers
        </p>
        <p className="mt-0.5 text-base font-bold text-cyan-400 sm:text-lg">
          {hasPfrdaData ? totalManagers : '—'}
        </p>
        <p className="text-[10px] text-slate-500">PFRDA-registered (M1)</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hasPfrdaData && (
        <div
          className="mb-2 flex-shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200 sm:mb-3 sm:px-4 sm:py-2.5 sm:text-sm"
          role="alert"
        >
          <strong>No PFRDA data yet.</strong> Click{' '}
          <strong>Refresh from PFRDA</strong> in the top bar to fetch the latest
          data.
        </div>
      )}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50 shadow-xl backdrop-blur sm:rounded-2xl">
        <div className="flex flex-col gap-1 border-b border-slate-700/50 px-2.5 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-full bg-slate-900/80 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`rounded-full px-2.5 py-1 transition sm:px-3 ${
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
                className={`rounded-full px-2.5 py-1 transition sm:px-3 ${
                  activeTab === 'news'
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                News
              </button>
            </div>
            {activeTab === 'news' && (
              <p className="hidden text-xs text-slate-500 sm:block">
                Live news about the Indian pension market.
              </p>
            )}
          </div>
          {activeTab === 'overview' && (
            <div className="hidden sm:block">
              <OverviewHighlights />
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeTab === 'overview' ? (
            <MapView
              rightTopSlot={metricsSlot}
              rightBottomSlot={<InlineAskInput />}
            />
          ) : (
            <div className="h-full px-2.5 py-2.5 sm:px-3 sm:py-3">
              <CurrentNewsPanel />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
