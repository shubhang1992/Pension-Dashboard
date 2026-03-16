import { NextResponse } from 'next/server'
import {
  getTotalAum,
  getFundManagerCount,
  getStateData,
  getTopManagers,
  getTopStatesBySubscribers,
  getTopStatesByContribution,
  getReportInfo,
  getAllReportsSummary,
} from '@/lib/ask-data'

type Intent =
  | 'total_aum'
  | 'fund_manager_count'
  | 'state_data'
  | 'top_managers'
  | 'top_states_subscribers'
  | 'top_states_contribution'
  | 'report_info'
  | 'general'

type ParsedIntent = {
  intent: Intent
  stateName?: string
  reportId?: string
  /**
   * Whether the question clearly needs external / internet context
   * beyond what the dashboard data contains.
   */
  needsWeb?: boolean
}

const INTENT_PROMPT = `You are a classifier for a pension dashboard. The user asks questions about Indian pension data (NPS, APY, AUM, fund managers, state-wise data). PFRDA reports: M1 (AUM, schemes), A22 (subscribers, age), A6 (gender), M7 (SG contribution).

Return ONLY valid JSON with no markdown, in this exact shape:
{"intent":"<intent>","stateName":"<state name if relevant>","reportId":"<M1|A22|A6|M7 if asking about a report>","needsWeb":<true|false>}

intent must be one of: total_aum, fund_manager_count, state_data, top_managers, top_states_subscribers, top_states_contribution, report_info, general

- total_aum: questions about all-India total AUM, total assets, how much AUM
- fund_manager_count: how many fund managers, number of PFMs
- state_data: question about a specific state (subscribers, contribution, gender, AUM in that state). Include stateName.
- top_managers: who are top fund managers, leaderboard by AUM
- top_states_subscribers: which states have most subscribers
- top_states_contribution: which states have highest SG contribution
- report_info: what is M1/A22/A6/M7, what does the report contain. Include reportId (M1, A22, A6, or M7).
- general: anything else (overview, what data we have, etc.)

Set needsWeb to true ONLY when the user is clearly asking about things that are not in the dashboard data (for example: current government policy changes, future projections, news, comparisons with other countries, external benchmarks, explanations of concepts, etc.). For simple questions that can be answered just from the dashboard data, set needsWeb to false.`

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    const history: ChatHistoryItem[] = Array.isArray(body?.history)
      ? body.history.filter(
          (m: any) =>
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

    // Prefer GROQ_API_KEY if present (Groq free-tier LLMs), otherwise fall back to OPENAI_API_KEY.
    const hasGroq = !!process.env.GROQ_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    if (!hasGroq && !hasOpenAI) {
      return NextResponse.json({
        answer:
          'Natural language questions are not configured. Add GROQ_API_KEY (recommended) or OPENAI_API_KEY to your environment and restart the app. You can still explore the dashboard using the map, Analytics, and Reports pages.',
        data: null,
      })
    }

    const parsed = await parseIntent(question)
    const [data, web] = await Promise.all([
      fetchDataForIntent(parsed),
      maybeSearchWeb(question, parsed),
    ])
    const answer = await formatAnswer(question, parsed.intent, data, history, web)
    return NextResponse.json({ answer, data, webUsed: !!web })
  } catch (e: unknown) {
    console.error('[api/ask]', e)
    const anyErr = e as { status?: number; code?: string }
    // Graceful message when LLM quota is exceeded
    if (anyErr?.status === 429 || anyErr?.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          error:
            'Ask is temporarily unavailable because the model quota was exceeded. The rest of the dashboard still works — please try again later or use the map, Analytics, and Reports pages directly.',
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

async function callChat(system: string, user: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const apiKey = groqKey ?? openaiKey
  if (!apiKey) throw new Error('No LLM API key configured')

  // Groq keys start with gsk_ — use Groq endpoint if we have a Groq key (from either env)
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
      temperature: 0.2,
      max_tokens: 400,
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const error: any = new Error(errBody?.error?.message ?? `LLM request failed with ${res.status}`)
    ;(error.status = res.status), (error.code = errBody?.error?.code)
    throw error
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return json.choices?.[0]?.message?.content?.trim() ?? ''
}

async function parseIntent(question: string): Promise<ParsedIntent> {
  const text = await callChat(INTENT_PROMPT, question)
  let parsed: ParsedIntent
  try {
    const cleaned = text.replace(/^```json?\s*|\s*```$/g, '').trim()
    parsed = JSON.parse(cleaned) as ParsedIntent
  } catch {
    parsed = { intent: 'general' }
  }
  if (!parsed.intent || !['total_aum', 'fund_manager_count', 'state_data', 'top_managers', 'top_states_subscribers', 'top_states_contribution', 'report_info', 'general'].includes(parsed.intent)) {
    parsed.intent = 'general'
  }
  if (typeof parsed.needsWeb !== 'boolean') {
    parsed.needsWeb = false
  }

  const lowerQ = question.toLowerCase()
  if (
    lowerQ.includes('search the internet') ||
    lowerQ.includes('search online') ||
    lowerQ.includes('google this') ||
    lowerQ.includes('look this up') ||
    lowerQ.includes('from the internet') ||
    lowerQ.includes('from the web')
  ) {
    parsed.needsWeb = true
  }

  return parsed
}

async function maybeSearchWeb(question: string, parsed: ParsedIntent): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey || !parsed.needsWeb) {
    return null
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: question,
        max_results: 5,
        search_depth: 'basic',
        include_answer: true,
      }),
    })

    if (!res.ok) {
      return null
    }

    const json = (await res.json()) as {
      answer?: string
      results?: { content?: string }[]
    }

    if (json.answer && typeof json.answer === 'string') {
      return json.answer
    }

    if (Array.isArray(json.results) && json.results.length > 0) {
      const joined = json.results
        .map((r) => (typeof r.content === 'string' ? r.content : ''))
        .filter(Boolean)
        .join('\n\n')
      return joined || null
    }

    return null
  } catch {
    return null
  }
}

