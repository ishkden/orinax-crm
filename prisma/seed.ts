import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Дефолтная Org (seed-запись; externalId должен совпадать с ID из SSO)
  const org = await prisma.org.upsert({
    where: { slug: "orinax" },
    update: {},
    create: {
      externalId: "seed-orinax",
      name: "Orinax",
      slug: "orinax",
    },
  });
  console.log(`✅ Org ready: ${org.name} (${org.slug})`);

  // Admin user
  let admin = await prisma.user.findUnique({
    where: { email: "admin@orinax.ai" },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash("Admin2024!", 12);
    admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@orinax.ai",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("✅ Admin user created: admin@orinax.ai / Admin2024!");
  } else {
    console.log("⚡ Admin user already exists");
  }

  // Привязываем admin к org (если ещё не привязан)
  await prisma.orgMember.upsert({
    where: {
      userId_orgId: {
        userId: admin.id,
        orgId: org.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      orgId: org.id,
      role: "OWNER",
    },
  });
  console.log("✅ Admin linked to org as OWNER");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
