import { DashboardLayout } from '@/components/DashboardLayout'
import { prisma } from '@/lib/prisma'
import { normalizeStateNameForDb } from '@/lib/state-name-map'
import { StateContributionsTabs } from '@/components/StateContributionsTabs'

type Props = {
  params: Promise<{ name: string }>
}

export default async function StateContributionsPage({ params }: Props) {
  const { name } = await params
  const stateNameDecoded = decodeURIComponent(name)
  const stateDb = normalizeStateNameForDb(stateNameDecoded)

  const snapshot = await prisma.stateWiseSnapshot.findFirst({
    where: { stateName: { equals: stateDb, mode: 'insensitive' } },
    orderBy: { asOfDate: 'desc' },
  })

  const history =
    (snapshot?.contributionHistory as Record<string, number> | null) ?? null

  let ordered: [string, number][] = []
  let total = snapshot?.contributionCrore ?? 0

  if (history) {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    type Parsed = { label: string; value: number; year: number; monthIndex: number }
    const parsed: Parsed[] = []
    for (const [label, value] of Object.entries(history)) {
      const m = /^([A-Za-z]{3})-(\d{2})$/.exec(label.trim())
      if (!m) continue
      const monthIdx = monthOrder.indexOf(m[1])
      if (monthIdx === -1) continue
      const yy = Number(m[2])
      const year = 2000 + yy
      parsed.push({ label, value, year, monthIndex: monthIdx })
    }
    parsed.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.monthIndex - b.monthIndex
    })
    ordered = parsed.map((p) => [p.label, p.value])
    if (!total || total <= 0) {
      total = 0
      for (const [, v] of ordered) total += v
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {!snapshot && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-100">
            No state-wise snapshot found for this state. Try refreshing from
            PFRDA.
          </div>
        )}

        {snapshot && (
          <StateContributionsTabs
            stateName={stateNameDecoded}
            total={total}
            ordered={ordered}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