async function fetchDataForIntent(parsed: ParsedIntent): Promise<unknown> {
  switch (parsed.intent) {
    case 'total_aum':
      return getTotalAum()
    case 'fund_manager_count':
      return getFundManagerCount()
    case 'state_data':
      return getStateData(parsed.stateName ?? '')
    case 'top_managers':
      return getTopManagers(10)
    case 'top_states_subscribers':
      return getTopStatesBySubscribers(10)
    case 'top_states_contribution':
      return getTopStatesByContribution(10)
    case 'report_info':
      return getReportInfo(parsed.reportId ?? '')
    case 'general':
    default:
      return { reportsSummary: getAllReportsSummary() }
  }
}

async function formatAnswer(
  question: string,
  intent: Intent,
  data: unknown,
  history: ChatHistoryItem[],
  webContext: string | null
): Promise<string> {
  const dataStr = JSON.stringify(data, null, 2)
  const historyStr =
    history.length > 0
      ? history
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : ''

  const system = `You are a helpful assistant for an Indian pension dashboard.

PRIMARY SOURCE OF TRUTH:
- For all numeric values and concrete facts about the dashboard (AUM, subscribers, state-level metrics, etc.), you MUST rely ONLY on the structured dashboard data.

OPTIONAL INTERNET CONTEXT:
- You may receive a short "web context" text, summarizing relevant information from the public internet.
- Use this only to explain background concepts, recent policy/news context, or give qualitative colour.
- NEVER introduce or change any numeric values (amounts, counts, percentages, rankings) based on the web context.

Guidelines:
- Answer in 1–4 short sentences.
- Be precise with numbers and format Indian amounts with commas for lakhs/crores when possible.
- If the dashboard data is empty or says "found": false, clearly say that we do not have data for that.
- Do not mention JSON or phrases like "the data shows" — speak naturally to the user.
- For follow-up questions, interpret them in the context of the conversation history, but still ground every figure in the dashboard data.`

  const userParts: string[] = []
  if (historyStr) {
    userParts.push(`Conversation so far:\n${historyStr}`)
  }
  userParts.push(`Latest user question: ${question}`)
  userParts.push(
    `Structured dashboard data for this answer (use this as the only source for numbers and hard facts):\n${dataStr}`
  )
  if (webContext) {
    userParts.push(
      `Additional high-level web context (for background/explanations only, NOT for numbers):\n${webContext}`
    )
  }
  const user = userParts.join('\n\n')
  const text = await callChat(system, user)
  return text || 'I couldn’t generate an answer from the data.'
}
