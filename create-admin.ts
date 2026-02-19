import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verifica se já existe admin
    const existing = await prisma.user.findUnique({
      where: { email: "admin@empresa.com" }
    });

    if (existing) {
      console.log("✅ Admin já existe!");
      console.log("Email:", existing.email);
      console.log("Nome:", existing.name);
      return;
    }

    // Cria o admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        email: "admin@empresa.com",
        name: "Administrador",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    console.log("✅ Admin criado com sucesso!");
    console.log("Email:", admin.email);
    console.log("Senha: admin123");
    
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
