import { Sidebar } from '@/components/Sidebar'
import { TopNavbar } from '@/components/TopNavbar'
import { FundManagerLeaderboard } from '@/components/FundManagerLeaderboard'

export default function FundManagersPage() {
  return (
    <div className="flex h-screen">
      <div className="w-64 flex-none">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto px-6 py-5">
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
        </main>
      </div>
    </div>
  )
}

