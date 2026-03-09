import { Sidebar } from '@/components/Sidebar'
import { TopNavbar } from '@/components/TopNavbar'
import { prisma } from '@/lib/prisma'
import { normalizeStateNameForDb } from '@/lib/state-name-map'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  // All-India AUM (latest M1)
  const latestAum = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })

  const latestAumDate = latestAum?.asOfDate ?? null
  const aumRows = latestAumDate
    ? await prisma.schemeAumHistory.findMany({
        where: { asOfDate: latestAumDate },
        select: { fundManagerName: true, schemeName: true, aumCrore: true },
      })
    : []

  const totalAum = aumRows.reduce((s, r) => s + (r.aumCrore ?? 0), 0)

  const byManager = new Map<string, number>()
  for (const r of aumRows) {
    byManager.set(
      r.fundManagerName,
      (byManager.get(r.fundManagerName) ?? 0) + (r.aumCrore ?? 0),
    )
  }

  const managerData = Array.from(byManager.entries())
    .map(([name, aumCrore]) => ({
      name,
      aumCrore,
      sharePct: totalAum > 0 ? (aumCrore / totalAum) * 100 : 0,
    }))
    .sort((a, b) => b.aumCrore - a.aumCrore)
    .slice(0, 8)

  // State-wise subscribers & SG contribution (latest snapshot per state)
  const snapshots = await prisma.stateWiseSnapshot.findMany({
    orderBy: { asOfDate: 'desc' },
  })

  const seenStates = new Set<string>()
  const stateAgg: {
    stateName: string
    subscribers: number
    contributionCrore: number
  }[] = []

  for (const s of snapshots) {
    const key = s.stateName
    if (seenStates.has(key)) continue
    seenStates.add(key)
    stateAgg.push({
      stateName: s.stateName,
      subscribers: s.subscribers ?? 0,
      contributionCrore: s.contributionCrore ?? 0,
    })
  }

  const totalSubscribers = stateAgg.reduce((s, r) => s + r.subscribers, 0)
  const topStatesBySubscribers = stateAgg
    .slice()
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 8)

  const topStatesByContribution = stateAgg
    .filter((s) => s.contributionCrore > 0)
    .sort((a, b) => b.contributionCrore - a.contributionCrore)
    .slice(0, 8)

  // All-India gender split (latest snapshots)
  let female = 0
  let male = 0
  let trans = 0
  for (const s of snapshots) {
    female += s.genderFemale ?? 0
    male += s.genderMale ?? 0
    trans += s.genderTransgender ?? 0
  }

  const genderTotal = female + male + trans

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-none">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <AnalyticsDashboard
            totalAum={totalAum}
            latestAumDate={latestAumDate}
            managerData={managerData}
            totalSubscribers={totalSubscribers}
            topStatesBySubscribers={topStatesBySubscribers}
            topStatesByContribution={topStatesByContribution}
            gender={{
              female,
              male,
              trans,
              total: genderTotal,
            }}
          />
        </main>
      </div>
    </div>
  )
}

