/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function normalizeTaskStatus(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (!value) return 'A iniciar'

  if (value.includes('concl') || value.includes('done') || value.includes('completed')) return 'Concluído'
  if (value.includes('andamento') || value.includes('progress') || value.includes('doing')) return 'Em andamento'
  if (value.includes('wait') || value.includes('atras') || value.includes('delay') || value.includes('block')) return 'Em espera'

  return 'A iniciar'
}

function startOfDay(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d, days) {
  const date = new Date(d)
  date.setDate(date.getDate() + days)
  return date
}

async function main() {
  const items = await prisma.projectItem.findMany({
    where: {
      originSheet: 'KANBAN',
      OR: [
        { datePlanned: null },
        { datePlannedEnd: null },
      ],
    },
    select: {
      id: true,
      status: true,
      datePlanned: true,
      datePlannedEnd: true,
      metadata: true,
    },
  })

  if (!items.length) {
    console.log('Nenhum item legado de Kanban para normalizar.')
    return
  }

  let updated = 0
  for (const item of items) {
    const plannedStart = item.datePlanned || startOfDay(new Date())
    const plannedEnd = item.datePlannedEnd || addDays(plannedStart, 7)
    const metadata = Object.assign({}, item.metadata || {}, { needsScheduling: true, normalizedAt: new Date().toISOString() })

    await prisma.projectItem.update({
      where: { id: item.id },
      data: {
        status: normalizeTaskStatus(item.status),
        datePlanned: plannedStart,
        datePlannedEnd: plannedEnd,
        metadata,
      },
    })
    updated += 1
  }

  console.log(`Itens normalizados: ${updated}`)
}

main()
  .catch((error) => {
    console.error('Falha ao normalizar itens Kanban:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
