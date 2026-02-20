const fs = require('node:fs')

const filePath = 'src/lib/mpp-api.ts'
const source = fs.readFileSync(filePath, 'utf8')

const checks = [
  { label: 'DEFAULT_MPP_API_BASE_URLS', regex: /^const DEFAULT_MPP_API_BASE_URLS\s*=\s*\[/gm },
  { label: 'getMppApiBaseUrls', regex: /^export function getMppApiBaseUrls\(/gm },
  { label: 'withTimeoutSignal', regex: /^function withTimeoutSignal\(/gm },
  { label: 'mppFetchRaw', regex: /^export async function mppFetchRaw\(/gm },
]

const failures = []

for (const check of checks) {
  const count = (source.match(check.regex) || []).length
  if (count !== 1) {
    failures.push(`${check.label}: esperado 1 declaração, encontrado ${count}`)
  }
}

if (failures.length > 0) {
  console.error(`[check-mpp-api] Falha em ${filePath}`)
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`[check-mpp-api] OK: ${filePath}`)
