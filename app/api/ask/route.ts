import { NextResponse } from 'next/server'
import { getComprehensiveSummary } from '@/lib/ask-data'

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string }

const WEB_TRIGGER_PHRASES = [
  'search the internet',
  'search online',
  'google this',
  'look this up',
  'from the internet',
  'from the web',
  'latest news',
  'recent news',
  'current news',
  'government policy',
  'budget 2025',
  'budget 2026',
  'compare with other countries',
]

function needsWebSearch(question: string): boolean {
  const lower = question.toLowerCase()
  return WEB_TRIGGER_PHRASES.some((p) => lower.includes(p))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    const history: ChatHistoryItem[] = Array.isArray(body?.history)
      ? body.history.filter(
          (m: { role?: string; content?: string }) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0
        )
      : []
    if (!question) {
      return NextResponse.json(
        { error: 'Missing question', answer: null },
        { status: 400 }
      )
    }

    const hasGroq = !!process.env.GROQ_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    if (!hasGroq && !hasOpenAI) {
      return NextResponse.json({
        answer:
          'Natural language questions are not configured. Add GROQ_API_KEY (recommended) or OPENAI_API_KEY to your environment and restart the app. You can still explore the dashboard using the map, Analytics, and Reports pages.',
        data: null,
      })
    }

    const [summary, web] = await Promise.all([
      getComprehensiveSummary(),
      maybeSearchWeb(question),
    ])

    const answer = await formatAnswer(question, summary, history, web)
    return NextResponse.json({ answer, data: summary, webUsed: !!web })
  } catch (e: unknown) {
    console.error('[api/ask]', e)
    const anyErr = e as { status?: number; code?: string }
    if (anyErr?.status === 429 || anyErr?.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          error:
            'Ask is temporarily unavailable because the model quota was exceeded. The rest of the dashboard still works -- please try again later or use the map, Analytics, and Reports pages directly.',
          answer: null,
          data: null,
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      {
        error:
          'Something went wrong while answering. Please try rephrasing or use the dashboard directly.',
        answer: null,
        data: null,
      },
      { status: 500 }
    )
  }
}

async function callChat(
  system: string,
  user: string,
  maxTokens = 600
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const apiKey = groqKey ?? openaiKey
  if (!apiKey) throw new Error('No LLM API key configured')

  const useGroq = !!groqKey || apiKey.startsWith('gsk_')
  const baseUrl = useGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const model = useGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini'

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const error: Record<string, unknown> = new Error(
      errBody?.error?.message ?? `LLM request failed with ${res.status}`
    ) as unknown as Record<string, unknown>
    error.status = res.status
    error.code = errBody?.error?.code
    throw error
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return json.choices?.[0]?.message?.content?.trim() ?? ''
}

async function maybeSearchWeb(question: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey || !needsWebSearch(question)) {
    return null
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: question,
        max_results: 5,
        search_depth: 'basic',
        include_answer: true,
      }),
    })

    if (!res.ok) return null

    const json = (await res.json()) as {
      answer?: string
      results?: { content?: string }[]
    }

    if (json.answer && typeof json.answer === 'string') {
      return json.answer
    }

    if (Array.isArray(json.results) && json.results.length > 0) {
      return (
        json.results
          .map((r) => (typeof r.content === 'string' ? r.content : ''))
          .filter(Boolean)
          .join('\n\n') || null
      )
    }

    return null
  } catch {
    return null
  }
}

const SYSTEM_PROMPT = `You are an expert analyst for an Indian pension dashboard powered by PFRDA data. You have access to the COMPLETE dashboard dataset provided below. Use it to answer any question the user asks.

CAPABILITIES - you CAN and SHOULD:
- Compute derived metrics: averages, percentages, ratios, growth rates, comparisons, rankings.
- Highlight interesting patterns, anomalies, or notable facts when relevant.
- Compare states, fund managers, schemes, or time periods against each other.
- Answer questions like "average contribution per state", "which fund manager dominates", "female participation rate", "AUM growth trend", etc.

FORMATTING:
- Use Indian number formatting with lakhs (L) and crores (Cr) with commas (e.g. Rs 1,23,456 Cr).
- Answer in 2-6 concise sentences. Use bullet points for comparisons or lists of more than 3 items.
- Bold key numbers or names using **markdown bold** for emphasis.

RULES:
- For all numeric values, rely ONLY on the structured dashboard data - never invent numbers.
- If the data genuinely does not contain information to answer, say so clearly and suggest what the user can ask instead.
- If web context is provided, use it only for background explanations or qualitative colour - never override dashboard numbers with web-sourced figures.
- Do not mention "JSON", "the data object", or "structured data" - speak naturally.
- For follow-up questions, use conversation history for context but always ground figures in the data.`

async function formatAnswer(
  question: string,
  summary: unknown,
  history: ChatHistoryItem[],
  webContext: string | null
): Promise<string> {
  const dataStr = JSON.stringify(summary, null, 2)
  const historyStr =
    history.length > 0
      ? history
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : ''

  const userParts: string[] = []
  if (historyStr) {
    userParts.push(`Conversation so far:\n${historyStr}`)
  }
  userParts.push(`Latest user question: ${question}`)
  userParts.push(
    `Complete dashboard dataset (use as the sole source for all numbers and facts):\n${dataStr}`
  )
  if (webContext) {
    userParts.push(
      `Additional web context (for background/explanations only, NOT for numbers):\n${webContext}`
    )
  }

  const text = await callChat(SYSTEM_PROMPT, userParts.join('\n\n'))
  return text || "I couldn't generate an answer from the data."
}
