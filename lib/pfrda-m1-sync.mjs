/**
 * Fetch PFRDA M1 Excel from official URL and upsert into SchemeAumHistory.
 * No API keys; uses public download link only. Safe to run on a schedule.
 */
import { read, utils } from 'xlsx'
import { PFRDA_URLS } from './pfrda-urls.mjs'

const PF_START_COLS = [
  1, 17, 33, 49, 64, 79, 94, 109, 124, 139, 154, 169, 184, 199,
]
const PF_NAMES = [
  'SBI PF',
  'LIC PF',
  'UTI PF',
  'HDFC PF',
  'ICICI PF',
  'Kotak PF',
  'Aditya Birla PF',
  'Tata PF',
  'Max PF',
  'Axis PF',
  'Reliance PF',
  'IDFC PF',
  'DSP Black Rock PF',
  'DSP PF',
]
const SCHEME_NAMES = [
  'CG',
  'SG',
  'NPS Lite',
  'Corp CG',
  'APY',
  'E Tier I',
  'C Tier I',
  'G Tier I',
  'E Tier II',
  'C Tier II',
  'G Tier II',
  'A Tier I',
  'A Tier II',
  'TTS 2',
  'NPS Tier-II Composite',
  'TOTAL',
]
const DATA_START_ROW = 4
const DATE_COL = 0

function parseMonthYear(str) {
  if (!str || typeof str !== 'string') return null
  const s = str.trim()
  const match = s.match(/^([A-Za-z]{3})-(\d{4})$/)
  if (!match) return null
  const months = 'JanFebMarAprMayJunJulAugSepOctNovDec'
  const i = months.indexOf(match[1])
  if (i === -1) return null
  const month = Math.floor(i / 3) + 1
  const year = parseInt(match[2], 10)
  const lastDay = new Date(year, month, 0)
  return lastDay
}

function toNumber(val) {
  if (val === null || val === undefined || val === '' || val === '-')
    return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

/**
 * Fetch M1 from PFRDA, parse, and upsert into DB. No credentials required.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ url?: string; monthsToKeep?: number }} [options]
 * @returns {{ rowsImported: number, latestAsOf?: string, error?: string }}
 */
export async function syncM1FromPfrda(prisma, options = {}) {
  try {
    const res = await fetch(options.url ?? PFRDA_URLS.M1, {
      headers: {
        'User-Agent':
          'PensionDashboard/1.0 (Internal; data refresh)',
      },
    })
    if (!res.ok) {
      return {
        rowsImported: 0,
        error: `PFRDA returned ${res.status} ${res.statusText}`,
      }
    }
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets['Formatted Report']
    if (!sheet) {
      return { rowsImported: 0, error: 'Sheet "Formatted Report" not found' }
    }

    const data = utils.sheet_to_json(sheet, { header: 1, defval: '' })
    /** @type {Array<{ asOfDate: Date; fundManagerName: string; schemeName: string; aumCrore: number }>} */
    const parsedRows = []

    for (let r = DATA_START_ROW; r < data.length; r++) {
      const row = data[r]
      if (!row || !row[DATE_COL]) continue

      const asOfDate = parseMonthYear(String(row[DATE_COL]))
      if (!asOfDate) continue

      for (let p = 0; p < PF_START_COLS.length; p++) {
        const pfName = PF_NAMES[p]
        const startCol = PF_START_COLS[p]
        for (let s = 0; s < SCHEME_NAMES.length; s++) {
          const schemeName = SCHEME_NAMES[s]
          const col = startCol + s
          const val = row[col]
          const aumCrore = toNumber(val)
          if (aumCrore === null) continue
          parsedRows.push({
            asOfDate,
            fundManagerName: pfName,
            schemeName,
            aumCrore,
          })
        }
      }
    }
    if (parsedRows.length === 0) return { rowsImported: 0, error: 'No M1 rows parsed' }

    // Keep only the latest N months to keep sync fast and relevant.
    const distinctDates = Array.from(
      new Set(parsedRows.map((row) => row.asOfDate.getTime()))
    ).sort((a, b) => a - b)
    const monthsToKeep = Math.max(1, options.monthsToKeep ?? 36)
    const keepDateSet = new Set(distinctDates.slice(-monthsToKeep))

    const toWrite = parsedRows.filter((row) =>
      keepDateSet.has(row.asOfDate.getTime())
    )

    // Replace by month in bulk instead of row-by-row upserts (much faster on Vercel).
    for (const ts of keepDateSet) {
      const asOfDate = new Date(ts)
      await prisma.schemeAumHistory.deleteMany({ where: { asOfDate } })
      const monthRows = toWrite.filter((row) => row.asOfDate.getTime() === ts)
      if (monthRows.length > 0) {
        await prisma.schemeAumHistory.createMany({ data: monthRows })
      }
    }

    const latestTs = Math.max(...Array.from(keepDateSet))
    return {
      rowsImported: toWrite.length,
      latestAsOf: new Date(latestTs).toISOString().slice(0, 10),
    }
  } catch (err) {
    return {
      rowsImported: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
