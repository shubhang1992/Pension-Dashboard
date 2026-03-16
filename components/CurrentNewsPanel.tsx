'use client'

import React, { useEffect, useState } from 'react'

type Article = {
  title: string
  url: string
  summary: string
  publishedAt: string | null
  source?: string | null
}

export function CurrentNewsPanel() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/news')
        const json = await res.json()
        if (!res.ok) {
          if (!cancelled) {
            setError(json.error ?? 'Failed to load news.')
          }
          return
        }
        if (!cancelled) {
          setArticles(json.articles ?? [])
          if (json.error) {
            setError(json.error)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Failed to load news.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Fetching latest pension news…
      </div>
    )
  }

  const getDomain = (url: string) => {
    try {
      const u = new URL(url)
      return u.hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      {articles.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          No recent news articles found for the Indian pension market.
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {articles.map((a, idx) => (
            <article
              key={idx}
              className="group rounded-2xl border border-slate-800/60 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40 px-3 py-2.5 shadow-sm transition hover:border-cyan-600/60 hover:from-slate-900 hover:via-slate-900/80 hover:to-slate-900/60"
            >
              <div className="flex gap-3">
                <div className="hidden h-16 w-16 flex-none overflow-hidden rounded-full bg-slate-800/80 sm:flex items-center justify-center">
                  {getDomain(a.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(
                        getDomain(a.url) as string
                      )}`}
                      alt=""
                      className="h-9 w-9 rounded-full bg-slate-900 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      News
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 text-sm font-semibold text-slate-100 hover:text-cyan-200 hover:underline"
                  >
                    {a.title}
                  </a>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-500">
                    {a.publishedAt && (
                      <span>
                        {new Date(a.publishedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {getDomain(a.url) && (
                      <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
                        {getDomain(a.url)}
                      </span>
                    )}
                  </div>
                  {a.summary && (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-300/90">
                      {a.summary}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

