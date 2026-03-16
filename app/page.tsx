import { DashboardLayout } from '@/components/DashboardLayout'
import { DashboardTabs } from '@/components/DashboardTabs'
import { prisma } from '@/lib/prisma'

type AumHistoryRow = {
  asOfDate: Date
  fundManagerName: string
  aumCrore: number | null
  schemeName: string
  subscribers: number | null
}

export default async function HomePage() {
  const aumHistory: AumHistoryRow[] = await prisma.schemeAumHistory.findMany({
    orderBy: { asOfDate: 'asc' },
  })

  const latestDate =
    aumHistory.length > 0
      ? aumHistory[aumHistory.length - 1]!.asOfDate
      : null

  const rowsLatest: AumHistoryRow[] = []
  if (latestDate != null) {
    for (const r of aumHistory) {
      if (r.asOfDate.getTime() === latestDate.getTime()) rowsLatest.push(r)
    }
  }

  let totalAum = 0
  for (const r of rowsLatest) totalAum += r.aumCrore ?? 0
  const fundManagerNames = new Set<string>()
  for (const r of rowsLatest) fundManagerNames.add(r.fundManagerName)
  const totalManagers = fundManagerNames.size
  const hasPfrdaData = aumHistory.length > 0

  return (
    <DashboardLayout>
      <DashboardTabs
        totalAum={totalAum}
        totalManagers={totalManagers}
        latestDate={latestDate}
        hasPfrdaData={hasPfrdaData}
      />
    </DashboardLayout>
  )
}
