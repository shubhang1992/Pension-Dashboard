export type ChartData = {
  type: 'bar' | 'line' | 'pie'
  title: string
  xKey: string
  yKey: string
  data: Record<string, string | number>[]
  unit?: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  chart?: ChartData | null
}
