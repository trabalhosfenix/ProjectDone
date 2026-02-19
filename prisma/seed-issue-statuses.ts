import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedIssueStatuses() {
  const defaultStatuses = [
    { label: "Aberta", color: "#3b82f6", isDefault: true, order: 1 },
    { label: "Em andamento", color: "#f59e0b", order: 2 },
    { label: "Em espera", color: "#6b7280", order: 3 },
    { label: "Resolvida", color: "#10b981", isFinal: true, order: 4 },
    { label: "Fechada", color: "#64748b", isFinal: true, order: 5 },
    { label: "Cancelada", color: "#ef4444", isFinal: true, order: 6 },
  ]

  console.log('🌱 Criando situações padrão de questões...')

  for (const status of defaultStatuses) {
    await prisma.issueStatus.upsert({
      where: { label: status.label },
      update: status,
      create: status
    })
    console.log(`✓ ${status.label}`)
  }

  console.log('✅ Situações criadas com sucesso!')
}

seedIssueStatuses()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
