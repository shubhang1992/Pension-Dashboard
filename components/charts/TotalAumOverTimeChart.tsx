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
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          formatter={(value: unknown) => [
            value != null ? `${Number(value).toLocaleString()} Cr` : '—',
            'Total AUM',
          ]}
        />
        <Line
          type="monotone"
          dataKey="totalAumCrore"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
