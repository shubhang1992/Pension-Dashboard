import { DashboardLayout } from '@/components/DashboardLayout'
import { FundManagerLeaderboard } from '@/components/FundManagerLeaderboard'

export default function FundManagersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Fund managers
            </h1>
            <p className="text-sm text-slate-400">
              All-India AUM leaderboard with scheme-wise breakdown.
            </p>
          </div>
        </header>

        <FundManagerLeaderboard />
      </div>
    </DashboardLayout>
  )
}

