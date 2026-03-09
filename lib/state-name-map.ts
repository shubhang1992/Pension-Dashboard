/**
 * Map SVG/GeoJSON state names to DB-friendly names (e.g. PensionFundManager.state).
 * Handles "NCT of Delhi" -> "Delhi", "Dadra and Nagar Haveli" / "Daman and Diu" etc.
 */
export const STATE_NAME_TO_DB: Record<string, string> = {
  'NCT of Delhi': 'Delhi',
  'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu',
}

export function normalizeStateNameForDb(svgOrDisplayName: string): string {
  return STATE_NAME_TO_DB[svgOrDisplayName] ?? svgOrDisplayName
}
