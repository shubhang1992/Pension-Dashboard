import { DashboardLayout } from '@/components/DashboardLayout'
import { DashboardTabs } from '@/components/DashboardTabs'
import { prisma } from '@/lib/prisma'

export default async function HomePage() {
  const aumHistory = await prisma.schemeAumHistory.findMany({
    orderBy: { asOfDate: 'asc' },
  })

  const latestDate =
    aumHistory.length > 0
      ? aumHistory[aumHistory.length - 1]!.asOfDate
      : null

  const rowsLatest =
    latestDate != null
      ? aumHistory.filter(
          (r) => r.asOfDate.getTime() === latestDate.getTime()
        )
      : []

  const totalAum = rowsLatest.reduce(
    (sum, r) => sum + (r.aumCrore ?? 0),
    0
  )
  const fundManagerNames = new Set(rowsLatest.map((r) => r.fundManagerName))
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
