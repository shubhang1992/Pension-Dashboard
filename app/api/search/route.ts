import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json(
      { results: { fundManagers: [], states: [], schemes: [] }, query: q, totalCount: 0 },
      { status: 200 }
    )
  }

  const [fundManagers, stateSnapshots, schemes] = await Promise.all([
    prisma.pensionFundManager.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { name: true, aum: true, state: true },
      take: 5,
    }),

    prisma.stateWiseSnapshot.findMany({
      where: { stateName: { contains: q, mode: 'insensitive' } },
      select: { stateName: true, subscribers: true, aumCrore: true },
      orderBy: { asOfDate: 'desc' },
      take: 20,
    }),

    prisma.pensionScheme.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: {
        name: true,
        category: true,
        aum: true,
        manager: { select: { name: true } },
      },
      take: 5,
    }),
  ])

  const seenStates = new Set<string>()
  const states = stateSnapshots
    .filter((s) => {
      if (seenStates.has(s.stateName)) return false
      seenStates.add(s.stateName)
      return true
    })
    .slice(0, 5)
    .map((s) => ({
      stateName: s.stateName,
      subscribers: s.subscribers,
      aumCrore: s.aumCrore,
    }))

  const fmResult = fundManagers.map((fm) => ({
    name: fm.name,
    aumCrore: fm.aum ?? 0,
    state: fm.state,
  }))

  const schemeResult = schemes.map((s) => ({
    name: s.name,
    category: s.category,
    aumCrore: s.aum,
    managerName: s.manager?.name ?? '',
  }))

  const totalCount = fmResult.length + states.length + schemeResult.length

  return NextResponse.json({
    results: {
      fundManagers: fmResult,
      states,
      schemes: schemeResult,
    },
    query: q,
    totalCount,
  })
}
