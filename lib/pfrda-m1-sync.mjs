/**
 * Fetch PFRDA M1 Excel from official URL and upsert into SchemeAumHistory.
 * No API keys; uses public download link only. Safe to run on a schedule.
 */
import { read, utils } from 'xlsx'

const M1_URL =
  'https://pfrda.org.in/documents/33652/202496/M1_PF-wise%20and%20Scheme-wise%20Asset%20Under%20Management.xlsx?v=15.0'

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
 * @returns {{ rowsImported: number, error?: string }}
 */
export async function syncM1FromPfrda(prisma) {
  try {
    const res = await fetch(M1_URL, {
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
    let imported = 0

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

          await prisma.schemeAumHistory.upsert({
            where: {
              asOfDate_fundManagerName_schemeName: {
                asOfDate,
                fundManagerName: pfName,
                schemeName,
              },
            },
            update: { aumCrore },
            create: {
              asOfDate,
              fundManagerName: pfName,
              schemeName,
              aumCrore,
            },
          })
          imported++
        }
      }
    }

    return { rowsImported: imported }
  } catch (err) {
    return {
      rowsImported: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
