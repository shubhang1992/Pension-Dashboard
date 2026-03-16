'use client'

import React, { useState, useRef, useEffect } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function InlineAskInput() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [webUsedLastAnswer, setWebUsedLastAnswer] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const quickPrompts = [
    'Explain this dashboard in simple terms.',
    'Which states lead and lag on SG contribution?',
    'Who are the top fund managers by AUM right now?',
    'How has total AUM changed recently?',
  ]

  function handleQuickPrompt(p: string) {
    if (loading) return
    setQuestion(p)
    // Small delay so state updates before submit
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
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: nextMessages }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Request failed')
        return
      }
      const answer = json.answer ?? 'No answer returned.'
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
      setWebUsedLastAnswer(!!json.webUsed)
      // Clear the input after a successful send so the user can type a new message.
      setQuestion('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-700/50 pt-3">
      <div className="mb-2 max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-cyan-500/20 text-cyan-100'
                  : 'bg-slate-800/80 text-slate-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        id="dashboard-ask-form"
        onSubmit={handleSubmit}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <label htmlFor="dashboard-ask-input" className="sr-only">
            Ask about the data
          </label>
          <input
            ref={inputRef}
            id="dashboard-ask-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the data…"
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex-shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600 disabled:opacity-50"
          >
            {loading ? '…' : 'Ask'}
          </button>
        </div>
      </form>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleQuickPrompt(p)}
            className="rounded-full border border-slate-600/60 bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-200 transition hover:border-cyan-500/60 hover:bg-slate-800"
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      {!error && webUsedLastAnswer && messages.length > 0 && (
        <p className="mt-1 text-[10px] text-slate-500">
          Used internet search for additional background in the last answer.
        </p>
      )}
    </div>
  )
}
