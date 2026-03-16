import { DashboardLayout } from '@/components/DashboardLayout'
import { DashboardTabs } from '@/components/DashboardTabs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type AumHistoryRow = {
  asOfDate: Date
  fundManagerName: string
  aumCrore: number | null
  schemeName: string
  subscribers: number | null
}

export default async function HomePage() {
  const latestEntry = await prisma.schemeAumHistory.findFirst({
    orderBy: { asOfDate: 'desc' },
    select: { asOfDate: true },
  })

  const latestDate = latestEntry?.asOfDate ?? null
  const hasPfrdaData = latestDate !== null

  const rowsLatest: AumHistoryRow[] = latestDate
    ? await prisma.schemeAumHistory.findMany({ where: { asOfDate: latestDate } })
    : []

  let totalAum = 0
  for (const r of rowsLatest) totalAum += r.aumCrore ?? 0
  const fundManagerNames = new Set<string>()
  for (const r of rowsLatest) fundManagerNames.add(r.fundManagerName)
  const totalManagers = fundManagerNames.size

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
