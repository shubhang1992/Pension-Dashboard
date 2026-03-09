'use client'

import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type AumByManagerDatum = {
  name: string
  aum: number
}

type AumByManagerChartProps = {
  data: AumByManagerDatum[]
}

export function AumByManagerChart({ data }: AumByManagerChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10 }}
          angle={-15}
          textAnchor="end"
          height={40}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          formatter={(value: unknown) => [
            value != null ? `${Number(value).toLocaleString()} Cr` : '—',
            'AUM',
          ]}
        />
        <Bar dataKey="aum" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
