'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { SUGGESTED_QUESTIONS, type SuggestedQuestion } from '@/lib/suggested-questions'
import type { ChatMessage, ChartData } from '@/lib/chat-types'
import { ChatChart } from '@/components/chat/ChatChart'

function pickSuggestions(askedIds: Set<string>, count = 6): SuggestedQuestion[] {
  const available = SUGGESTED_QUESTIONS.filter((q) => !askedIds.has(q.id))
  const pool = available.length > 0 ? available : SUGGESTED_QUESTIONS

  const byCategory = new Map<string, SuggestedQuestion[]>()
  for (const q of pool) {
    const list = byCategory.get(q.category) ?? []
    list.push(q)
    byCategory.set(q.category, list)
  }

  const picked: SuggestedQuestion[] = []
  const catCount = new Map<string, number>()

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  for (const q of shuffled) {
    if (picked.length >= count) break
    const cc = catCount.get(q.category) ?? 0
    if (cc >= 2) continue
    picked.push(q)
    catCount.set(q.category, cc + 1)
  }

  while (picked.length < count && picked.length < pool.length) {
    const remaining = pool.filter((q) => !picked.includes(q))
    if (remaining.length === 0) break
    picked.push(remaining[Math.floor(Math.random() * remaining.length)])
  }

  return picked
}

export function InlineAskInput() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [webUsedLastAnswer, setWebUsedLastAnswer] = useState(false)
  const [askedIds, setAskedIds] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSuggestions(pickSuggestions(askedIds))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const refreshSuggestions = useCallback((newAskedIds: Set<string>) => {
    setSuggestions(pickSuggestions(newAskedIds))
  }, [])

  function handleQuickPrompt(sq: SuggestedQuestion) {
    if (loading) return
    const nextAsked = new Set(askedIds)
    nextAsked.add(sq.id)
    setAskedIds(nextAsked)
    setQuestion(sq.prompt)
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true, cancelable: true })
      const form = document.getElementById('dashboard-ask-form')
      form?.dispatchEvent(event)
    }, 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: q }]
    setMessages(nextMessages)
    try {
      const historyForApi = nextMessages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: historyForApi }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Request failed')
        return
      }
      const answer: string = json.answer ?? 'No answer returned.'
      const chart: ChartData | null = json.chart ?? null
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, chart }])
      setWebUsedLastAnswer(!!json.webUsed)
      setQuestion('')
      refreshSuggestions(askedIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 pt-2 sm:pt-3">
      <div className="mb-2 max-h-48 space-y-2 overflow-y-auto pr-1 sm:max-h-64">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] sm:max-w-[80%] ${m.role === 'user' ? '' : 'w-full'}`}>
              <div
                className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'bg-slate-800/80 text-slate-100'
                }`}
              >
                {m.content}
              </div>
              {m.chart && <ChatChart chart={m.chart} />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        id="dashboard-ask-form"
        onSubmit={handleSubmit}
        className="space-y-1.5 sm:space-y-2"
      >
        <div className="flex gap-1.5 sm:gap-2">
          <label htmlFor="dashboard-ask-input" className="sr-only">
            Ask about the data
          </label>
          <input
            ref={inputRef}
            id="dashboard-ask-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the data\u2026"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 sm:px-3 sm:py-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex-shrink-0 rounded-lg bg-slate-700 px-2.5 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-600 disabled:opacity-50 sm:px-3 sm:py-2"
          >
            {loading ? '\u2026' : 'Ask'}
          </button>
        </div>
      </form>

      {/* Dynamic suggestion chips */}
      <div className="scrollbar-hide mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
        {suggestions.map((sq) => (
          <button
            key={sq.id}
            type="button"
            onClick={() => handleQuickPrompt(sq)}
            className="flex-shrink-0 rounded-full border border-slate-600/50 bg-slate-700/60 px-3 py-1.5 text-[10px] text-slate-300 transition-colors hover:border-cyan-500/50 hover:bg-slate-700 sm:text-xs"
            disabled={loading}
          >
            {sq.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {!error && webUsedLastAnswer && messages.length > 0 && (
        <p className="mt-1 text-[10px] text-slate-500">
          Used internet search for additional background in the last answer.
        </p>
      )}
    </div>
  )
}
