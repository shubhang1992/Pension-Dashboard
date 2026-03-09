/**
 * Import state-wise subscriber data from PFRDA Excel files:
 * - A22: State-wise and Age-wise enrollments under NPS All Citizen (latest year + age breakdown)
 * - A6:  State-wise Gender-wise enrollments under APY (Grand Total + Female/Male/Transgender)
 * - M7:  State-wise Subscribers and Contribution under SG Sector (contribution in ₹ Cr)
 *
 * Usage: node scripts/import-state-wise-pfrda.mjs [pathToA22] [pathToA6] [pathToM7]
 */
import 'dotenv/config'
import { read, utils } from 'xlsx'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { PFRDA_URLS, fetchPfrdaExcel } from '../lib/pfrda-urls.mjs'

const prisma = new PrismaClient()

const DEFAULT_AS_OF_DATE = new Date('2025-03-31') // end of FY 2024-25

function toNum(val) {
  if (val === null || val === undefined || val === '' || val === '-') return 0
  const n = Number(String(val).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** @param {string|Buffer} input - file path or buffer */
function toBuffer(input) {
  return typeof input === 'string' ? readFileSync(input) : input
}

function findFile(dir, prefix) {
  try {
    const fs = require('fs')
    const names = fs.readdirSync(dir)
    const f = names.find((n) => n.startsWith(prefix) && n.endsWith('.xlsx'))
    return f ? join(dir, f) : null
  } catch {
    return null
  }
}

/** Returns { byState: { state: total }, ageByState: { state: { "18-20": n, ... } } } */
function parseA22(pathOrBuffer) {
  const wb = read(toBuffer(pathOrBuffer), { type: 'buffer' })
  const sh = wb.Sheets[wb.SheetNames[0]]
  const rows = utils.sheet_to_json(sh, { header: 1, defval: '' })
  if (rows.length < 4) return { byState: {}, ageByState: {} }
  const row1 = rows[1]
  const row2 = rows[2]
  const yearLabel = '2024-25'
  let startCol = row1.findIndex((c) => String(c).includes(yearLabel))
  if (startCol === -1) startCol = Math.max(0, row1.length - 11)
  const endCol = Math.min(startCol + 11, row1.length)
  const ageBandNames = ['18-20', '21-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51-55', '56-60', 'Above 60']
  const byState = {}
  const ageByState = {}
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r]
    const state = String(row[0] || '').trim()
    if (!state || state === 'Total' || state === '') continue
    let sum = 0
    const ageBreakdown = {}
    for (let c = startCol; c < endCol; c++) {
      const n = toNum(row[c])
      sum += n
      const band = row2[c] ? String(row2[c]).replace(/\s*Years?\s*$/i, '').trim() : null
      const key = ageBandNames[c - startCol] ?? band ?? `col${c}`
      ageBreakdown[key] = (ageBreakdown[key] ?? 0) + n
    }
    byState[state] = (byState[state] || 0) + sum
    ageByState[state] = ageBreakdown
  }
  return { byState, ageByState }
}

/** Returns { byState: { state: total }, genderByState: { state: { female, male, transgender } } } */
function parseA6(pathOrBuffer) {
  const wb = read(toBuffer(pathOrBuffer), { type: 'buffer' })
  const sh = wb.Sheets[wb.SheetNames[0]]
  const rows = utils.sheet_to_json(sh, { header: 1, defval: '' })
  if (rows.length < 4) return { byState: {}, genderByState: {} }
  const row1 = rows[1]
  const row2 = rows[2]
  const grandTotalIdx = row1.findIndex((c) => String(c).includes('Grand Total'))
  const totalCol = grandTotalIdx >= 0 ? grandTotalIdx : row1.length - 1
  const yearLabel = '2024-2025'
  let yearCol = row1.findIndex((c) => String(c).includes(yearLabel))
  if (yearCol === -1) yearCol = row1.findIndex((c) => String(c).includes('2024-2025'))
  if (yearCol === -1) yearCol = 28
  const byState = {}
  const genderByState = {}
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r]
    const state = String(row[0] || '').trim()
    if (!state || state === 'Total' || state === '') continue
    byState[state] = toNum(row[totalCol])
    const female = toNum(row[yearCol])
    const male = toNum(row[yearCol + 1])
    const transgender = toNum(row[yearCol + 2])
    genderByState[state] = { female, male, transgender }
  }
  return { byState, genderByState }
}

