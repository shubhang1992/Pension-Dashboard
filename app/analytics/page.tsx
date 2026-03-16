import { DashboardLayout } from '@/components/DashboardLayout'
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
  const aumRows =
    latestAumDate != null
      ? await prisma.schemeAumHistory.findMany({
          where: { asOfDate: latestAumDate },
          select: { fundManagerName: true, schemeName: true, aumCrore: true },
        })
      : []

  let totalAum = 0
  for (const row of aumRows) {
    totalAum += row.aumCrore ?? 0
  }

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
  const ageAllIndia: Record<string, number> = {}

  for (const s of snapshots) {
    const key = s.stateName
    if (seenStates.has(key)) continue
    seenStates.add(key)
    stateAgg.push({
      stateName: s.stateName,
      subscribers: s.subscribers ?? 0,
      contributionCrore: s.contributionCrore ?? 0,
    })
    const age = s.ageBreakdown as Record<string, number> | null
    if (age && typeof age === 'object') {
      for (const [band, count] of Object.entries(age)) {
        const n = typeof count === 'number' ? count : 0
        ageAllIndia[band] = (ageAllIndia[band] ?? 0) + n
      }
    }
  }

  const totalSubscribers = stateAgg.reduce((s, r) => s + r.subscribers, 0)
  const totalContributionCrore = stateAgg.reduce((s, r) => s + r.contributionCrore, 0)
  const ageBreakdownAllIndia = Object.entries(ageAllIndia)
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      const order = (band: string) => {
        const m = /^(\d+)/.exec(band)
        return m ? parseInt(m[1], 10) : 0
      }
      return order(a[0]) - order(b[0])
    })
    .map(([band, count]) => ({ band, count }))
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
    <DashboardLayout>
      <AnalyticsDashboard
        totalAum={totalAum}
        latestAumDate={latestAumDate}
        managerData={managerData}
        totalSubscribers={totalSubscribers}
        totalContributionCrore={totalContributionCrore}
        topStatesBySubscribers={topStatesBySubscribers}
        topStatesByContribution={topStatesByContribution}
        gender={{
          female,
          male,
          total: genderTotal,
          trans,
        }}
        ageBreakdownAllIndia={ageBreakdownAllIndia}
      />
    </DashboardLayout>
  )
}

