'use client'

import React, { useEffect, useState } from 'react'

export function OverviewHighlights() {
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/highlights')
        const json = await res.json()
        if (!cancelled && res.ok) {
          setItems(Array.isArray(json.highlights) ? json.highlights.slice(0, 3) : [])
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400/60" />
        Generating insights…
      </span>
    )
  }

  if (!items.length) return null

  return (
    <span className="inline text-[11px] leading-relaxed text-slate-400">
      {items.map((text, idx) => (
        <React.Fragment key={idx}>
          <span className="inline-flex h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-cyan-400/70" style={{ margin: '0 5px' }} />
          <span className="text-slate-300">{text}</span>
        </React.Fragment>
      ))}
    </span>
  )
}
