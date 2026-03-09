'use client'

import React from 'react'

type FilterBarProps = {
  selectedState?: string
  onStateChange?: (state: string) => void
}

const indianStates = [
  'All',
  'Maharashtra',
  'Karnataka',
  'Delhi',
  'Tamil Nadu',
  'Gujarat',
]

export function FilterBar({ selectedState = 'All', onStateChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium text-slate-600">
        Filters
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <span>State</span>
          <select
            value={selectedState}
            onChange={(e) => onStateChange?.(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {indianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

        <button className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Reset
        </button>
      </div>
    </div>
  )
}
