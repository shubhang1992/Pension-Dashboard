'use client'

import React from 'react'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type TotalAumDatum = {
  month: string
  totalAumCrore: number
}

type TotalAumOverTimeChartProps = {
  data: TotalAumDatum[]
}

export function TotalAumOverTimeChart({ data }: TotalAumOverTimeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260} minHeight={260}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={{ stroke: '#475569' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
          formatter={(value: unknown) => [
            value != null ? `₹ ${Number(value).toLocaleString()} Cr` : '—',
            'Total AUM',
          ]}
        />
        <Line
          type="monotone"
          dataKey="totalAumCrore"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ r: 3, fill: '#22d3ee' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
