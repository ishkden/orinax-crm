import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Дефолтный workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "orinax" },
    update: {},
    create: {
      name: "Orinax",
      slug: "orinax",
    },
  });
  console.log(`✅ Workspace ready: ${workspace.name} (${workspace.slug})`);

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

  // Привязываем admin к workspace (если ещё не привязан)
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: admin.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });
  console.log("✅ Admin linked to workspace as OWNER");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
