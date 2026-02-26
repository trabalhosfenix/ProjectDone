const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureTenant() {
  const tenantName = process.env.BOOTSTRAP_TENANT_NAME || "Conta Principal";
  const tenantSlug = process.env.BOOTSTRAP_TENANT_SLUG || slugify(tenantName) || "conta-principal";

  let tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        isActive: true,
      },
      select: { id: true, name: true, slug: true },
    });
    console.log(`[bootstrap-admin] Tenant criado: ${tenant.slug}`);
  } else {
    console.log(`[bootstrap-admin] Tenant já existe: ${tenant.slug}`);
  }

  return tenant;
}

async function ensureAdmin(tenant) {
  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@empresa.com").trim().toLowerCase();
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "Administrador";
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123";
  const resetPassword = process.env.ALLOW_BOOTSTRAP_ADMIN_RESET_PASSWORD === "true";
  const uniqueTenantEmail = {
    tenantId_email: {
      tenantId: tenant.id,
      email: adminEmail,
    },
  };

  const existingAdmin = await prisma.user.findUnique({
    where: uniqueTenantEmail,
    select: { id: true, email: true, tenantId: true },
  });

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: "ADMIN",
        tenantId: tenant.id,
      },
    });

    console.log(`[bootstrap-admin] Admin criado: ${adminEmail}`);
    return;
  }

  const updateData = {
    name: adminName,
    role: "ADMIN",
    tenantId: tenant.id,
  };

  if (resetPassword) {
    updateData.password = hashedPassword;
  }

  await prisma.user.update({
    where: uniqueTenantEmail,
    data: updateData,
  });

  console.log(
    `[bootstrap-admin] Admin atualizado: ${adminEmail}${resetPassword ? " (senha redefinida)" : ""}`
  );
}

async function main() {
  const tenant = await ensureTenant();
  await ensureAdmin(tenant);
}

main()
  .catch((error) => {
    console.error("[bootstrap-admin] Falha no bootstrap:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
