import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    });

    console.log("\n📋 Usuários no banco de dados:\n");
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log("");
    });

    if (users.length === 0) {
      console.log("⚠️  Nenhum usuário encontrado no banco!");
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
