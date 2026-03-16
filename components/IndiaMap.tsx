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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number
): string {
  return `rgb(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(lerp(b1, b2, t))})`
}

function getHeatColor(t: number, mode: MapMode): string {
  const clamped = Math.max(0, Math.min(1, t))

  if (mode === 'aum') {
    // Dark navy → teal → bright cyan
    if (clamped < 0.5) {
      const s = clamped / 0.5
      return lerpColor(15, 23, 42, 8, 145, 178, s)
    }
    const s = (clamped - 0.5) / 0.5
    return lerpColor(8, 145, 178, 34, 211, 238, s)
  }

  if (mode === 'subscribers') {
    // Dark slate → indigo → violet
    if (clamped < 0.5) {
      const s = clamped / 0.5
      return lerpColor(15, 23, 42, 79, 70, 229, s)
    }
    const s = (clamped - 0.5) / 0.5
    return lerpColor(79, 70, 229, 167, 139, 250, s)
  }

  // Penetration: red → amber → emerald
  if (clamped < 0.4) {
    const s = clamped / 0.4
    return lerpColor(185, 28, 28, 217, 119, 6, s)
  }
  if (clamped < 0.7) {
    const s = (clamped - 0.4) / 0.3
    return lerpColor(217, 119, 6, 234, 179, 8, s)
  }
  const s = (clamped - 0.7) / 0.3
  return lerpColor(234, 179, 8, 22, 163, 74, s)
}

function computeScale(values: number[]): { min: number; max: number; p10: number; p90: number } {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (sorted.length === 0) return { min: 0, max: 1, p10: 0, p90: 1 }
  const p10Idx = Math.floor(sorted.length * 0.1)
  const p90Idx = Math.min(Math.floor(sorted.length * 0.9), sorted.length - 1)
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p10: sorted[p10Idx],
    p90: sorted[p90Idx],
  }
}

function normalize(value: number, scale: { p10: number; p90: number }): number {
  if (value <= 0) return 0
  const { p10, p90 } = scale
  const range = p90 - p10
  if (range <= 0) return value > 0 ? 0.5 : 0
  const t = (value - p10) / range
  return Math.max(0.05, Math.min(1, t))
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

  const aumScale = useMemo(
    () => computeScale(Object.values(stateAumMap)),
    [stateAumMap]
  )
  const subScale = useMemo(
    () => computeScale(Object.values(stateSubscribersMap)),
    [stateSubscribersMap]
  )
  const penScale = useMemo(
    () => computeScale(Object.values(statePenetrationMap)),
    [statePenetrationMap]
  )

  function getFill(loc: Location, isSelected: boolean): string {
    if (isSelected) return '#22d3ee'

    if (mapMode === 'aum') {
      const v = stateAumMap[loc.name] ?? 0
      return getHeatColor(normalize(v, aumScale), 'aum')
    }
    if (mapMode === 'subscribers') {
      const v = stateSubscribersMap[loc.name] ?? 0
      return getHeatColor(normalize(v, subScale), 'subscribers')
    }
    const v = statePenetrationMap[loc.name] ?? 0
    return getHeatColor(normalize(v, penScale), 'penetration')
  }

  function getTooltipValue(name: string): string {
    if (mapMode === 'aum') {
      const v = stateAumMap[name] ?? 0
      return v > 0 ? `AUM: Rs ${Math.round(v).toLocaleString('en-IN')} Cr` : 'AUM: No data'
    }
    if (mapMode === 'subscribers') {
      const v = stateSubscribersMap[name] ?? 0
      return v > 0 ? `Subscribers: ${v.toLocaleString('en-IN')}` : 'Subscribers: No data'
    }
    const pen = statePenetrationMap[name] ?? 0
    const subs = stateSubscribersMap[name] ?? 0
    return pen > 0
      ? `Penetration: ${pen.toFixed(2)}% (${subs.toLocaleString('en-IN')} subs)`
      : 'Penetration: No data'
  }

  const legendStops = useMemo(() => {
    const steps = 5
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps
      return getHeatColor(t, mapMode)
    })
  }, [mapMode])

  const legendLabels = useMemo(() => {
    const scale = mapMode === 'aum' ? aumScale : mapMode === 'subscribers' ? subScale : penScale
    if (mapMode === 'penetration') {
      return { low: `${scale.p10.toFixed(1)}%`, high: `${scale.p90.toFixed(1)}%` }
    }
    if (mapMode === 'aum') {
      const fmt = (v: number) => v >= 100000 ? `${(v / 100000).toFixed(0)}L Cr` : `${Math.round(v).toLocaleString('en-IN')} Cr`
      return { low: fmt(scale.p10), high: fmt(scale.p90) }
    }
    const fmt = (v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v))
    return { low: fmt(scale.p10), high: fmt(scale.p90) }
  }, [mapMode, aumScale, subScale, penScale])

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <svg
        viewBox={mapData.viewBox}
        className="h-full w-full max-h-[48vh] sm:max-h-[56vh] lg:max-h-[62vh]"
        aria-label={mapData.label}
        style={{ overflow: 'visible' }}
      >
        {mapData.locations.map((loc) => {
          const isSelected = selectedStateName === loc.name
          const isHovered = hovered === loc.name
          const fill = getFill(loc, isSelected)
          const stroke = isSelected
            ? '#22d3ee'
            : isHovered
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(100, 116, 139, 0.45)'
          const strokeWidth = isSelected ? 1.8 : isHovered ? 1.2 : 0.5

          return (
            <path
              key={loc.id}
              d={loc.path}
              fill={fill}
              fillOpacity={isSelected ? 0.5 : 0.85}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{
                filter: isSelected ? 'url(#glow)' : undefined,
                cursor: 'pointer',
                transition: 'fill 0.25s ease, fill-opacity 0.25s ease, stroke 0.15s ease',
              }}
              onMouseEnter={() => setHovered(loc.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectState(loc.name)}
              aria-label={loc.name}
              role="button"
            />
          )
        })}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Tooltip */}
      {hovered && !selectedStateName && (
        <div className="pointer-events-none rounded-lg border border-slate-600/80 bg-slate-800/95 px-3 py-1.5 text-xs shadow-xl backdrop-blur">
          <span className="font-medium text-white">{hovered}</span>
          <span className="ml-2 text-slate-300">{getTooltipValue(hovered)}</span>
        </div>
      )}

      {/* Gradient legend */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 sm:text-xs">
        <span>{legendLabels.low}</span>
        <div
          className="h-2.5 w-28 rounded-full sm:w-36"
          style={{
            background: `linear-gradient(to right, ${legendStops.join(', ')})`,
          }}
        />
        <span>{legendLabels.high}</span>
      </div>
    </div>
  )
}
