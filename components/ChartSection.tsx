import React from 'react'

type ChartSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export function ChartSection({ title, description, children }: ChartSectionProps) {
  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="min-h-[220px]">{children}</div>
    </section>
  )
}
