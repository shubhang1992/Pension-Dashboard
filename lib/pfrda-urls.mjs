/**
 * Public PFRDA document URLs (no API key). Used for automated sync.
 * Source: https://www.pfrda.org.in/web/pfrda/research-publications/statistics/statistical-data
 */
const BASE = 'https://www.pfrda.org.in/documents/33652'
const STATS_PAGE =
  'https://www.pfrda.org.in/web/pfrda/research-publications/statistics/statistical-data'

export const PFRDA_URLS = Object.freeze({
  /** Monthly: PF-wise and Scheme-wise AUM (fund manager leaderboard) */
  M1: `${BASE}/202496/M1_PF-wise%20and%20Scheme-wise%20Asset%20Under%20Management.xlsx?v=31.0`,
  /** Annual: State-wise Gender-wise enrollments under APY */
  A6: `${BASE}/202494/A6%20State-wise%20Gender-wise%20enrollments%20under%20APY.xlsx?v=25.0`,
  /** Annual: State-wise and Age-wise enrollments under NPS All Citizen */
  A22: `${BASE}/202494/A22%20State-wise%20and%20Age-wise%20enrollments%20under%20NPS%20All%20Citizen.xlsx?v=24.0`,
  /** Monthly: State-wise Subscribers and Contribution under SG Sector */
  M7: `${BASE}/202496/M7_State-wise%20Subscribers%20and%20Contribution%20under%20SG%20Sector.xlsx?v=30.0`,
})

const USER_AGENT = 'PensionDashboard/1.0 (Internal; data refresh)'
const STATS_PAGE =
  'https://www.pfrda.org.in/web/pfrda/research-publications/statistics/statistical-data'

/**
 * Scrape the PFRDA stats page for the latest download URLs.
 * Falls back to hardcoded PFRDA_URLS on any failure.
 */
export async function getLatestPfrdaUrls() {
  try {
    const res = await fetch(STATS_PAGE, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return PFRDA_URLS
    const html = await res.text()

    const pick = (code) => {
      const re = new RegExp(
        '/documents/[^"' + "'" + ']+' + code + '[^"' + "'" + ']+\\.xlsx[^"' + "'" + ']*',
        'i',
      )
      const m = html.match(re)
      return m
        ? 'https://www.pfrda.org.in' + m[0].replace(/ /g, '%20')
        : null
    }

    return {
      M1: pick('M1_') ?? PFRDA_URLS.M1,
      A6: pick('A6%20') ?? pick('A6 ') ?? PFRDA_URLS.A6,
      A22: pick('A22%20') ?? pick('A22 ') ?? PFRDA_URLS.A22,
      M7: pick('M7_') ?? PFRDA_URLS.M7,
    }
  } catch {
    return PFRDA_URLS
  }
}

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
export async function fetchPfrdaExcel(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error('PFRDA ' + res.status + ': ' + url)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

/**
 * Read the PFRDA statistical data page and discover latest download URLs.
 * Falls back to hard-coded URLs if parsing fails.
 * @returns {Promise<{ M1: string; A6: string; A22: string; M7: string }>}
 */
export async function getLatestPfrdaUrls() {
  try {
    const res = await fetch(STATS_PAGE, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) return PFRDA_URLS
    const html = await res.text()

    /** @param {string} code */
    const pick = (code) => {
      const regex = new RegExp(
        `/documents/33652/\\d+/${code}[^"']*\\.xlsx\\?v=[\\d.]+`,
        'i'
      )
      const m = html.match(regex)
      return m
        ? `https://www.pfrda.org.in${m[0].replace(/ /g, '%20')}`
        : null
    }

    return {
      M1: pick('M1_') ?? PFRDA_URLS.M1,
      A6: pick('A6%20') ?? PFRDA_URLS.A6,
      A22: pick('A22%20') ?? PFRDA_URLS.A22,
      M7: pick('M7_') ?? PFRDA_URLS.M7,
    }
  } catch {
    return PFRDA_URLS
  }
}
