'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#f472b6', '#fb923c', '#4ade80', '#a855f7', '#facc15']
const GENDER_COLORS: Record<string, string> = {
  Female: '#f472b6',
  Male: '#38bdf8',
  Transgender: '#a855f7',
}

type ManagerDatum = {
  name: string
  aumCrore: number
  sharePct: number
}

type StateDatum = {
  stateName: string
  subscribers: number
  contributionCrore: number
}

type GenderAgg = {
  female: number
  male: number
  trans: number
  total: number
}

type AgeBand = { band: string; count: number }

type Props = {
  totalAum: number
  latestAumDate: Date | null
  managerData: ManagerDatum[]
  totalSubscribers: number
  totalContributionCrore: number
  topStatesBySubscribers: StateDatum[]
  topStatesByContribution: StateDatum[]
  gender: GenderAgg
  ageBreakdownAllIndia: AgeBand[]
}

export function AnalyticsDashboard({
  totalAum,
  latestAumDate,
  managerData,
  totalSubscribers,
  totalContributionCrore,
  topStatesBySubscribers,
  topStatesByContribution,
  gender,
  ageBreakdownAllIndia,
}: Props) {
  const managerPieData = managerData.map((m) => ({
    name: m.name,
    value: Number(m.sharePct.toFixed(2)),
  }))

  const genderData = [
    { name: 'Female', value: gender.female },
    { name: 'Male', value: gender.male },
    { name: 'Transgender', value: gender.trans },
  ].filter((g) => g.value > 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-lg font-semibold text-white sm:text-xl">Analytics</h1>
        <p className="text-xs text-slate-400 sm:text-sm">
          All-India view across fund managers, states, and demographics.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            All India AUM
          </p>
          <p className="mt-1 text-lg font-bold text-cyan-400 sm:mt-2 sm:text-2xl">
            ₹ {Math.round(totalAum).toLocaleString()} Cr
          </p>
          {latestAumDate && (
            <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
              As of {latestAumDate.toISOString().slice(0, 10)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            Subscribers
          </p>
          <p className="mt-1 text-lg font-bold text-cyan-400 sm:mt-2 sm:text-2xl">
            {totalSubscribers.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">NPS + APY</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            SG contribution
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-400 sm:mt-2 sm:text-2xl">
            ₹ {Math.round(totalContributionCrore).toLocaleString()} Cr
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
            Cumulative · M7
          </p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
            Fund managers
          </p>
          <p className="mt-1 text-lg font-bold text-cyan-400 sm:mt-2 sm:text-2xl">
            {managerData.length > 0 ? 'Top 8' : '—'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
            By AUM share
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <h2 className="mb-2 text-xs font-semibold text-slate-200 sm:mb-3 sm:text-sm">
            Top fund managers by AUM share
          </h2>
          {managerPieData.length === 0 ? (
            <p className="text-xs text-slate-500 sm:text-sm">
              No fund manager data. Click <strong>Refresh from PFRDA</strong> on
              the main dashboard.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="h-48 w-full sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={managerPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="45%"
                      outerRadius="70%"
                      paddingAngle={2}
                    >
                      {managerPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => {
                        const v = typeof value === 'number' ? value : Number(value ?? 0)
                        return [`${v.toFixed(2)}%`, 'Share']
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="max-h-28 space-y-1 overflow-y-auto text-xs">
                {managerData.map((m, index) => (
                  <li key={m.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span
                        className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="max-w-[120px] truncate text-slate-200 sm:max-w-[140px]">
                        {m.name}
                      </span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {m.sharePct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <h2 className="mb-2 text-xs font-semibold text-slate-200 sm:mb-3 sm:text-sm">
            All-India gender distribution (APY)
          </h2>
          {gender.total === 0 ? (
            <p className="text-xs text-slate-500 sm:text-sm">
              No gender data yet. Refresh from PFRDA to import A6.
            </p>
          ) : (
            <div>
              <div className="h-48 w-full sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="45%"
                      outerRadius="70%"
                      paddingAngle={2}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`g-${entry.name}`}
                          fill={GENDER_COLORS[entry.name] ?? COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, _: any, item: any) => {
                        const v = typeof value === 'number' ? value : Number(value ?? 0)
                        const pct = gender.total > 0 ? (v / gender.total) * 100 : 0
                        return [
                          `${v.toLocaleString()} (${pct.toFixed(1)}%)`,
                          item?.name ?? 'Value',
                        ]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs sm:mt-3">
                {genderData.map((g) => {
                  const total = gender.total || 1
                  const pct = (g.value / total) * 100
                  return (
                    <li key={g.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <span
                          className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
                          style={{ backgroundColor: GENDER_COLORS[g.name] ?? '#e5e7eb' }}
                        />
                        <span className="text-slate-200">{g.name}</span>
                      </span>
                      <span className="font-mono text-slate-400">
                        {pct.toFixed(1)}%
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {ageBreakdownAllIndia.length > 0 && (
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <h2 className="mb-2 text-xs font-semibold text-slate-200 sm:mb-3 sm:text-sm">
            Age distribution (NPS All Citizen)
          </h2>
          <div className="h-56 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageBreakdownAllIndia}
                margin={{ top: 10, right: 5, left: -15, bottom: 20 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="band"
                  width={44}
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#475569' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: unknown) => {
                    const str = typeof value === 'number' ? value.toLocaleString() : String(value ?? '')
                    return [str, 'Subscribers'] as [React.ReactNode, string]
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <h2 className="mb-2 text-xs font-semibold text-slate-200 sm:mb-3 sm:text-sm">
            Top states by subscribers
          </h2>
          {topStatesBySubscribers.length === 0 ? (
            <p className="text-xs text-slate-500 sm:text-sm">
              No state subscriber data yet.
            </p>
          ) : (
            <div className="h-56 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStatesBySubscribers.map((s) => ({
                    name: s.stateName,
                    value: s.subscribers,
                  }))}
                  margin={{ left: -20, right: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 8, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => {
                      const v = typeof value === 'number' ? value : Number(value ?? 0)
                      return [v.toLocaleString(), 'Subscribers']
                    }}
                  />
                  <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4">
          <h2 className="mb-2 text-xs font-semibold text-slate-200 sm:mb-3 sm:text-sm">
            Top states by SG contribution
          </h2>
          {topStatesByContribution.length === 0 ? (
            <p className="text-xs text-slate-500 sm:text-sm">
              No SG contribution data yet.
            </p>
          ) : (
            <div className="h-56 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStatesByContribution.map((s) => ({
                    name: s.stateName,
                    value: s.contributionCrore,
                  }))}
                  margin={{ left: -20, right: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 8, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => {
                      const v = typeof value === 'number' ? value : Number(value ?? 0)
                      return [`${Math.round(v).toLocaleString()} Cr`, 'Contribution']
                    }}
                  />
                  <Bar dataKey="value" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
