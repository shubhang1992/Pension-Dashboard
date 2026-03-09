import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeStateNameForDb } from '@/lib/state-name-map'

async function getLeaderboard(): Promise<{ name: string; aumCrore: number }[]> {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) return []
  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { fundManagerName: true, aumCrore: true },
  })
  const byManager = new Map<string, number>()
  for (const r of rows) {
    const aum = r.aumCrore ?? 0
    byManager.set(r.fundManagerName, (byManager.get(r.fundManagerName) ?? 0) + aum)
  }
  return Array.from(byManager.entries())
    .map(([name, aumCrore]) => ({ name, aumCrore }))
    .sort((a, b) => b.aumCrore - a.aumCrore)
}

async function getAllIndiaAum(): Promise<number> {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) return 0
  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { aumCrore: true },
  })
  return rows.reduce((s, r) => s + (r.aumCrore ?? 0), 0)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const stateNameDecoded = decodeURIComponent(name)
  const stateDb = normalizeStateNameForDb(stateNameDecoded)

  // 1) Prefer state-wise snapshot if we have it (from PFRDA state-wise reports / OGD)
  const snapshot = await prisma.stateWiseSnapshot.findFirst({
    where: {
      stateName: { equals: stateDb, mode: 'insensitive' },
    },
    orderBy: { asOfDate: 'desc' },
  })

  if (snapshot) {
    const leaderboard = await getLeaderboard()
    const allIndiaAum = await getAllIndiaAum()
    return NextResponse.json({
      stateName: stateNameDecoded,
      stateNameDb: stateDb,
      aumCrore: snapshot.aumCrore ?? 0,
      allIndiaAumCrore: allIndiaAum,
      subscribers: snapshot.subscribers ?? 0,
      contributionCrore: snapshot.contributionCrore ?? null,
      asOfDate: snapshot.asOfDate.toISOString().slice(0, 10),
      managers: [],
      isAllIndiaFallback: false,
      source: 'state_wise_snapshot',
      genderFemale: snapshot.genderFemale ?? null,
      genderMale: snapshot.genderMale ?? null,
      genderTransgender: snapshot.genderTransgender ?? null,
      ageBreakdown: snapshot.ageBreakdown as Record<string, number> | null,
      contributionHistory: snapshot.contributionHistory as
        | Record<string, number>
        | null,
      leaderboard,
    })
  }

  // 2) Else derive from fund managers with HQ in this state + PFRDA M1
  const managers = await prisma.pensionFundManager.findMany({
    where: { state: stateDb },
    select: { id: true, name: true },
  })

  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  const latestDate = latest?.asOfDate ?? null

  if (!latestDate) {
    return NextResponse.json({
      stateName: stateNameDecoded,
      stateNameDb: stateDb,
      aumCrore: 0,
      allIndiaAumCrore: 0,
      subscribers: 0,
      contributionCrore: null,
      asOfDate: null,
      managers: managers.map((m) => ({ name: m.name, aumCrore: 0 })),
      isAllIndiaFallback: false,
      genderFemale: null,
      genderMale: null,
      genderTransgender: null,
      ageBreakdown: null,
      leaderboard: [],
      message: 'No PFRDA data yet. Refresh from PFRDA to see data.',
    })
  }

  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latestDate },
    select: { fundManagerName: true, aumCrore: true, subscribers: true },
  })

  let totalAum = 0
  let totalSubscribers = 0
  const managerAumList: { name: string; aumCrore: number }[] = []

  for (const m of managers) {
    const matchRows = rows.filter(
      (r) =>
        r.fundManagerName === m.name ||
        r.fundManagerName.includes(m.name) ||
        m.name.includes(r.fundManagerName)
    )
    const aum = matchRows.reduce((s, r) => s + (r.aumCrore ?? 0), 0)
    const subs = matchRows.reduce((s, r) => s + (r.subscribers ?? 0), 0)
    totalAum += aum
    totalSubscribers += subs
    managerAumList.push({ name: m.name, aumCrore: aum })
  }

  managerAumList.sort((a, b) => b.aumCrore - a.aumCrore)

  const hasStateData = totalAum > 0 || totalSubscribers > 0 || managers.length > 0

  const leaderboard = await getLeaderboard()
  const allIndiaAum = rows.reduce((s, r) => s + (r.aumCrore ?? 0), 0)

  if (hasStateData) {
    return NextResponse.json({
      stateName: stateNameDecoded,
      stateNameDb: stateDb,
      aumCrore: totalAum,
      allIndiaAumCrore: allIndiaAum,
      subscribers: totalSubscribers,
      contributionCrore: null,
      asOfDate: latestDate.toISOString().slice(0, 10),
      managers: managerAumList,
      isAllIndiaFallback: false,
      source: 'fund_manager_attribution',
      genderFemale: null,
      genderMale: null,
      genderTransgender: null,
      ageBreakdown: null,
      leaderboard,
    })
  }

  // 3) No state-wise data and no managers in this state → show All-India totals for reference
  const allIndiaSubscribers = rows.reduce((s, r) => s + (r.subscribers ?? 0), 0)

  return NextResponse.json({
    stateName: stateNameDecoded,
    stateNameDb: stateDb,
    aumCrore: allIndiaAum,
    allIndiaAumCrore: allIndiaAum,
    subscribers: allIndiaSubscribers,
    contributionCrore: null,
    asOfDate: latestDate.toISOString().slice(0, 10),
    managers: [],
    isAllIndiaFallback: true,
    genderFemale: null,
    genderMale: null,
    genderTransgender: null,
    ageBreakdown: null,
    leaderboard,
    message:
      'State-wise breakdown not available for this state. Showing All-India totals for reference.',
  })
}
