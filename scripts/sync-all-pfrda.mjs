/**
 * Fetch all PFRDA data from official URLs and update the DB. No file uploads.
 * - M1: PF-wise AUM (fund manager leaderboard)
 * - A22, A6, M7: State-wise subscribers, gender, age, SG contribution
 *
 * Usage: node scripts/sync-all-pfrda.mjs
 * Or: npm run sync:all
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { syncM1FromPfrda } from '../lib/pfrda-m1-sync.mjs'
import { PFRDA_URLS, fetchPfrdaExcel } from '../lib/pfrda-urls.mjs'
import { runStateWiseImport } from './import-state-wise-pfrda.mjs'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

async function main() {
  console.log('Syncing from PFRDA (no uploads)...')

  // 1) M1 – fund manager / scheme AUM
  console.log('Fetching M1...')
  const m1Result = await syncM1FromPfrda(prisma)
  if (m1Result.error) {
    console.error('M1 sync failed:', m1Result.error)
    process.exit(1)
  }
  console.log('M1 done. Rows:', m1Result.rowsImported)

  // 2) A22, A6, M7 – state-wise
  console.log('Fetching A22, A6, M7...')
  const [a22Buf, a6Buf, m7Buf] = await Promise.all([
    fetchPfrdaExcel(PFRDA_URLS.A22),
    fetchPfrdaExcel(PFRDA_URLS.A6),
    fetchPfrdaExcel(PFRDA_URLS.M7),
  ])
  const stateResult = await runStateWiseImport(prisma, {
    a22: a22Buf,
    a6: a6Buf,
    m7: m7Buf,
  })
  console.log('State-wise done. Upserted:', stateResult.upserted, 'M7 month:', stateResult.m7LatestMonth ?? '—')

  console.log('Sync complete.')
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
