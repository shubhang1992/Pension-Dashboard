import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeStateNameForDb } from '@/lib/state-name-map'
// Use same state names as the SVG map for keys
import indiaMapData from '@svg-maps/india'

type Location = { id: string; name: string; path: string }
type MapData = { locations: Location[] }
const mapData = indiaMapData as MapData

export async function GET() {
  const stateAum: Record<string, number> = {}
  const stateSubscribers: Record<string, number> = {}
  for (const loc of mapData.locations) {
    stateAum[loc.name] = 0
    stateSubscribers[loc.name] = 0
  }

  // State-wise subscribers from PFRDA A22/A6 import (StateWiseSnapshot)
  const snapshots = await prisma.stateWiseSnapshot.findMany({
    orderBy: { asOfDate: 'desc' },
    select: { stateName: true, subscribers: true },
  })
  const seen = new Set<string>()
  for (const s of snapshots) {
    if (seen.has(s.stateName)) continue
    seen.add(s.stateName)
    const name = findSvgStateNameForDb(s.stateName, mapData.locations) ?? s.stateName
    if (stateSubscribers[name] !== undefined) {
      stateSubscribers[name] = s.subscribers ?? 0
    }
  }

  const managers = await prisma.pensionFundManager.findMany({
    where: { state: { not: null } },
    select: { id: true, name: true, state: true },
  })

  const latest = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })
  const latestDate = latest?.asOfDate ?? null

  if (latestDate) {
    type AumRow = { fundManagerName: string; aumCrore: number | null }
    const rows: AumRow[] = await prisma.schemeAumHistory.findMany({
      where: { asOfDate: latestDate },
      select: { fundManagerName: true, aumCrore: true },
    })
    for (const m of managers) {
      const dbState = m.state ? normalizeStateNameForDb(m.state) : null
      if (!dbState) continue
      let aum = 0
      for (const r of rows) {
        if (
          r.fundManagerName === m.name ||
          r.fundManagerName.includes(m.name) ||
          m.name.includes(r.fundManagerName)
        ) {
          aum += r.aumCrore ?? 0
        }
      }
      const svgStateName = findSvgStateNameForDb(dbState, mapData.locations)
      if (svgStateName) stateAum[svgStateName] = (stateAum[svgStateName] ?? 0) + aum
    }
  }

  return NextResponse.json({
    stateAum,
    stateSubscribers,
    asOfDate: latestDate?.toISOString().slice(0, 10) ?? null,
  })
}

function findSvgStateNameForDb(dbState: string, locations: Location[]): string | null {
  const n = normalizeStateNameForDb(dbState)
  const found = locations.find(
    (l) => l.name === n || normalizeStateNameForDb(l.name) === n
  )
  return found?.name ?? null
}
