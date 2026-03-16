'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import indiaMapData from '@svg-maps/india'
import { MapView } from '@/components/MapView'
import { InlineAskInput } from '@/components/InlineAskInput'
import { CurrentNewsPanel } from '@/components/CurrentNewsPanel'
import { OverviewHighlights } from '@/components/OverviewHighlights'

type MapData = { locations: { name: string }[] }

const ALL_STATES = ((indiaMapData as MapData).locations)
  .map((l) => l.name)
  .sort((a, b) => a.localeCompare(b))

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
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const handleStateChange = useCallback((name: string | null) => {
    setSelectedState(name)
  }, [])

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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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

              {activeTab === 'overview' && (
                <StateSearchDropdown
                  selectedState={selectedState}
                  onSelect={handleStateChange}
                />
              )}
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
              selectedState={selectedState}
              onSelectState={handleStateChange}
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

// ── Searchable state dropdown ──

function StateSearchDropdown({
  selectedState,
  onSelect,
}: {
  selectedState: string | null
  onSelect: (name: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_STATES
    const q = query.toLowerCase()
    return ALL_STATES.filter((s) => s.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const handlePick = useCallback(
    (name: string) => {
      onSelect(selectedState === name ? null : name)
      setOpen(false)
    },
    [onSelect, selectedState]
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 sm:text-xs"
      >
        <svg className="h-3 w-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a6 6 0 10-1.414 1.414l4.243 4.243a1 1 0 001.414-1.414z" />
        </svg>
        <span className="max-w-[100px] truncate sm:max-w-[140px]">
          {selectedState ?? 'Select state'}
        </span>
        <svg className="h-3 w-3 flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-800 shadow-2xl sm:w-64">
          <div className="border-b border-slate-700/50 px-2.5 py-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
                if (e.key === 'Enter' && filtered.length === 1) handlePick(filtered[0])
              }}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">No states found</li>
            )}
            {filtered.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => handlePick(name)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                    selectedState === name
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {selectedState === name && (
                    <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={selectedState === name ? '' : 'pl-5'}>{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
