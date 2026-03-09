import 'dotenv/config'
import fs from 'node:fs'
import readline from 'node:readline'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.error(
      'Usage: node scripts/import-scheme-aum-from-csv.mjs <path-to-csv>'
    )
    process.exit(1)
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at path: ${csvPath}`)
    process.exit(1)
  }

  console.log(`Importing Scheme AUM history from: ${csvPath}`)

  const stream = fs.createReadStream(csvPath, { encoding: 'utf-8' })
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  })

  let isHeader = true
  let imported = 0

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip header row
    if (isHeader) {
      isHeader = false
      continue
    }

    const [asOfDateStr, fundManagerNameRaw, schemeNameRaw, aumStr, subsStr] =
      trimmed.split(',')

    if (!asOfDateStr || !fundManagerNameRaw || !schemeNameRaw) {
      console.warn('Skipping row with missing required fields:', line)
      continue
    }

    const asOfDate = new Date(asOfDateStr)
    if (Number.isNaN(asOfDate.getTime())) {
      console.warn('Skipping row with invalid date:', asOfDateStr)
      continue
    }

    const fundManagerName = fundManagerNameRaw.trim()
    const schemeName = schemeNameRaw.trim()
    const aumCrore = aumStr ? Number.parseFloat(aumStr) : null
    const subscribers = subsStr ? Number.parseInt(subsStr, 10) : null

    await prisma.schemeAumHistory.upsert({
      where: {
        asOfDate_fundManagerName_schemeName: {
          asOfDate,
          fundManagerName,
          schemeName,
        },
      },
      update: {
        aumCrore,
        subscribers,
      },
      create: {
        asOfDate,
        fundManagerName,
        schemeName,
        aumCrore,
        subscribers,
      },
    })

    imported += 1
  }

  console.log(`Import finished. Imported or updated ${imported} rows.`)
}

main()
  .catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

