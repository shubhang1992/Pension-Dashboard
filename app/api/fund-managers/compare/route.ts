import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const namesParam = request.nextUrl.searchParams.get('names') ?? ''
  const names = namesParam
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)

  if (names.length < 2 || names.length > 3) {
    return NextResponse.json(
      { error: 'Provide 2-3 comma-separated fund manager names' },
      { status: 400 }
    )
  }

  const allDates = await prisma.schemeAumHistory.findMany({
    select: { asOfDate: true },
    distinct: ['asOfDate'],
    orderBy: { asOfDate: 'desc' },
    take: 12,
  })
  if (allDates.length === 0) {
    return NextResponse.json({ managers: [], asOfDate: null })
  }

  const latestDate = allDates[0].asOfDate

  const allLatest = await prisma.schemeAumHistory.findMany({
    where: { asOfDate: latestDate },
    select: { fundManagerName: true, aumCrore: true },
  })
  let grandTotalAum = 0
  for (const r of allLatest) grandTotalAum += r.aumCrore ?? 0

  const allRows = await prisma.schemeAumHistory.findMany({
    where: {
      fundManagerName: { in: names, mode: 'insensitive' },
      asOfDate: { in: allDates.map((d) => d.asOfDate) },
    },
    select: {
      asOfDate: true,
      fundManagerName: true,
      schemeName: true,
      aumCrore: true,
      subscribers: true,
    },
    orderBy: { asOfDate: 'asc' },
  })

  const nameMap = new Map<string, string>()
  for (const r of allRows) {
    const lower = r.fundManagerName.toLowerCase()
    if (!nameMap.has(lower)) nameMap.set(lower, r.fundManagerName)
  }

  const managers = names.map((inputName) => {
    const canonical = nameMap.get(inputName.toLowerCase()) ?? inputName
    const rows = allRows.filter(
      (r) => r.fundManagerName.toLowerCase() === inputName.toLowerCase()
    )

    const latestRows = rows.filter(
      (r) => r.asOfDate.getTime() === latestDate.getTime()
    )
    let latestAumCrore = 0
    let totalSubscribers = 0
    const schemes: { schemeName: string; aumCrore: number; subscribers: number | null }[] = []
    for (const r of latestRows) {
      latestAumCrore += r.aumCrore ?? 0
      totalSubscribers += r.subscribers ?? 0
      if ((r.aumCrore ?? 0) > 0) {
        schemes.push({
          schemeName: r.schemeName,
          aumCrore: r.aumCrore ?? 0,
          subscribers: r.subscribers,
        })
      }
    }
    schemes.sort((a, b) => b.aumCrore - a.aumCrore)

    const byMonth = new Map<string, number>()
    for (const r of rows) {
      const key = r.asOfDate.toISOString().slice(0, 7)
      byMonth.set(key, (byMonth.get(key) ?? 0) + (r.aumCrore ?? 0))
    }
    const aumTimeSeries = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, aumCrore]) => ({ date, aumCrore: Math.round(aumCrore) }))

    const calcGrowth = (monthsBack: number): number | null => {
      if (aumTimeSeries.length < 2) return null
      const current = aumTimeSeries[aumTimeSeries.length - 1].aumCrore
      const idx = aumTimeSeries.length - 1 - monthsBack
      if (idx < 0) return null
      const past = aumTimeSeries[idx].aumCrore
      if (past <= 0) return null
      return +((((current - past) / past) * 100).toFixed(1))
    }

    return {
      name: canonical,
      latestAumCrore: Math.round(latestAumCrore),
      totalSubscribers,
      marketSharePct:
        grandTotalAum > 0
          ? +((latestAumCrore / grandTotalAum) * 100).toFixed(1)
          : 0,
      growthRate: {
        '3m': calcGrowth(3),
        '6m': calcGrowth(6),
        '12m': calcGrowth(12),
      },
      schemes,
      aumTimeSeries,
    }
  })

  return NextResponse.json({
    managers,
    asOfDate: latestDate.toISOString().slice(0, 10),
  })
}
