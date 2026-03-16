import { NextResponse } from 'next/server'

const NEWS_QUERY =
  'latest news about National Pension System (NPS), Atal Pension Yojana (APY), and Indian pension market, India, last 7 days'
const GOOGLE_NEWS_RSS =
  'https://news.google.com/rss/search?q=%28NPS%20OR%20%22National%20Pension%20System%22%20OR%20APY%20OR%20PFRDA%20OR%20%22Indian%20pension%20market%22%29%20India&hl=en-IN&gl=IN&ceid=IN:en'

type Article = {
  title: string
  url: string
  summary: string
  publishedAt: string | null
  source: string | null
  imageUrl: string | null
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function stripHtml(text: string): string {
  return decodeXml(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchGoogleNewsFallback(): Promise<Article[]> {
  const res = await fetch(GOOGLE_NEWS_RSS, {
    headers: { 'User-Agent': 'PensionDashboard/1.0 (Internal; news fetch)' },
  })
  if (!res.ok) return []

  const xml = await res.text()
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8)

  return items
    .map((match) => {
      const item = match[1]
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? item.match(/<title>(.*?)<\/title>/)?.[1]
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]
      const description =
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
        ?? item.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? null
      const source =
        item.match(/<source[^>]*><!\[CDATA\[(.*?)\]\]><\/source>/)?.[1]
        ?? item.match(/<source[^>]*>(.*?)<\/source>/)?.[1]
        ?? null

      return {
        title: decodeXml(title ?? 'Untitled'),
        url: decodeXml(link ?? '#'),
        summary: stripHtml(description ?? ''),
        publishedAt: pubDate,
        source: source ? decodeXml(source) : null,
        imageUrl: null,
      }
    })
    .filter((article) => article.url !== '#')
}

export async function GET() {
  const apiKey = process.env.TAVILY_API_KEY
  try {
    if (apiKey) {
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

      if (res.ok) {
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

        if (articles.length > 0) {
          return NextResponse.json({ articles, provider: 'tavily' })
        }
      }
    }

    const rssArticles = await fetchGoogleNewsFallback()
    return NextResponse.json({
      articles: rssArticles,
      provider: 'google-rss',
      ...(apiKey
        ? { warning: 'Tavily returned no articles; using Google News RSS fallback.' }
        : { warning: 'TAVILY_API_KEY missing; using Google News RSS fallback.' }),
    })
  } catch (e) {
    console.error('[api/news]', e)
    const fallbackArticles = await fetchGoogleNewsFallback().catch(() => [])
    return NextResponse.json(
      {
        error: fallbackArticles.length
          ? null
          : 'Something went wrong while fetching news. Please try again later.',
        articles: fallbackArticles,
      },
      { status: 200 }
    )
  }
}
