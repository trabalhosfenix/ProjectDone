const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function hasColumn(tableName, columnName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      LIMIT 1`,
    tableName,
    columnName,
  )

  return rows.length > 0
}

async function hasTable(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1`,
    tableName,
  )

  return rows.length > 0
}

async function ensureFallbackTenant() {
  const existing = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
  if (existing) return existing.id

  const defaultTenant = await prisma.tenant.create({
    data: {
      name: 'Conta Padrão',
      slug: `conta-padrao-${Date.now()}`,
      isActive: true,
    },
  })

  return defaultTenant.id
}

async function main() {
  console.log('[tenant-backfill] Iniciando preparação de dados legados para tenant obrigatório...')

  if (!(await hasTable('Tenant'))) {
    console.log('[tenant-backfill] Tabela Tenant ainda não existe. Nada a preparar neste passo.')
    return
  }

  const fallbackTenantId = await ensureFallbackTenant()
  console.log(`[tenant-backfill] Tenant fallback: ${fallbackTenantId}`)

  const nullableTenantTables = ['User', 'Role', 'Project', 'ProjectItem', 'ProjectMember', 'ImportedProject']

  for (const table of nullableTenantTables) {
    if (!(await hasTable(table)) || !(await hasColumn(table, 'tenantId'))) continue

    const affected = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
      fallbackTenantId,
    )

    if (affected > 0) {
      console.log(`[tenant-backfill] ${table}: ${affected} registro(s) atualizados com tenantId fallback.`)
    }
  }

  if (await hasTable('ProjectCanvas')) {
    const hasTenantId = await hasColumn('ProjectCanvas', 'tenantId')
    if (!hasTenantId) {
      await prisma.$executeRawUnsafe('ALTER TABLE "ProjectCanvas" ADD COLUMN "tenantId" TEXT')
      console.log('[tenant-backfill] Coluna ProjectCanvas.tenantId criada como nullable para backfill.')
    }

    const affectedCanvas = await prisma.$executeRawUnsafe(
      'UPDATE "ProjectCanvas" SET "tenantId" = $1 WHERE "tenantId" IS NULL',
      fallbackTenantId,
    )

    if (affectedCanvas > 0) {
      console.log(`[tenant-backfill] ProjectCanvas: ${affectedCanvas} registro(s) atualizados com tenantId fallback.`)
    }
  }

  console.log('[tenant-backfill] Preparação concluída.')
}

main()
  .catch((error) => {
    console.error('[tenant-backfill] Erro:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
