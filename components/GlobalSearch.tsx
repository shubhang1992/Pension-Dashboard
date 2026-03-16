'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type SearchResults = {
  fundManagers: { name: string; aumCrore: number; state: string | null }[]
  states: { stateName: string; subscribers: number | null; aumCrore: number | null }[]
  schemes: { name: string; category: string | null; aumCrore: number | null; managerName: string }[]
}

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setExpanded(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (!query) setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [query])

  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results)
        setOpen(true)
      })
      .catch(() => setResults(null))
      .finally(() => setLoading(false))
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function navigate(href: string) {
    setOpen(false)
    setQuery('')
    setExpanded(false)
    router.push(href)
  }

  const hasResults =
    results &&
    (results.fundManagers.length > 0 ||
      results.states.length > 0 ||
      results.schemes.length > 0)

  return (
    <div ref={wrapperRef} className="relative">
      {/* Mobile: icon only; Desktop: full input */}
      <button
        type="button"
        onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white sm:hidden ${expanded ? 'hidden' : ''}`}
        aria-label="Search"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <div className={`${expanded ? 'block' : 'hidden'} sm:block`}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => { if (results) setOpen(true) }}
            placeholder="Search states, fund managers, schemes..."
            className="h-10 w-full min-w-[200px] rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-16 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 sm:w-72 lg:w-80"
          />
          {!query && (
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-block">
              Ctrl+K
            </span>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute left-0 right-0 z-50 mt-1 min-w-[320px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl sm:min-w-[384px]">
          {loading && (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-700/50" />
              ))}
            </div>
          )}

          {!loading && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}

          {!loading && hasResults && (
            <div className="max-h-96 overflow-y-auto">
              {results!.states.length > 0 && (
                <>
                  <div className="sticky top-0 bg-slate-800/90 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                    States
                  </div>
                  {results!.states.map((s) => (
                    <button
                      key={s.stateName}
                      type="button"
                      onClick={() => navigate(`/?state=${encodeURIComponent(s.stateName)}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                    >
                      <span className="flex-1 truncate">{s.stateName}</span>
                      {s.subscribers != null && s.subscribers > 0 && (
                        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400">
                          {s.subscribers.toLocaleString('en-IN')} subs
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {results!.fundManagers.length > 0 && (
                <>
                  <div className="sticky top-0 bg-slate-800/90 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                    Fund Managers
                  </div>
                  {results!.fundManagers.map((fm) => (
                    <button
                      key={fm.name}
                      type="button"
                      onClick={() => navigate('/fund-managers')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                    >
                      <span className="flex-1 truncate">{fm.name}</span>
                      {fm.aumCrore > 0 && (
                        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400">
                          {Math.round(fm.aumCrore).toLocaleString('en-IN')} Cr
                        </span>
                      )}
                      {fm.state && (
                        <span className="text-xs text-slate-500">{fm.state}</span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {results!.schemes.length > 0 && (
                <>
                  <div className="sticky top-0 bg-slate-800/90 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                    Schemes
                  </div>
                  {results!.schemes.map((s) => (
                    <button
                      key={`${s.name}-${s.managerName}`}
                      type="button"
                      onClick={() => navigate('/fund-managers')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/50 hover:text-white"
                    >
                      <span className="flex-1 truncate">{s.name}</span>
                      {s.category && (
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                          {s.category}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 truncate max-w-[100px]">{s.managerName}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
