import XLSX from 'xlsx'
import fs from 'node:fs'

const path = process.argv[2] || '/Users/Experiments/Downloads/M1_PF-wise and Scheme-wise Asset Under Management.xlsx'
const workbook = XLSX.readFile(path)
const sheet = workbook.Sheets['Formatted Report']
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

// Row 1 = PF names, Row 2 = scheme names
const row1 = data[1]
const row2 = data[2]

console.log('Row 1 (PF names) - non-empty with index:')
row1.forEach((cell, i) => { if (cell && String(cell).trim()) console.log(i, String(cell).trim()) })

console.log('\nRow 2 (scheme names) - first 80 columns with index:')
row2.slice(0, 80).forEach((cell, i) => { if (cell && String(cell).trim()) console.log(i, String(cell).trim()) })

// Find blocks: row1 has PF at some column, then next PF at column + N. Row2 repeats scheme names per block.
const pfStarts = []
for (let i = 0; i < row1.length; i++) {
  const v = String(row1[i] || '').trim()
  if (v && (v.endsWith(' PF') || v === 'LIC PF' || v === 'SBI PF')) pfStarts.push({ col: i, name: v })
}
console.log('\nPF start columns:', pfStarts)

// Row 2: first block of scheme names (until we hit duplicate or empty)
const schemeNames = []
const seen = new Set()
for (let i = 1; i < row2.length; i++) {
  const v = String(row2[i] || '').trim()
  if (!v) continue
  if (seen.has(v)) break
  seen.add(v)
  schemeNames.push(v)
}
console.log('\nScheme names (first block):', schemeNames)
