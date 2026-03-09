import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  console.log('Seeding database with sample pension data...')

  // Clear existing data to avoid duplicates
  await prisma.pensionScheme.deleteMany()
  await prisma.pensionFundManager.deleteMany()

  // Sample pension fund managers
  await prisma.pensionFundManager.createMany({
    data: [
      {
        id: 1,
        name: 'ABC Pension Fund Management Co.',
        aum: 52000,
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      {
        id: 2,
        name: 'XYZ Retirement Trust',
        aum: 31000,
        city: 'Bengaluru',
        state: 'Karnataka',
      },
      {
        id: 3,
        name: 'National Pension Fund Corp.',
        aum: 45000,
        city: 'New Delhi',
        state: 'Delhi',
      },
    ],
  })

  // Sample pension schemes
  await prisma.pensionScheme.createMany({
    data: [
      {
        id: 1,
        name: 'NPS Equity Scheme - Tier I',
        managerId: 1,
        category: 'NPS',
        riskLevel: 'High',
        aum: 18000,
        isActive: true,
      },
      {
        id: 2,
        name: 'NPS Corporate Debt Scheme',
        managerId: 1,
        category: 'NPS',
        riskLevel: 'Medium',
        aum: 22000,
        isActive: true,
      },
      {
        id: 3,
        name: 'Government Pension Scheme A',
        managerId: 2,
        category: 'Government',
        riskLevel: 'Low',
        aum: 15000,
        isActive: true,
      },
      {
        id: 4,
        name: 'EPF Long-Term Growth Fund',
        managerId: 3,
        category: 'EPF',
        riskLevel: 'Medium',
        aum: 27000,
        isActive: true,
      },
    ],
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
