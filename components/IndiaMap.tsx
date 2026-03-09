'use client'

import React, { useMemo } from 'react'
import indiaMapData from '@svg-maps/india'

type Location = { id: string; name: string; path: string }
type MapData = { label: string; viewBox: string; locations: Location[] }

const mapData = indiaMapData as MapData

type Props = {
  selectedStateName: string | null
  onSelectState: (stateName: string) => void
  stateAumMap?: Record<string, number>
  stateSubscribersMap?: Record<string, number>
  className?: string
}

export function IndiaMap({
  selectedStateName,
  onSelectState,
  stateAumMap = {},
  stateSubscribersMap = {},
  className = '',
}: Props) {
  const maxAum = useMemo(() => {
    const values = Object.values(stateAumMap).filter((v) => v > 0)
    return values.length ? Math.max(...values) : 1
  }, [stateAumMap])
  const maxSubscribers = useMemo(() => {
    const values = Object.values(stateSubscribersMap).filter((v) => v > 0)
    return values.length ? Math.max(...values) : 1
  }, [stateSubscribersMap])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox={mapData.viewBox}
        className="h-full w-full max-h-[70vh] w-auto"
        aria-label={mapData.label}
        style={{ overflow: 'visible' }}
      >
        {mapData.locations.map((loc) => {
          const isSelected = selectedStateName === loc.name
          const aum = stateAumMap[loc.name] ?? 0
          const subscribers = stateSubscribersMap[loc.name] ?? 0
          const aumIntensity = maxAum > 0 ? aum / maxAum : 0
          const subIntensity = maxSubscribers > 0 ? subscribers / maxSubscribers : 0
          const intensity = Math.max(0.15, aumIntensity || subIntensity * 0.7)
          const fillOpacity = isSelected ? 0.95 : 0.2 + intensity * 0.5
          const stroke = isSelected ? '#22d3ee' : 'rgba(148, 163, 184, 0.6)'
          const strokeWidth = isSelected ? 1.5 : 0.8
          const filter = isSelected ? 'url(#glow)' : undefined

          return (
            <path
              key={loc.id}
              id={loc.id}
              d={loc.path}
              fill={isSelected ? 'rgba(34, 211, 238, 0.35)' : `rgba(30, 41, 59, ${fillOpacity})`}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{ filter, cursor: 'pointer', transition: 'fill 0.2s, stroke 0.2s' }}
              onMouseEnter={(e) => {
                if (isSelected) return
                e.currentTarget.style.stroke = 'rgba(34, 211, 238, 0.9)'
                e.currentTarget.style.strokeWidth = '1.2'
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.stroke = 'rgba(148, 163, 184, 0.6)'
                  e.currentTarget.style.strokeWidth = '0.8'
                }
              }}
              onClick={() => onSelectState(loc.name)}
              aria-label={loc.name}
              role="button"
            />
          )
        })}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}
