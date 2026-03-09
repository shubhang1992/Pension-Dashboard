'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { IndiaMap } from '@/components/IndiaMap'
import { StateDetailPanel } from '@/components/StateDetailPanel'

export function MapView() {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateAumMap, setStateAumMap] = useState<Record<string, number>>({})
  const [stateSubscribersMap, setStateSubscribersMap] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/states')
      .then((r) => r.json())
      .then((d) => {
        setStateAumMap(d.stateAum ?? {})
        setStateSubscribersMap(d.stateSubscribers ?? {})
      })
      .catch(() => {})
  }, [])

  const handleSelectState = useCallback((name: string) => {
    setSelectedState((prev) => (prev === name ? null : name))
  }, [])

  const handleClosePanel = useCallback(() => setSelectedState(null), [])

  return (
    <div className="grid h-full min-h-[calc(100vh-10rem)] grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 shadow-xl backdrop-blur">
        <div className="border-b border-slate-700/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Click a state for subscribers, contribution &amp; demographics
          </p>
        </div>
        <div className="flex-1 min-h-[400px] overflow-hidden p-2">
          <IndiaMap
            selectedStateName={selectedState}
            onSelectState={handleSelectState}
            stateAumMap={stateAumMap}
            stateSubscribersMap={stateSubscribersMap}
            className="h-full min-h-[400px]"
          />
        </div>
      </div>
      <div className="min-h-[300px] lg:min-h-0">
        <StateDetailPanel
          stateName={selectedState}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  )
}
