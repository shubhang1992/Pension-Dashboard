import { DashboardLayout } from '@/components/DashboardLayout'

const REPORTS = [
  {
    id: 'm1',
    name: 'PFRDA M1',
    description: 'Monthly AUM and scheme-wise data from pension fund managers.',
    usedFor: [
      'All-India AUM (Overview, Analytics, Fund Managers)',
      'Fund manager leaderboard and scheme-wise AUM',
      'Scheme list and AUM by manager',
    ],
  },
  {
    id: 'a22',
    name: 'PFRDA A22',
    description: 'NPS All Citizen — state-wise subscriber counts and age-band distribution.',
    usedFor: [
      'State-wise subscribers (map, state panel, Analytics)',
      'Age distribution by state and All-India (Analytics)',
    ],
  },
  {
    id: 'a6',
    name: 'PFRDA A6',
    description: 'APY (Atal Pension Yojana) — state-wise gender distribution (Female / Male / Transgender).',
    usedFor: [
      'State panel gender breakdown',
      'All-India gender distribution pie (Analytics)',
    ],
  },
  {
    id: 'm7',
    name: 'PFRDA M7',
    description: 'State-wise SG (State Government) sector contribution — monthly and cumulative.',
    usedFor: [
      'State-wise SG contribution (₹ Cr) in state panel',
      'Monthly contribution history and trends per state',
      'Total SG contribution (Analytics), top states by contribution',
    ],
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            PFRDA data sources used to compute all metrics in this dashboard.
          </p>
        </header>

        <div className="space-y-4">
          {REPORTS.map((report) => (
            <section
              key={report.id}
              className="rounded-2xl border border-slate-700/50 bg-slate-900/50 px-5 py-4 shadow-lg backdrop-blur"
            >
              <h2 className="text-base font-semibold text-cyan-400">
                {report.name}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {report.description}
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Used for
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-400">
                  {report.usedFor.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Data is refreshed via <strong>Refresh from PFRDA</strong> in the top
          bar. No file uploads — the dashboard fetches directly from PFRDA
          sources. Use the <strong>Ask about the data</strong> input on the Overview to ask
          questions in plain language and get answers from this data.
        </p>
      </div>
    </DashboardLayout>
  )
}
