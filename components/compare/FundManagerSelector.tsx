'use client'

import React, { useEffect, useState, useRef } from 'react'

type Props = {
  selected: string[]
  onChange: (names: string[]) => void
}

export function FundManagerSelector({ selected, onChange }: Props) {
  const [allNames, setAllNames] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/fund-managers/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        const names = (d.leaderboard ?? []).map((m: { name: string }) => m.name)
        setAllNames(names)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = allNames.filter(
    (n) =>
      !selected.includes(n) &&
      n.toLowerCase().includes(query.toLowerCase())
  )

  function add(name: string) {
    if (selected.length >= 3) return
    onChange([...selected, name])
    setQuery('')
    setOpen(false)
  }

  function remove(name: string) {
    onChange(selected.filter((n) => n !== name))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-medium text-cyan-400"
          >
            {name}
            <button
              type="button"
              onClick={() => remove(name)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-cyan-500/30"
              aria-label={`Remove ${name}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {selected.length < 3 && (
        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              selected.length === 0
                ? 'Search fund managers...'
                : `Add ${3 - selected.length} more...`
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
              {filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => add(name)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Select {selected.length < 2 ? `at least ${2 - selected.length} more` : 'up to 3'} fund managers to compare
      </p>
    </div>
  )
}