/**
 * Parse M7: State-wise Subscribers and Contribution under SG Sector.
 * Returns { byState: { stateName: { contributionCroreTotal, contributionCroreLatest, subscribersLatest } }, latestMonth }.
 * - contributionCroreTotal: sum of all "Total Contribution Cr" columns for that state (since Dec-2014).
 * - contributionCroreLatest: latest month "Total Contribution Cr".
 * - subscribersLatest: latest month subscribers.
 */
function parseM7(pathOrBuffer) {
  const wb = read(toBuffer(pathOrBuffer), { type: 'buffer' })
  const sh = wb.Sheets[wb.SheetNames[0]]
  const rows = utils.sheet_to_json(sh, { header: 1, defval: '' })
  if (rows.length < 5) return { byState: {}, latestMonth: null }
  const row1 = rows[1]
  const row2 = rows[2]
  const contribCols = []
  for (let c = 0; c < row2.length; c++) {
    if (String(row2[c]).includes('Total Contribution Cr')) contribCols.push(c)
  }
  if (!contribCols.length) return { byState: {}, latestMonth: null }
  const latestTotalCol = contribCols[contribCols.length - 1]
  const latestSubsCol = latestTotalCol - 1
  const latestMonth = row1[latestSubsCol] || row1[latestTotalCol] || null
  const byState = {}
  for (let r = 4; r < rows.length; r++) {
    const row = rows[r]
    const state = String(row[0] || '').trim()
    if (!state || state === 'Total') continue
    let totalContribution = 0
    const history = {}
    for (const col of contribCols) {
      const v = toNum(row[col])
      totalContribution += v
      const monthLabel = row1[col - 1] || row1[col] || `col${col}`
      if (v > 0) {
        history[monthLabel] = (history[monthLabel] ?? 0) + v
      }
    }
    const contributionCroreLatest = toNum(row[latestTotalCol])
    const subscribersLatest = Math.floor(toNum(row[latestSubsCol]))
    byState[state] = {
      contributionCroreTotal: totalContribution,
      contributionCroreLatest,
      subscribersLatest,
      history,
    }
  }
  return { byState, latestMonth }
}

/**
 * Run state-wise import from file paths or buffers. Used by CLI and by sync-all.
 * @param {import('@prisma/client').PrismaClient} prismaClient
 * @param {{ a22: string|Buffer, a6: string|Buffer, m7?: string|Buffer|null }} options
 * @returns {{ upserted: number, m7LatestMonth: string|null }}
 */
