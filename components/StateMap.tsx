'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { getStateGeoJsonUrl, hasStateGeoJson } from '@/lib/state-geojson-slug'

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry>
type GeoFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 500

type Props = {
  stateName: string
  className?: string
}

export function StateMap({ stateName, className = '' }: Props) {
  const [geoJson, setGeoJson] = useState<GeoFeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!hasStateGeoJson(stateName)) {
      setLoading(false)
      setError(true)
      return
    }
    const url = getStateGeoJsonUrl(stateName)
    if (!url) {
      setLoading(false)
      setError(true)
      return
    }
    setLoading(true)
    setError(false)
    fetch(url)
      .then((r) => r.json())
      .then((data: GeoFeatureCollection) => {
        setGeoJson(data)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [stateName])

  const { paths, viewBox } = useMemo(() => {
    if (!geoJson || !geoJson.features?.length)
      return { paths: [] as { d: string; district: string }[], viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}` }

    const projection = geoMercator().fitSize([VIEW_WIDTH, VIEW_HEIGHT], geoJson)
    const pathGenerator = geoPath().projection(projection)

    const paths = geoJson.features.map((feature: GeoFeature) => {
      const d = pathGenerator(feature)
      const district = (feature.properties as { district?: string })?.district ?? ''
      return { d: d ?? '', district }
    }).filter((p) => p.d)

    return { paths, viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}` }
  }, [geoJson])

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="text-slate-400 text-sm">Loading state map…</div>
      </div>
    )
  }

  if (error || !paths.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="text-slate-500 text-sm">Map not available for this state</div>
      </div>
    )
  }

  const STAGGER_MS = 14
  const STAGGER_CAP_MS = 140
  const REVEAL_DURATION_MS = 280

  return (
    <>
      <style>{`
        @keyframes state-district-reveal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <svg
        viewBox={viewBox}
        className={`max-h-[50vh] max-w-[90%] sm:max-h-[55vh] ${className}`}
        style={{ overflow: 'visible' }}
        aria-label={`Map of ${stateName}`}
      >
        <g>
          {paths.map(({ d, district }, i) => {
            const delayMs = Math.min(i * STAGGER_MS, STAGGER_CAP_MS)
            return (
              <path
                key={i}
                d={d}
                fill="rgba(30, 41, 59, 0.5)"
                stroke="rgba(148, 163, 184, 0.6)"
                strokeWidth={0.6}
                style={{
                  opacity: 0,
                  animation: `state-district-reveal ${REVEAL_DURATION_MS}ms cubic-bezier(0.33, 1, 0.68, 1) ${delayMs}ms both`,
                }}
                aria-label={district || undefined}
              />
            )
          })}
        </g>
      </svg>
    </>
  )
}
