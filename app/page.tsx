import { Sidebar } from '@/components/Sidebar'
import { TopNavbar } from '@/components/TopNavbar'
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
    <div className="flex h-screen">
      <div className="w-64 flex-none">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <DashboardTabs
            totalAum={totalAum}
            totalManagers={totalManagers}
            latestDate={latestDate}
            hasPfrdaData={hasPfrdaData}
          />
        </main>
      </div>
    </div>
  )
}
