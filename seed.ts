import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// Simple initialization for Prisma 7 standalone script
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      email: "admin@empresa.com",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created successfully:", user.email);
  console.log("Password: admin123");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
