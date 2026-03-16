import { NextResponse } from 'next/server'
import {
  getTotalAum,
  getFundManagerCount,
  getTopManagers,
  getTopStatesBySubscribers,
  getTopStatesByContribution,
} from '@/lib/ask-data'

async function callChat(system: string, user: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const apiKey = groqKey ?? openaiKey
  if (!apiKey) {
    throw new Error('No LLM API key configured')
  }

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
        {
          role: 'system',
          content:
            system +
            '\nAlways respond with a JSON array of 2-4 short strings, no markdown.',
        },
        { role: 'user', content: user },
      ],
      temperature: 0.35,
      max_tokens: 250,
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const message =
      errBody?.error?.message ?? `LLM request failed with ${res.status}`
    throw new Error(message)
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return json.choices?.[0]?.message?.content?.trim() ?? '[]'
}

export async function GET() {
  try {
    const hasGroq = !!process.env.GROQ_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    if (!hasGroq && !hasOpenAI) {
      return NextResponse.json({
        highlights: [],
        error:
          'Highlights are not configured. Add GROQ_API_KEY (recommended) or OPENAI_API_KEY to enable automatic summaries.',
      })
    }

    const [aum, fmCount, topManagers, topSubs, topContrib] = await Promise.all([
      getTotalAum(),
      getFundManagerCount(),
      getTopManagers(5),
      getTopStatesBySubscribers(5),
      getTopStatesByContribution(5),
    ])

    const payload = {
      totalAum: aum,
      fundManagers: fmCount,
      topManagers,
      topStatesBySubscribers: topSubs,
      topStatesByContribution: topContrib,
    }

    const system = `You write concise "insight" sentences for a pension dashboard.

Use ONLY the provided structured data. Do not invent new numbers.`

    const user = `Here is the latest dashboard data in JSON:
${JSON.stringify(payload, null, 2)}

Generate 2–4 short, punchy insight sentences that would be useful to show at the top of the dashboard for an internal pension analytics team. Each sentence should be self-contained, under 140 characters, and focus on something specific (e.g., "Top 3 states by SG contribution", "One manager dominating AUM share", or "State concentration in subscribers").

Return ONLY a JSON array of strings, no extra text or markdown.`

    const text = await callChat(system, user)
    let highlights: string[]
    try {
      highlights = JSON.parse(text) as string[]
    } catch {
      highlights = []
    }

    return NextResponse.json({ highlights })
  } catch (e) {
    console.error('[api/highlights]', e)
    return NextResponse.json(
      {
        highlights: [],
        error:
          'Unable to generate highlights right now. Try again later or use the main dashboard.',
      },
      { status: 200 }
    )
  }
}

