'use client'

import React from 'react'
import { MapView } from '@/components/MapView'

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
  return (
    <div className="space-y-5">
      <div className="space-y-5">
          {!hasPfrdaData && (
            <div
              className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-5 py-4 text-sm text-amber-200"
              role="alert"
            >
              <strong>No PFRDA data yet.</strong> Click{' '}
              <strong>Refresh from PFRDA</strong> in the top bar to fetch the
              latest data (M1, state-wise subscribers, SG contribution). No file
              uploads needed.
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 px-5 py-5 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                All India AUM
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-cyan-400">
                {hasPfrdaData
                  ? `₹ ${Math.round(totalAum).toLocaleString()} Cr`
                  : '—'}
              </p>
              {hasPfrdaData && latestDate && (
                <p className="mt-1 text-xs text-slate-500">
                  As of {latestDate.toISOString().slice(0, 10)}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 px-5 py-5 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fund managers
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-cyan-400">
                {hasPfrdaData ? totalManagers : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PFRDA-registered (M1)
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 px-5 py-5 shadow-lg backdrop-blur sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                State-wise view
              </p>
              <p className="mt-2 text-lg font-medium text-slate-200">
                Subscribers · Gender · Age · SG contribution
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Click a state on the map
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-slate-200">
              India map
            </h2>
            <MapView />
          </section>
        </div>
    </div>
  )
}
