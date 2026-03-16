'use client'

import React, { useMemo, useState } from 'react'
import indiaMapData from '@svg-maps/india'

type Location = { id: string; name: string; path: string }
type MapData = { label: string; viewBox: string; locations: Location[] }

const mapData = indiaMapData as MapData

type MapMode = 'aum' | 'subscribers' | 'penetration'

type Props = {
  selectedStateName: string | null
  onSelectState: (stateName: string) => void
  stateAumMap?: Record<string, number>
  stateSubscribersMap?: Record<string, number>
  statePenetrationMap?: Record<string, number>
  mapMode?: MapMode
  className?: string
}

function getPenetrationColor(pct: number): string {
  if (pct <= 0) return 'rgba(30, 41, 59, 0.3)'
  if (pct < 1) return `rgba(239, 68, 68, ${0.25 + Math.min(pct, 1) * 0.35})`
  if (pct < 5) return `rgba(245, 158, 11, ${0.25 + Math.min((pct - 1) / 4, 1) * 0.4})`
  return `rgba(34, 197, 94, ${0.35 + Math.min((pct - 5) / 10, 1) * 0.45})`
}

export function IndiaMap({
  selectedStateName,
  onSelectState,
  stateAumMap = {},
  stateSubscribersMap = {},
  statePenetrationMap = {},
  mapMode = 'aum',
  className = '',
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const maxAum = useMemo(() => {
    const values = Object.values(stateAumMap).filter((v) => v > 0)
    return values.length ? Math.max(...values) : 1
  }, [stateAumMap])
  const maxSubscribers = useMemo(() => {
    const values = Object.values(stateSubscribersMap).filter((v) => v > 0)
    return values.length ? Math.max(...values) : 1
  }, [stateSubscribersMap])

  function getFill(loc: Location, isSelected: boolean): string {
    if (isSelected) return 'rgba(34, 211, 238, 0.35)'

    if (mapMode === 'penetration') {
      return getPenetrationColor(statePenetrationMap[loc.name] ?? 0)
    }

    const aum = stateAumMap[loc.name] ?? 0
    const subscribers = stateSubscribersMap[loc.name] ?? 0

    if (mapMode === 'subscribers') {
      const intensity = maxSubscribers > 0 ? subscribers / maxSubscribers : 0
      const opacity = 0.2 + Math.max(0.15, intensity) * 0.5
      return `rgba(30, 41, 59, ${opacity})`
    }

    const aumIntensity = maxAum > 0 ? aum / maxAum : 0
    const subIntensity = maxSubscribers > 0 ? subscribers / maxSubscribers : 0
    const intensity = Math.max(0.15, aumIntensity || subIntensity * 0.7)
    const opacity = 0.2 + intensity * 0.5
    return `rgba(30, 41, 59, ${opacity})`
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={mapData.viewBox}
        className="h-full w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[65vh]"
        aria-label={mapData.label}
        style={{ overflow: 'visible' }}
      >
        {mapData.locations.map((loc) => {
          const isSelected = selectedStateName === loc.name
          const stroke = isSelected ? '#22d3ee' : 'rgba(148, 163, 184, 0.6)'
          const strokeWidth = isSelected ? 1.5 : 0.8
          const filter = isSelected ? 'url(#glow)' : undefined

          return (
            <path
              key={loc.id}
              d={loc.path}
              fill={getFill(loc, isSelected)}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{ filter, cursor: 'pointer', transition: 'fill 0.2s, stroke 0.2s' }}
              onMouseEnter={(e) => {
                setHovered(loc.name)
                if (!isSelected) {
                  e.currentTarget.style.stroke = 'rgba(34, 211, 238, 0.9)'
                  e.currentTarget.style.strokeWidth = '1.2'
                }
              }}
              onMouseLeave={(e) => {
                setHovered(null)
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

      {/* Tooltip */}
      {hovered && (
        <div className="pointer-events-none mt-2 rounded-lg border border-slate-600 bg-slate-800 p-2 text-xs shadow-xl">
          <p className="font-semibold text-white">{hovered}</p>
          {mapMode === 'penetration' ? (
            <>
              <p className="text-slate-300">
                Penetration: <span className="text-cyan-400">{(statePenetrationMap[hovered] ?? 0).toFixed(2)}%</span>
              </p>
              <p className="text-slate-400">
                Subscribers: {(stateSubscribersMap[hovered] ?? 0).toLocaleString('en-IN')}
              </p>
            </>
          ) : mapMode === 'subscribers' ? (
            <p className="text-slate-300">
              Subscribers: <span className="text-cyan-400">{(stateSubscribersMap[hovered] ?? 0).toLocaleString('en-IN')}</span>
            </p>
          ) : (
            <p className="text-slate-300">
              AUM: <span className="text-cyan-400">{Math.round(stateAumMap[hovered] ?? 0).toLocaleString('en-IN')} Cr</span>
            </p>
          )}
        </div>
      )}

      {/* Legend for penetration mode */}
      {mapMode === 'penetration' && (
        <div className="mt-2 flex items-center gap-4 text-[10px] text-slate-400 sm:text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }} />
            Low (&lt;1%)
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(245, 158, 11, 0.5)' }} />
            Medium (1-5%)
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }} />
            High (&gt;5%)
          </div>
        </div>
      )}
    </div>
  )
}
