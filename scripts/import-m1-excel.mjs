/**
 * Import PFRDA M1 Excel "PF-wise and Scheme-wise Asset Under Management"
 * into SchemeAumHistory. No API keys; reads local file only.
 *
 * Usage: node scripts/import-m1-excel.mjs <path-to-M1.xlsx>
 */
import 'dotenv/config'
import fs from 'node:fs'
import XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

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
  if (val === null || val === undefined || val === '' || val === '-') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

async function main() {
  const xlsxPath = process.argv[2]
  if (!xlsxPath) {
    console.error('Usage: node scripts/import-m1-excel.mjs <path-to-M1.xlsx>')
    process.exit(1)
  }
  if (!fs.existsSync(xlsxPath)) {
    console.error('File not found:', xlsxPath)
    process.exit(1)
  }

  console.log('Reading M1 Excel:', xlsxPath)
  const workbook = XLSX.readFile(xlsxPath)
  const sheet = workbook.Sheets['Formatted Report']
  if (!sheet) {
    console.error('Sheet "Formatted Report" not found.')
    process.exit(1)
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  let imported = 0
  let skipped = 0

  for (let r = DATA_START_ROW; r < data.length; r++) {
    const row = data[r]
    if (!row || !row[DATE_COL]) continue

    const asOfDate = parseMonthYear(String(row[DATE_COL]))
    if (!asOfDate) {
      skipped++
      continue
    }

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

  console.log('Import finished. Rows imported/updated:', imported)
  if (skipped) console.log('Rows skipped (invalid date):', skipped)
}

main()
  .catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
