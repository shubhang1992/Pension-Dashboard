'use client'

import React from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ChartData } from '@/lib/chat-types'

const COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb923c', '#60a5fa', '#4ade80']

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
}

const AXIS_STYLE = { fill: '#94a3b8', fontSize: 10 }

function fmtAxisValue(v: number, unit?: string): string {
  if (unit === 'Cr') {
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L Cr`
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
    return `₹${v}`
  }
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
  return String(v)
}

function fmtTooltipValue(v: number, unit?: string): string {
  const formatted = v.toLocaleString('en-IN')
  if (unit === 'Cr') return `₹${formatted} Cr`
  if (unit === '%') return `${formatted}%`
  return formatted
}

export function ChatChart({ chart }: { chart: ChartData }) {
  const manyItems = chart.data.length > 5

  return (
    <div className="mt-2 rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
      <p className="mb-2 text-[11px] font-medium text-slate-400">{chart.title}</p>

      {chart.type === 'bar' && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chart.data} margin={{ top: 4, right: 8, bottom: manyItems ? 40 : 4, left: 8 }}>
            <XAxis
              dataKey={chart.xKey}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              angle={manyItems ? -30 : 0}
              textAnchor={manyItems ? 'end' : 'middle'}
              interval={0}
              height={manyItems ? 60 : 30}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtAxisValue(v, chart.unit)}
              width={50}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: any) => [fmtTooltipValue(Number(value), chart.unit), '']}
            />
            <Bar dataKey={chart.yKey} fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {chart.type === 'line' && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chart.data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <XAxis dataKey={chart.xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtAxisValue(v, chart.unit)}
              width={55}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: any) => [fmtTooltipValue(Number(value), chart.unit), '']}
            />
            <Line
              dataKey={chart.yKey}
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3, fill: '#22d3ee' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chart.type === 'pie' && (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={chart.yKey}
              nameKey={chart.xKey}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={35}
              label={(props: any) => {
                const name = String(props.name ?? '')
                const value = Number(props.value ?? 0)
                if (chart.unit === '%' && value < 5) return ''
                const short = name.length > 12 ? name.slice(0, 10) + '..' : name
                return chart.unit === '%' ? `${short}: ${value}%` : `${short}`
              }}
              labelLine={false}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: any) => [fmtTooltipValue(Number(value), chart.unit), '']}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
