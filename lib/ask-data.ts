import { prisma } from '@/lib/prisma'
import { normalizeStateNameForDb } from '@/lib/state-name-map'

/** Data fetchers for the Ask feature — used by /api/ask to ground answers in real data. */

export async function getTotalAum(): Promise<{ totalAumCrore: number; asOfDate: string | null }> {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) return { totalAumCrore: 0, asOfDate: null }
  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { aumCrore: true },
  })
  let totalAumCrore = 0
  for (const r of rows) totalAumCrore += r.aumCrore ?? 0
  return {
    totalAumCrore,
    asOfDate: latest.asOfDate.toISOString().slice(0, 10),
  }
}

export async function getFundManagerCount(): Promise<{ count: number; asOfDate: string | null }> {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) return { count: 0, asOfDate: null }
  const rows: { fundManagerName: string }[] = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { fundManagerName: true },
  })
  const names = new Set<string>()
  for (const r of rows) names.add(r.fundManagerName)
  return {
    count: names.size,
    asOfDate: latest.asOfDate.toISOString().slice(0, 10),
  }
}

export async function getStateData(stateName: string): Promise<{
  stateName: string
  subscribers: number
  contributionCrore: number | null
  aumCrore: number
  asOfDate: string | null
  genderFemale: number | null
  genderMale: number | null
  genderTransgender: number | null
  found: boolean
}> {
  const stateDb = normalizeStateNameForDb(stateName)
  const snapshot = await prisma.stateWiseSnapshot.findFirst({
    where: { stateName: { equals: stateDb, mode: 'insensitive' } },
    orderBy: { asOfDate: 'desc' },
  })
  if (!snapshot) {
    return {
      stateName: stateName,
      subscribers: 0,
      contributionCrore: null,
      aumCrore: 0,
      asOfDate: null,
      genderFemale: null,
      genderMale: null,
      genderTransgender: null,
      found: false,
    }
  }
  return {
    stateName: snapshot.stateName,
    subscribers: snapshot.subscribers ?? 0,
    contributionCrore: snapshot.contributionCrore ?? null,
    aumCrore: snapshot.aumCrore ?? 0,
    asOfDate: snapshot.asOfDate.toISOString().slice(0, 10),
    genderFemale: snapshot.genderFemale ?? null,
    genderMale: snapshot.genderMale ?? null,
    genderTransgender: snapshot.genderTransgender ?? null,
    found: true,
  }
}

export async function getTopManagers(limit = 10): Promise<{
  leaderboard: { rank: number; name: string; aumCrore: number; sharePct: number }[]
  asOfDate: string | null
  totalAumCrore: number
}> {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) {
    return { leaderboard: [], asOfDate: null, totalAumCrore: 0 }
  }
  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { fundManagerName: true, aumCrore: true },
  })
  const byManager = new Map<string, number>()
  for (const r of rows) {
    byManager.set(
      r.fundManagerName,
      (byManager.get(r.fundManagerName) ?? 0) + (r.aumCrore ?? 0)
    )
  }
  let totalAumCrore = 0
  for (const a of byManager.values()) totalAumCrore += a
  const leaderboard = Array.from(byManager.entries())
    .map(([name, aumCrore]) => ({
      name,
      aumCrore,
      sharePct: totalAumCrore > 0 ? (aumCrore / totalAumCrore) * 100 : 0,
    }))
    .sort((a, b) => b.aumCrore - a.aumCrore)
    .slice(0, limit)
    .map((row, i) => ({ rank: i + 1, ...row }))
  return {
    leaderboard,
    asOfDate: latest.asOfDate.toISOString().slice(0, 10),
    totalAumCrore,
  }
}

export async function getTopStatesBySubscribers(limit = 10): Promise<{
  states: { stateName: string; subscribers: number }[]
  totalSubscribers: number
}> {
  const snapshots = await prisma.stateWiseSnapshot.findMany({
    orderBy: { asOfDate: 'desc' },
    select: { stateName: true, subscribers: true },
  })
  const seen = new Set<string>()
  const byState: { stateName: string; subscribers: number }[] = []
  for (const s of snapshots) {
    if (seen.has(s.stateName)) continue
    seen.add(s.stateName)
    byState.push({ stateName: s.stateName, subscribers: s.subscribers ?? 0 })
  }
  let totalSubscribers = 0
  for (const s of byState) totalSubscribers += s.subscribers
  const states = byState
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, limit)
  return { states, totalSubscribers }
}

export async function getTopStatesByContribution(limit = 10): Promise<{
  states: { stateName: string; contributionCrore: number }[]
  totalContributionCrore: number
}> {
  const snapshots = await prisma.stateWiseSnapshot.findMany({
    orderBy: { asOfDate: 'desc' },
    select: { stateName: true, contributionCrore: true },
  })
  const seen = new Set<string>()
  const byState: { stateName: string; contributionCrore: number }[] = []
  for (const s of snapshots) {
    if (seen.has(s.stateName)) continue
    seen.add(s.stateName)
    const contributionCrore = s.contributionCrore ?? 0
    if (contributionCrore > 0) {
      byState.push({ stateName: s.stateName, contributionCrore })
    }
  }
  let totalContributionCrore = 0
  for (const s of byState) totalContributionCrore += s.contributionCrore
  const states = byState
    .sort((a, b) => b.contributionCrore - a.contributionCrore)
    .slice(0, limit)
  return { states, totalContributionCrore }
}

const REPORT_DESCRIPTIONS: Record<string, { name: string; description: string; usedFor: string[] }> = {
  M1: {
    name: 'PFRDA M1',
    description: 'Monthly AUM and scheme-wise data from pension fund managers.',
    usedFor: ['All-India AUM', 'Fund manager leaderboard and scheme-wise AUM', 'Scheme list by manager'],
  },
  A22: {
    name: 'PFRDA A22',
    description: 'NPS All Citizen — state-wise subscriber counts and age-band distribution.',
    usedFor: ['State-wise subscribers', 'Age distribution by state and All-India'],
  },
  A6: {
    name: 'PFRDA A6',
    description: 'APY (Atal Pension Yojana) — state-wise gender distribution (Female / Male / Transgender).',
    usedFor: ['State panel gender breakdown', 'All-India gender distribution'],
  },
  M7: {
    name: 'PFRDA M7',
    description: 'State-wise SG (State Government) sector contribution — monthly and cumulative.',
    usedFor: ['State-wise SG contribution (₹ Cr)', 'Monthly contribution history per state', 'Total SG contribution, top states by contribution'],
  },
}

export function getReportInfo(reportId: string): {
  found: boolean
  name?: string
  description?: string
  usedFor?: string[]
} {
  const id = reportId.toUpperCase().replace(/\s/g, '')
  const report = REPORT_DESCRIPTIONS[id]
  if (!report) return { found: false }
  return { found: true, ...report }
}

export function getAllReportsSummary(): string {
  return Object.entries(REPORT_DESCRIPTIONS)
    .map(([id, r]) => `${id}: ${r.name} — ${r.description}`)
    .join('\n')
}
