/**
 * Fetch PFRDA M1 Excel from official URL and upsert into SchemeAumHistory.
 * No API keys; uses public download link only. Safe to run on a schedule.
 */
import { read, utils } from 'xlsx'
import { getLatestPfrdaUrls, PFRDA_URLS } from './pfrda-urls.mjs'

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
const MONTHS_TO_KEEP = 36

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
 * Fetch M1 from PFRDA, parse, and bulk-insert into DB. No credentials required.
 * Only keeps the latest MONTHS_TO_KEEP months of data.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ url?: string, monthsToKeep?: number }} [opts]
 * @returns {{ rowsImported: number, latestAsOf?: string, error?: string }}
 */
export async function syncM1FromPfrda(prisma, opts = {}) {
  try {
    let m1Url = opts.url
    if (!m1Url) {
      const urls = await getLatestPfrdaUrls()
      m1Url = urls.M1
    }

    const res = await fetch(m1Url, {
      headers: {
        'User-Agent': 'PensionDashboard/1.0 (Internal; data refresh)',
      },
    })
    if (!res.ok) {
      return {
        rowsImported: 0,
        error: 'PFRDA returned ' + res.status + ' ' + res.statusText,
      }
    }
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = read(buffer, { type: 'buffer' })
    const sheetName =
      workbook.SheetNames.find((n) =>
        ['Formatted Report', 'Sheet1', 'Data', 'AUM', 'Report'].includes(n)
      ) ?? workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return { rowsImported: 0, error: 'No sheet found in workbook. Sheets: ' + workbook.SheetNames.join(', ') }
    }

    const data = utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })

    // Parse all rows, grouped by month
    const monthMap = new Map()
    let latestDate = null

    for (let r = DATA_START_ROW; r < data.length; r++) {
      const row = data[r]
      if (!row || !row[DATE_COL]) continue
      const asOfDate = parseMonthYear(String(row[DATE_COL]))
      if (!asOfDate) continue

      const monthKey = asOfDate.toISOString()
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { date: asOfDate, records: [] })

      if (!latestDate || asOfDate > latestDate) latestDate = asOfDate

      const bucket = monthMap.get(monthKey)
      for (let p = 0; p < PF_START_COLS.length; p++) {
        const pfName = PF_NAMES[p]
        const startCol = PF_START_COLS[p]
        for (let s = 0; s < SCHEME_NAMES.length; s++) {
          const schemeName = SCHEME_NAMES[s]
          const col = startCol + s
          const val = row[col]
          const aumCrore = toNumber(val)
          if (aumCrore === null) continue
          bucket.records.push({ asOfDate, fundManagerName: pfName, schemeName, aumCrore })
        }
      }
    }

    // Keep only the latest N months
    const keep = opts.monthsToKeep ?? MONTHS_TO_KEEP
    const sortedMonths = Array.from(monthMap.keys()).sort().reverse().slice(0, keep)
    const keepSet = new Set(sortedMonths)

    // Delete old data and bulk-insert new data, month by month
    let imported = 0
    for (const [monthKey, bucket] of monthMap.entries()) {
      if (!keepSet.has(monthKey)) continue
      const { date, records } = bucket
      if (records.length === 0) continue

      await prisma.schemeAumHistory.deleteMany({ where: { asOfDate: date } })
      await prisma.schemeAumHistory.createMany({ data: records })
      imported += records.length
    }

    // Delete months outside the keep window
    if (latestDate) {
      const cutoff = new Date(latestDate)
      cutoff.setMonth(cutoff.getMonth() - keep)
      await prisma.schemeAumHistory.deleteMany({ where: { asOfDate: { lt: cutoff } } })
    }

    const latestAsOf = latestDate ? latestDate.toISOString().slice(0, 10) : undefined
    return { rowsImported: imported, latestAsOf }
  } catch (err) {
    return {
      rowsImported: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
