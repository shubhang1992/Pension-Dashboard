'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { IndiaMap } from '@/components/IndiaMap'
import { StateMap } from '@/components/StateMap'
import { StateDetailPanel } from '@/components/StateDetailPanel'

const TRANSITION_DURATION_MS = 550
const STATE_LAYER_DELAY_MS = 90
const EASING = 'cubic-bezier(0.33, 1, 0.68, 1)'

type MapViewProps = {
  rightTopSlot?: React.ReactNode
  rightBottomSlot?: React.ReactNode
}

export function MapView({ rightTopSlot, rightBottomSlot }: MapViewProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateAumMap, setStateAumMap] = useState<Record<string, number>>({})
  const [stateSubscribersMap, setStateSubscribersMap] = useState<Record<string, number>>({})
  const [stateMapRevealed, setStateMapRevealed] = useState(false)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/states')
      .then((r) => r.json())
      .then((d) => {
        setStateAumMap(d.stateAum ?? {})
        setStateSubscribersMap(d.stateSubscribers ?? {})
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedState) {
      setStateMapRevealed(false)
      revealTimeoutRef.current = setTimeout(() => setStateMapRevealed(true), STATE_LAYER_DELAY_MS)
    } else {
      setStateMapRevealed(false)
    }
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [selectedState])

  const handleSelectState = useCallback((name: string) => {
    setSelectedState((prev) => (prev === name ? null : name))
  }, [])

  const handleClosePanel = useCallback(() => setSelectedState(null), [])

  const showStateMap = !!selectedState

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Map area */}
      <div className="relative min-h-[260px] flex-1 overflow-hidden p-2 sm:min-h-[320px] sm:p-3 lg:min-h-0">
        {/* India map layer */}
        <div
          className="absolute inset-2 flex items-center justify-center"
          style={{
            opacity: showStateMap ? 0 : 1,
            transform: showStateMap ? 'scale(0.96)' : 'scale(1)',
            filter: showStateMap ? 'blur(4px)' : 'blur(0px)',
            pointerEvents: showStateMap ? 'none' : 'auto',
            transition: `opacity ${TRANSITION_DURATION_MS}ms ${EASING}, transform ${TRANSITION_DURATION_MS}ms ${EASING}, filter ${TRANSITION_DURATION_MS}ms ${EASING}`,
          }}
        >
          <IndiaMap
            selectedStateName={selectedState}
            onSelectState={handleSelectState}
            stateAumMap={stateAumMap}
            stateSubscribersMap={stateSubscribersMap}
            className="h-full w-full"
          />
        </div>

        {/* State map layer */}
        {showStateMap && selectedState && (
          <>
            <button
              type="button"
              onClick={handleClosePanel}
              className="absolute left-3 top-3 z-10 rounded-lg border border-slate-600 bg-slate-800/95 px-2.5 py-1.5 text-xs font-medium text-slate-200 shadow-lg backdrop-blur transition hover:border-cyan-500/50 hover:bg-slate-700/95 hover:text-white sm:left-5 sm:top-5 sm:px-3 sm:py-2 sm:text-sm"
              aria-label="Back to India map"
            >
              ← Back
            </button>
            <div
              className="absolute inset-2 flex items-center justify-center"
              style={{
                opacity: stateMapRevealed ? 1 : 0,
                transform: stateMapRevealed ? 'scale(1)' : 'scale(0.96)',
                transition: `opacity ${TRANSITION_DURATION_MS}ms ${EASING} ${STATE_LAYER_DELAY_MS}ms, transform ${TRANSITION_DURATION_MS}ms ${EASING} ${STATE_LAYER_DELAY_MS}ms`,
              }}
            >
              <StateMap
                stateName={selectedState}
                className="h-full w-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Side panel: metrics + state detail + chatbot */}
      <div className="flex flex-shrink-0 flex-col overflow-hidden border-t border-slate-700/50 px-3 py-3 sm:px-4 lg:w-[340px] lg:min-h-0 lg:border-l lg:border-t-0 xl:w-[360px]">
        {rightTopSlot && <div className="flex-shrink-0 pb-3">{rightTopSlot}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <StateDetailPanel
            stateName={selectedState}
            onClose={handleClosePanel}
          />
        </div>
        {rightBottomSlot && <div className="flex-shrink-0">{rightBottomSlot}</div>}
      </div>
    </div>
  )
}
