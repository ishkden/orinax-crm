import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@orinax.ai" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin2024!", 12);
    await prisma.user.create({
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
