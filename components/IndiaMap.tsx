'use client'

import React, { useMemo, useState, useCallback } from 'react'
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

// ─── Color math ───

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function multiStop(
  stops: [number, number, number][],
  t: number
): string {
  const c = Math.max(0, Math.min(1, t))
  const segment = 1 / (stops.length - 1)
  const idx = Math.min(Math.floor(c / segment), stops.length - 2)
  const local = (c - idx * segment) / segment
  const [r1, g1, b1] = stops[idx]
  const [r2, g2, b2] = stops[idx + 1]
  return rgb(lerp(r1, r2, local), lerp(g1, g2, local), lerp(b1, b2, local))
}

const PALETTES: Record<MapMode, [number, number, number][]> = {
  aum: [
    [15, 23, 42],      // slate-950
    [14, 65, 82],      // dark teal
    [8, 145, 178],     // cyan-600
    [34, 211, 238],    // cyan-400
    [165, 243, 252],   // cyan-200
  ],
  subscribers: [
    [15, 23, 42],      // slate-950
    [49, 27, 96],      // deep purple
    [109, 40, 217],    // violet-600
    [167, 139, 250],   // violet-400
    [221, 214, 254],   // violet-200
  ],
  penetration: [
    [153, 27, 27],     // deep red
    [220, 80, 30],     // orange-red
    [234, 179, 8],     // yellow-500
    [74, 222, 128],    // green-400
    [22, 163, 74],     // green-600
  ],
}

// ─── Data normalization ───

function buildScale(values: number[]) {
  const pos = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (pos.length === 0) return { min: 0, max: 1, p5: 0, p95: 1 }
  return {
    min: pos[0],
    max: pos[pos.length - 1],
    p5: pos[Math.floor(pos.length * 0.05)],
    p95: pos[Math.min(Math.floor(pos.length * 0.95), pos.length - 1)],
  }
}

function normalizeValue(v: number, scale: { p5: number; p95: number }): number {
  if (v <= 0) return 0
  const range = scale.p95 - scale.p5
  if (range <= 0) return v > 0 ? 0.5 : 0
  return Math.max(0.05, Math.min(1, (v - scale.p5) / range))
}

// ─── Legend helpers ───

function formatLegendValue(v: number, mode: MapMode): string {
  if (mode === 'penetration') return `${v.toFixed(1)}%`
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
  return String(Math.round(v))
}

// ─── Component ───

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

  const aumScale = useMemo(() => buildScale(Object.values(stateAumMap)), [stateAumMap])
  const subScale = useMemo(() => buildScale(Object.values(stateSubscribersMap)), [stateSubscribersMap])
  const penScale = useMemo(() => buildScale(Object.values(statePenetrationMap)), [statePenetrationMap])

  const activeScale = mapMode === 'aum' ? aumScale : mapMode === 'subscribers' ? subScale : penScale

  const getDataMap = useCallback(
    (name: string) => {
      if (mapMode === 'aum') return stateAumMap[name] ?? 0
      if (mapMode === 'subscribers') return stateSubscribersMap[name] ?? 0
      return statePenetrationMap[name] ?? 0
    },
    [mapMode, stateAumMap, stateSubscribersMap, statePenetrationMap]
  )

  const getFill = useCallback(
    (name: string, isSelected: boolean) => {
      if (isSelected) return '#22d3ee'
      const v = getDataMap(name)
      const t = normalizeValue(v, activeScale)
      return multiStop(PALETTES[mapMode], t)
    },
    [getDataMap, activeScale, mapMode]
  )

  const tooltipText = useCallback(
    (name: string) => {
      const v = getDataMap(name)
      if (v <= 0) return 'No data'
      if (mapMode === 'aum') return `Rs ${Math.round(v).toLocaleString('en-IN')} Cr`
      if (mapMode === 'subscribers') return v.toLocaleString('en-IN')
      return `${v.toFixed(2)}%`
    },
    [getDataMap, mapMode]
  )

  const legendStops = useMemo(
    () => Array.from({ length: 32 }, (_, i) => multiStop(PALETTES[mapMode], i / 31)),
    [mapMode]
  )

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            mapMode === 'aum'
              ? 'radial-gradient(ellipse 50% 50% at 42% 48%, rgba(8,145,178,0.08) 0%, transparent 70%)'
              : mapMode === 'subscribers'
                ? 'radial-gradient(ellipse 50% 50% at 42% 48%, rgba(109,40,217,0.08) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 50% 50% at 42% 48%, rgba(234,179,8,0.06) 0%, transparent 70%)',
        }}
      />

      <svg
        viewBox={mapData.viewBox}
        className="relative h-full w-full max-h-[50vh] sm:max-h-[58vh] lg:max-h-[64vh]"
        aria-label={mapData.label}
        style={{ overflow: 'visible' }}
      >
        {mapData.locations.map((loc) => {
          const isSelected = selectedStateName === loc.name
          const isHov = hovered === loc.name
          const fill = getFill(loc.name, isSelected)
          return (
            <path
              key={loc.id}
              d={loc.path}
              fill={fill}
              fillOpacity={isSelected ? 0.55 : 0.88}
              stroke={
                isSelected
                  ? '#67e8f9'
                  : isHov
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(71,85,105,0.35)'
              }
              strokeWidth={isSelected ? 1.6 : isHov ? 0.9 : 0.35}
              strokeLinejoin="round"
              style={{
                filter: isSelected ? 'url(#sel-glow)' : isHov ? 'url(#hov-glow)' : undefined,
                cursor: 'pointer',
                transition: 'fill .2s ease, stroke .15s ease, stroke-width .15s ease, fill-opacity .2s ease',
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
          <filter id="sel-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="hov-glow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="0.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      </svg>

      {/* Tooltip */}
      {hovered && !selectedStateName && (
        <div className="pointer-events-none absolute bottom-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-600/60 bg-slate-800/95 px-3 py-1.5 text-xs shadow-2xl backdrop-blur-sm sm:bottom-14">
          <span className="font-semibold text-white">{hovered}</span>
          <span className="ml-2 text-cyan-300">{tooltipText(hovered)}</span>
        </div>
      )}

      {/* Gradient legend bar */}
      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 sm:mt-2 sm:text-[11px]">
        <span className="tabular-nums">{formatLegendValue(activeScale.p5, mapMode)}</span>
        <div
          className="h-[6px] w-32 rounded-full sm:h-2 sm:w-40"
          style={{
            background: `linear-gradient(to right, ${legendStops.join(',')})`,
          }}
        />
        <span className="tabular-nums">{formatLegendValue(activeScale.p95, mapMode)}</span>
      </div>
    </div>
  )
}
