export type PensionFundManager = {
  id: number
  name: string
  state: string
  city: string
  totalAumCrore: number
}

export type PensionScheme = {
  id: number
  name: string
  managerId: number
  category: string
  riskLevel: 'Low' | 'Medium' | 'High'
  aumCrore: number
}

export type AumTimeseriesPoint = {
  month: string
  totalAumCrore: number
}

export const pensionFundManagers: PensionFundManager[] = [
  {
    id: 1,
    name: 'ABC Pension Fund Management Co.',
    state: 'Maharashtra',
    city: 'Mumbai',
    totalAumCrore: 52000,
  },
  {
    id: 2,
    name: 'XYZ Retirement Trust',
    state: 'Karnataka',
    city: 'Bengaluru',
    totalAumCrore: 31000,
  },
  {
    id: 3,
    name: 'National Pension Fund Corp.',
    state: 'Delhi',
    city: 'New Delhi',
    totalAumCrore: 45000,
  },
]

export const pensionSchemes: PensionScheme[] = [
  {
    id: 1,
    name: 'NPS Equity Scheme - Tier I',
    managerId: 1,
    category: 'NPS',
    riskLevel: 'High',
    aumCrore: 18000,
  },
  {
    id: 2,
    name: 'NPS Corporate Debt Scheme',
    managerId: 1,
    category: 'NPS',
    riskLevel: 'Medium',
    aumCrore: 22000,
  },
  {
    id: 3,
    name: 'Government Pension Scheme A',
    managerId: 2,
    category: 'Government',
    riskLevel: 'Low',
    aumCrore: 15000,
  },
  {
    id: 4,
    name: 'EPF Long-Term Growth Fund',
    managerId: 3,
    category: 'EPF',
    riskLevel: 'Medium',
    aumCrore: 27000,
  },
]

export const aumTimeseries: AumTimeseriesPoint[] = [
  { month: '2025-01', totalAumCrore: 120000 },
  { month: '2025-02', totalAumCrore: 121500 },
  { month: '2025-03', totalAumCrore: 123200 },
  { month: '2025-04', totalAumCrore: 124800 },
  { month: '2025-05', totalAumCrore: 126300 },
  { month: '2025-06', totalAumCrore: 128000 },
]
