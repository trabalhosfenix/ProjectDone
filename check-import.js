
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTasks() {
  try {
    const count = await prisma.projectItem.count()
    console.log(`Total de tarefas no banco: ${count}`)
    
    const details = await prisma.projectItem.findMany({
      take: 3,
      select: { task: true, datePlanned: true, dateActual: true, status: true }
    })
    console.log('Exemplos:', details)
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

checkTasks()
