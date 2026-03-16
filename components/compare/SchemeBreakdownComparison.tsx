'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Scheme = { schemeName: string; aumCrore: number }
type ManagerSchemes = { name: string; schemes: Scheme[] }

type Props = {
  managers: ManagerSchemes[]
}

const COLORS = ['#22d3ee', '#34d399', '#fbbf24']

export function SchemeBreakdownComparison({ managers }: Props) {
  const schemeSet = new Set<string>()
  for (const m of managers) {
    for (const s of m.schemes) schemeSet.add(s.schemeName)
  }

  const data = Array.from(schemeSet).map((scheme) => {
    const row: Record<string, string | number> = { scheme }
    for (const m of managers) {
      const found = m.schemes.find((s) => s.schemeName === scheme)
      row[m.name] = found ? Math.round(found.aumCrore) : 0
    }
    return row
  })

  data.sort((a, b) => {
    const sumA = managers.reduce((s, m) => s + ((a[m.name] as number) || 0), 0)
    const sumB = managers.reduce((s, m) => s + ((b[m.name] as number) || 0), 0)
    return sumB - sumA
  })

  const top = data.slice(0, 15)

  if (top.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No scheme data available for comparison.
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-white sm:text-base">
        Scheme-wise AUM Comparison
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(300, top.length * 32)}>
        <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
          />
          <YAxis
            type="category"
            dataKey="scheme"
            width={140}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
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
            <Bar
              key={m.name}
              dataKey={m.name}
              fill={COLORS[i]}
              radius={[0, 4, 4, 0]}
              barSize={10}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
