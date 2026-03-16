'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { IndiaMap } from '@/components/IndiaMap'
import { StateMap } from '@/components/StateMap'
import { StateDetailPanel } from '@/components/StateDetailPanel'

const TRANSITION_MS = 500
const REVEAL_DELAY = 90
const EASING = 'cubic-bezier(0.33, 1, 0.68, 1)'

type MapMode = 'aum' | 'subscribers' | 'coverage'

const MODE_META: Record<MapMode, { label: string; description: string }> = {
  aum: { label: 'AUM', description: 'Assets Under Management by state' },
  subscribers: { label: 'Subscribers', description: 'NPS subscribers by state' },
  coverage: { label: 'Coverage', description: 'Pension adoption vs working-age population' },
}

type MapViewProps = {
  rightTopSlot?: React.ReactNode
  rightBottomSlot?: React.ReactNode
}

export function MapView({ rightTopSlot, rightBottomSlot }: MapViewProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateAumMap, setStateAumMap] = useState<Record<string, number>>({})
  const [stateSubscribersMap, setStateSubscribersMap] = useState<Record<string, number>>({})
  const [stateCoverageMap, setStateCoverageMap] = useState<Record<string, number>>({})
  const [mapMode, setMapMode] = useState<MapMode>('aum')
  const [stateMapRevealed, setStateMapRevealed] = useState(false)
  const searchParams = useSearchParams()
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/states')
      .then((r) => r.json())
      .then((d) => {
        setStateAumMap(d.stateAum ?? {})
        setStateSubscribersMap(d.stateSubscribers ?? {})
        setStateCoverageMap(d.stateCoverage ?? {})
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const p = searchParams.get('state')
    if (p && !selectedState) setSelectedState(p)
  }, [searchParams, selectedState])

  useEffect(() => {
    if (selectedState) {
      setStateMapRevealed(false)
      revealRef.current = setTimeout(() => setStateMapRevealed(true), REVEAL_DELAY)
    } else {
      setStateMapRevealed(false)
    }
    return () => { if (revealRef.current) clearTimeout(revealRef.current) }
  }, [selectedState])

  const handleSelect = useCallback((name: string) => {
    setSelectedState((prev) => (prev === name ? null : name))
  }, [])
  const handleClose = useCallback(() => setSelectedState(null), [])

  const showState = !!selectedState

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* ── Map column ── */}
      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden sm:min-h-[340px] lg:min-h-0">

        {/* Mode toggle — compact segmented control */}
        {!showState && (
          <div className="flex flex-shrink-0 items-center gap-2.5 px-3 py-1.5 sm:px-4">
            {(['aum', 'subscribers', 'coverage'] as const).map((mode, i) => (
              <React.Fragment key={mode}>
                {i > 0 && <span className="text-slate-700">·</span>}
                <button
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={`text-[11px] font-medium transition-colors sm:text-xs ${
                    mapMode === mode
                      ? 'text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {MODE_META[mode].label}
                </button>
              </React.Fragment>
            ))}
            <span className="hidden text-[10px] text-slate-600 sm:inline">
              — {MODE_META[mapMode].description}
            </span>
          </div>
        )}

        {/* Map container */}
        <div className="relative min-h-0 flex-1">
          {/* India map layer */}
          <div
            className="absolute inset-0 flex items-center justify-center p-2 sm:p-3"
            style={{
              opacity: showState ? 0 : 1,
              transform: showState ? 'scale(0.95)' : 'scale(1)',
              filter: showState ? 'blur(6px)' : 'blur(0)',
              pointerEvents: showState ? 'none' : 'auto',
              transition: `all ${TRANSITION_MS}ms ${EASING}`,
            }}
          >
            <IndiaMap
              selectedStateName={selectedState}
              onSelectState={handleSelect}
              stateAumMap={stateAumMap}
              stateSubscribersMap={stateSubscribersMap}
              stateCoverageMap={stateCoverageMap}
              mapMode={mapMode}
              className="h-full w-full"
            />
          </div>

          {/* State map layer */}
          {showState && selectedState && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-slate-600/80 bg-slate-800/95 px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-lg backdrop-blur transition-colors hover:border-cyan-500/50 hover:text-white sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              <div
                className="absolute inset-0 flex items-center justify-center p-2 sm:p-3"
                style={{
                  opacity: stateMapRevealed ? 1 : 0,
                  transform: stateMapRevealed ? 'scale(1)' : 'scale(0.95)',
                  transition: `all ${TRANSITION_MS}ms ${EASING} ${REVEAL_DELAY}ms`,
                }}
              >
                <StateMap stateName={selectedState} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Side panel ── */}
      <div className="flex flex-shrink-0 flex-col overflow-hidden border-t border-slate-700/50 px-3 py-3 sm:px-4 lg:w-[340px] lg:min-h-0 lg:border-l lg:border-t-0 xl:w-[360px]">
        {rightTopSlot && <div className="flex-shrink-0 pb-3">{rightTopSlot}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <StateDetailPanel stateName={selectedState} onClose={handleClose} />
        </div>
        {rightBottomSlot && <div className="flex-shrink-0">{rightBottomSlot}</div>}
      </div>
    </div>
  )
}