export async function runStateWiseImport(prismaClient, { a22, a6, m7 = null }) {
  const prisma = prismaClient
  const { byState: npsByState, ageByState } = parseA22(a22)
  const { byState: apyByState, genderByState } = parseA6(a6)
  let m7ByState = {}
  let m7LatestMonth = null
  if (m7) {
    const m7Parsed = parseM7(m7)
    m7ByState = m7Parsed.byState
    m7LatestMonth = m7Parsed.latestMonth
  }
  const allStates = new Set([...Object.keys(npsByState), ...Object.keys(apyByState)])

  let upserted = 0
  for (const stateName of allStates) {
    const nps = npsByState[stateName] || 0
    const apy = apyByState[stateName] || 0
    const subscribers = nps + apy
    const gender = genderByState[stateName] || {}
    const ageBreakdown = ageByState[stateName] || null
    if (subscribers <= 0 && !gender.female && !gender.male && !gender.transgender) continue
    const m7 = m7ByState[stateName]
    const contributionCrore =
      m7 && m7.contributionCroreTotal > 0 ? m7.contributionCroreTotal : undefined
    await prisma.stateWiseSnapshot.upsert({
      where: {
        stateName_asOfDate: { stateName, asOfDate: DEFAULT_AS_OF_DATE },
      },
      create: {
        stateName,
        asOfDate: DEFAULT_AS_OF_DATE,
        subscribers: subscribers || null,
        contributionCrore: contributionCrore ?? undefined,
        contributionHistory:
          m7 && m7.history && Object.keys(m7.history).length
            ? m7.history
            : undefined,
        genderFemale: gender.female || null,
        genderMale: gender.male || null,
        genderTransgender: gender.transgender || null,
        ageBreakdown: ageBreakdown && Object.keys(ageBreakdown).length ? ageBreakdown : undefined,
      },
      update: {
        subscribers: subscribers || null,
        ...(contributionCrore !== undefined && { contributionCrore }),
        ...(m7 &&
          m7.history &&
          Object.keys(m7.history).length && { contributionHistory: m7.history }),
        genderFemale: gender.female || null,
        genderMale: gender.male || null,
        genderTransgender: gender.transgender || null,
        ageBreakdown: ageBreakdown && Object.keys(ageBreakdown).length ? ageBreakdown : undefined,
      },
    })
    upserted++
  }
  if (Object.keys(m7ByState).length > 0) {
    for (const stateName of Object.keys(m7ByState)) {
      if (allStates.has(stateName)) continue
      const m7 = m7ByState[stateName]
      if (!m7 || m7.contributionCroreTotal <= 0) continue
      await prisma.stateWiseSnapshot.upsert({
        where: {
          stateName_asOfDate: { stateName, asOfDate: DEFAULT_AS_OF_DATE },
        },
        create: {
          stateName,
          asOfDate: DEFAULT_AS_OF_DATE,
          contributionCrore: m7.contributionCroreTotal,
          contributionHistory:
            m7.history && Object.keys(m7.history).length ? m7.history : undefined,
        },
        update: {
          contributionCrore: m7.contributionCroreTotal,
          ...(m7.history &&
            Object.keys(m7.history).length && {
              contributionHistory: m7.history,
            }),
        },
      })
      upserted++
    }
  }
  return { upserted, m7LatestMonth }
}

async function main() {
  const args = process.argv.slice(2)
  const dir = process.cwd()
  const downloads = join(process.env.HOME || '', 'Downloads')
  const a22Path =
    args[0] ||
    findFile(dir, 'A22') ||
    findFile(downloads, 'A22') ||
    join(downloads, 'A22 State-wise and Age-wise enrollments under NPS All Citizen.xlsx')
  const a6Path =
    args[1] ||
    findFile(dir, 'A6') ||
    findFile(downloads, 'A6') ||
    join(downloads, 'A6 State-wise Gender-wise enrollments under APY.xlsx')
  const m7Path =
    args[2] ||
    findFile(dir, 'M7') ||
    findFile(downloads, 'M7') ||
    join(downloads, 'M7_State-wise Subscribers and Contribution under SG Sector.xlsx')

  // Prefer local Excel files if present; otherwise fall back to PFRDA URLs.
  let a22Input = a22Path
  let a6Input = a6Path
  let m7Input = existsSync(m7Path) ? m7Path : null

  if (!existsSync(a22Path)) {
    console.log('A22 file not found locally. Fetching from PFRDA…')
    a22Input = await fetchPfrdaExcel(PFRDA_URLS.A22)
  } else {
    console.log('Reading A22 from file:', a22Path)
  }

  if (!existsSync(a6Path)) {
    console.log('A6 file not found locally. Fetching from PFRDA…')
    a6Input = await fetchPfrdaExcel(PFRDA_URLS.A6)
  } else {
    console.log('Reading A6 from file:', a6Path)
  }

  if (!m7Input) {
    console.log('M7 file not found locally. Fetching from PFRDA…')
    m7Input = await fetchPfrdaExcel(PFRDA_URLS.M7)
  } else {
    console.log('Reading M7 (SG sector) from file:', m7Path)
  }

  const { upserted, m7LatestMonth } = await runStateWiseImport(prisma, {
    a22: a22Input,
    a6: a6Input,
    m7: m7Input,
  })
  console.log('Upserted', upserted, 'state-wise snapshots (as of', DEFAULT_AS_OF_DATE.toISOString().slice(0, 10), ')')
  if (m7LatestMonth) console.log('SG contribution from M7 month:', m7LatestMonth)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
