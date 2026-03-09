import XLSX from 'xlsx'
import fs from 'node:fs'

const path = process.argv[2] || '/Users/Experiments/Downloads/M1_PF-wise and Scheme-wise Asset Under Management.xlsx'

if (!fs.existsSync(path)) {
  console.error('File not found:', path)
  process.exit(1)
}

const workbook = XLSX.readFile(path)
console.log('Sheet names:', workbook.SheetNames)

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  console.log('\n--- Sheet:', name, '---')
  console.log('Total rows:', data.length)
  if (data.length > 0) {
    console.log('First row (headers):', JSON.stringify(data[0], null, 0))
    console.log('Next 5 rows (sample):')
    for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
      console.log(JSON.stringify(data[i], null, 0))
    }
  }
}
