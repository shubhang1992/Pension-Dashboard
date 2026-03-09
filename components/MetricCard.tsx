import React from 'react'

type MetricCardProps = {
  label: string
  value: string | number
  sublabel?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
}

export function MetricCard({
  label,
  value,
  sublabel,
  trend,
  trendValue,
}: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-slate-500'

  const trendLabel =
    trend === 'up'
      ? 'Up'
      : trend === 'down'
      ? 'Down'
      : trend === 'flat'
      ? 'Flat'
      : undefined

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-slate-500">{sublabel}</div>
      )}
      {trend && trendLabel && trendValue && (
        <div className={`mt-2 text-xs font-medium ${trendColor}`}>
          {trendLabel} {trendValue} vs last period
        </div>
      )}
    </div>
  )
}
