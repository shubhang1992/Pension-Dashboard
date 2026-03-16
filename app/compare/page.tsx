'use client'

import React, { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { FundManagerSelector } from '@/components/compare/FundManagerSelector'
import { ComparisonCards } from '@/components/compare/ComparisonCards'
import { SchemeBreakdownComparison } from '@/components/compare/SchemeBreakdownComparison'
import { AumTrendComparison } from '@/components/compare/AumTrendComparison'

type ManagerResult = {
  name: string
  latestAumCrore: number
  totalSubscribers: number
  marketSharePct: number
  growthRate: { '3m': number | null; '6m': number | null; '12m': number | null }
  schemes: { schemeName: string; aumCrore: number; subscribers: number | null }[]
  aumTimeSeries: { date: string; aumCrore: number }[]
}

type CompareResponse = {
  managers: ManagerResult[]
  asOfDate: string | null
}

function CompareContent() {
  const searchParams = useSearchParams()
  const initialNames = (searchParams.get('names') ?? '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)

  const [selected, setSelected] = useState<string[]>(initialNames)
  const [data, setData] = useState<CompareResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComparison = useCallback(async (names: string[]) => {
    if (names.length < 2) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/fund-managers/compare?names=${encodeURIComponent(names.join(','))}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: CompareResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialNames.length >= 2) {
      fetchComparison(initialNames)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCompare() {
    fetchComparison(selected)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Compare Fund Managers
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select 2-3 fund managers to compare AUM, market share, schemes, and growth trends side-by-side.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 sm:p-6">
        <FundManagerSelector selected={selected} onChange={setSelected} />
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCompare}
            disabled={selected.length < 2 || loading}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Compare'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 px-6 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && data.managers.length >= 2 && (
        <>
          {data.asOfDate && (
            <p className="text-xs text-slate-500">Data as of {data.asOfDate}</p>
          )}

          <ComparisonCards managers={data.managers} />

          <SchemeBreakdownComparison
            managers={data.managers.map((m) => ({
              name: m.name,
              schemes: m.schemes,
            }))}
          />

          <AumTrendComparison
            managers={data.managers.map((m) => ({
              name: m.name,
              aumTimeSeries: m.aumTimeSeries,
            }))}
          />
        </>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex min-h-[320px] items-center justify-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      }>
        <CompareContent />
      </Suspense>
    </DashboardLayout>
  )
}
