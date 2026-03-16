import { NextResponse } from 'next/server'

const NEWS_QUERY =
  'latest news about National Pension System (NPS), Atal Pension Yojana (APY), and Indian pension market, India, last 7 days'

export async function GET() {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'News search is not configured. Add TAVILY_API_KEY to your environment to enable the Current news tab.',
        articles: [],
      },
      { status: 200 }
    )
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: NEWS_QUERY,
        max_results: 8,
        search_depth: 'basic',
        include_answer: false,
        include_images: true,
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch news from the search provider.',
          articles: [],
        },
        { status: 200 }
      )
    }

    const json = (await res.json()) as {
      results?: {
        title?: string
        url?: string
        content?: string
        published_date?: string
        source?: string
        image_url?: string
      }[]
    }

    const articles =
      json.results
        ?.map((r) => ({
          title: r.title ?? 'Untitled',
          url: r.url ?? '#',
          summary: r.content ?? '',
          publishedAt: r.published_date ?? null,
          source: r.source ?? null,
          imageUrl: r.image_url ?? null,
        }))
        .filter((a) => a.url !== '#') ?? []

    return NextResponse.json({ articles })
  } catch (e) {
    console.error('[api/news]', e)
    return NextResponse.json(
      {
        error:
          'Something went wrong while fetching news. Please try again later.',
        articles: [],
      },
      { status: 200 }
    )
  }
}

