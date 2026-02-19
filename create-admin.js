
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@empresa.com' },
      update: {},
      create: {
        email: 'admin@empresa.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        company: 'Empresa Padrão'
      },
    })
    console.log('Admin user created:', user)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
