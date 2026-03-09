/**
 * Fetch M1 from PFRDA and sync to DB. No uploads; no API keys.
 * Usage: node scripts/sync-pfrda-m1.mjs
 * Or: npm run sync:pfrda
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { syncM1FromPfrda } from '../lib/pfrda-m1-sync.mjs'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

async function main() {
  console.log('Fetching M1 from PFRDA...')
  const result = await syncM1FromPfrda(prisma)
  if (result.error) {
    console.error('Sync failed:', result.error)
    process.exit(1)
  }
  console.log('Sync done. Rows imported/updated:', result.rowsImported)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
