/**
 * Public PFRDA document URLs (no API key). Used for automated sync.
 * Source: https://www.pfrda.org.in/web/pfrda/research-publications/statistics/statistical-data
 */
const BASE = 'https://www.pfrda.org.in/documents/33652'

export const PFRDA_URLS = {
  /** Monthly: PF-wise and Scheme-wise AUM (fund manager leaderboard) */
  M1: `${BASE}/202496/M1_PF-wise%20and%20Scheme-wise%20Asset%20Under%20Management.xlsx?v=15.0`,
  /** Annual: State-wise Gender-wise enrollments under APY */
  A6: `${BASE}/202494/A6%20State-wise%20Gender-wise%20enrollments%20under%20APY.xlsx?v=9.0`,
  /** Annual: State-wise and Age-wise enrollments under NPS All Citizen */
  A22: `${BASE}/202494/A22%20State-wise%20and%20Age-wise%20enrollments%20under%20NPS%20All%20Citizen.xlsx?v=8.0`,
  /** Monthly: State-wise Subscribers and Contribution under SG Sector */
  M7: `${BASE}/202496/M7_State-wise%20Subscribers%20and%20Contribution%20under%20SG%20Sector.xlsx?v=15.0`,
}

const USER_AGENT = 'PensionDashboard/1.0 (Internal; data refresh)'

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
export async function fetchPfrdaExcel(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`PFRDA ${res.status}: ${url}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}
