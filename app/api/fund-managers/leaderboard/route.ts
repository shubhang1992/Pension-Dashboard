import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** All-India fund manager leaderboard by AUM with scheme-wise breakdown (latest PFRDA M1). */
export async function GET() {
  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  if (!latest) {
    return NextResponse.json({
      leaderboard: [],
      asOfDate: null,
      totalAumCrore: 0,
    })
  }

  const rows = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latest.asOfDate },
    select: { fundManagerName: true, schemeName: true, aumCrore: true },
  })

  const byManager = new Map<
    string,
    { aumCrore: number; schemes: { schemeName: string; aumCrore: number }[] }
  >()
  for (const r of rows) {
    const name = r.fundManagerName
    const aum = r.aumCrore ?? 0
    if (!byManager.has(name)) {
      byManager.set(name, { aumCrore: 0, schemes: [] })
    }
    const entry = byManager.get(name)!
    entry.aumCrore += aum
    if (aum > 0) entry.schemes.push({ schemeName: r.schemeName, aumCrore: aum })
  }

  const totalAumCrore = Array.from(byManager.values()).reduce((s, m) => s + m.aumCrore, 0)
  const leaderboard = Array.from(byManager.entries())
    .map(([name, data]) => ({
      name,
      aumCrore: data.aumCrore,
      sharePct: totalAumCrore > 0 ? (data.aumCrore / totalAumCrore) * 100 : 0,
      schemes: data.schemes.sort((a, b) => b.aumCrore - a.aumCrore),
    }))
    .sort((a, b) => b.aumCrore - a.aumCrore)
    .map((row, i) => ({ rank: i + 1, ...row }))

  return NextResponse.json({
    leaderboard,
    asOfDate: latest.asOfDate.toISOString().slice(0, 10),
    totalAumCrore,
  })
}
