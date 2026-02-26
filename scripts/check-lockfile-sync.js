#!/usr/bin/env node
const fs = require('fs')

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function normalizeDeps(deps = {}) {
  return Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b)))
}

function diffKeys(source, target) {
  const missing = []
  for (const key of Object.keys(source)) {
    if (!(key in target)) missing.push(key)
  }
  return missing
}

try {
  const pkg = readJson('package.json')
  const lock = readJson('package-lock.json')
  const root = lock?.packages?.['']

  if (!root) {
    console.error('❌ package-lock.json inválido: entrada packages[""] não encontrada.')
    process.exit(1)
  }

  const pkgDeps = normalizeDeps(pkg.dependencies)
  const pkgDevDeps = normalizeDeps(pkg.devDependencies)
  const lockDeps = normalizeDeps(root.dependencies)
  const lockDevDeps = normalizeDeps(root.devDependencies)

  const missingDeps = diffKeys(pkgDeps, lockDeps)
  const missingDevDeps = diffKeys(pkgDevDeps, lockDevDeps)

  if (missingDeps.length || missingDevDeps.length) {
    console.error('❌ Lockfile fora de sincronia com package.json')
    if (missingDeps.length) {
      console.error(`- Dependências ausentes no lock: ${missingDeps.join(', ')}`)
    }
    if (missingDevDeps.length) {
      console.error(`- DevDependencies ausentes no lock: ${missingDevDeps.join(', ')}`)
    }
    process.exit(1)
  }

  console.log('✅ package.json e package-lock.json estão sincronizados (chaves de dependência).')
} catch (error) {
  console.error('❌ Falha ao validar lockfile:', error.message)
  process.exit(1)
}
