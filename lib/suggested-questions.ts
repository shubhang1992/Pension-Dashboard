export type SuggestedQuestion = {
  id: string
  label: string
  prompt: string
  category: 'overview' | 'states' | 'fund-managers' | 'trends' | 'demographics'
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: 'ov-1', category: 'overview', label: 'Dashboard summary', prompt: 'Explain this dashboard in simple terms.' },
  { id: 'ov-2', category: 'overview', label: 'Data freshness', prompt: 'How recent is the data shown here?' },
  { id: 'fm-1', category: 'fund-managers', label: 'Top fund managers', prompt: 'Who are the top 5 fund managers by AUM and their market share?' },
  { id: 'fm-2', category: 'fund-managers', label: 'Market concentration', prompt: 'How concentrated is the pension fund market among top 3 managers?' },
  { id: 'fm-3', category: 'fund-managers', label: 'Scheme breakdown', prompt: 'Which fund manager has the most diversified scheme portfolio?' },
  { id: 'st-1', category: 'states', label: 'Leading states', prompt: 'Which states lead in pension subscriber count?' },
  { id: 'st-2', category: 'states', label: 'SG contributions', prompt: 'Which states lead and lag on SG sector contribution?' },
  { id: 'st-3', category: 'states', label: 'Fastest growing', prompt: 'Which state has shown the fastest growth in contributions recently?' },
  { id: 'st-4', category: 'states', label: 'Low penetration', prompt: 'Which states have the lowest pension penetration and why?' },
  { id: 'tr-1', category: 'trends', label: 'AUM trend', prompt: 'How has total AUM changed over the last 12 months?' },
  { id: 'tr-2', category: 'trends', label: 'Growth rate', prompt: 'What is the year-on-year growth rate of total pension AUM?' },
  { id: 'tr-3', category: 'trends', label: 'Seasonal patterns', prompt: 'Are there any seasonal patterns in pension contributions?' },
  { id: 'dm-1', category: 'demographics', label: 'Gender split', prompt: 'What is the gender distribution of pension subscribers?' },
  { id: 'dm-2', category: 'demographics', label: 'Age distribution', prompt: 'Which age group has the most pension subscribers?' },
  { id: 'dm-3', category: 'demographics', label: 'Youth enrollment', prompt: 'How is youth (18-30) pension enrollment trending?' },
]
