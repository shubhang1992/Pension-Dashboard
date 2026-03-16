'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type TimePoint = { date: string; aumCrore: number }
type ManagerTrend = { name: string; aumTimeSeries: TimePoint[] }

type Props = {
  managers: ManagerTrend[]
}

const COLORS = ['#22d3ee', '#34d399', '#fbbf24']

export function AumTrendComparison({ managers }: Props) {
  const dateSet = new Set<string>()
  for (const m of managers) {
    for (const p of m.aumTimeSeries) dateSet.add(p.date)
  }
  const dates = Array.from(dateSet).sort()

  const data = dates.map((date) => {
    const row: Record<string, string | number> = { date }
    for (const m of managers) {
      const point = m.aumTimeSeries.find((p) => p.date === date)
      row[m.name] = point?.aumCrore ?? 0
    }
    return row
  })

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No time-series data available.
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-white sm:text-base">
        AUM Trend Over Time
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v: string) => {
              const [y, m] = v.split('-')
              return `${m}/${y.slice(2)}`
            }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v: number) =>
              v >= 100000
                ? `${(v / 100000).toFixed(0)}L`
                : v >= 1000
                  ? `${(v / 1000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.75rem',
              fontSize: '12px',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              `Rs ${Number(value).toLocaleString('en-IN')} Cr`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {managers.map((m, i) => (
            <Line
              key={m.name}
              type="monotone"
              dataKey={m.name}
              stroke={COLORS[i]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
