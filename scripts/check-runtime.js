#!/usr/bin/env node
const fs = require('fs')

const expectedNode = fs.readFileSync('.nvmrc', 'utf8').trim()
const currentNode = process.versions.node

function major(version) {
  return String(version).split('.')[0]
}

if (major(expectedNode) !== major(currentNode)) {
  console.error(`❌ Versão de Node incompatível. Esperado major ${major(expectedNode)} (arquivo .nvmrc=${expectedNode}), atual=${currentNode}`)
  process.exit(1)
}

console.log(`✅ Runtime Node compatível. Esperado .nvmrc=${expectedNode}, atual=${currentNode}`)
