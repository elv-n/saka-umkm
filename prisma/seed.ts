import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("saka-admin-2026", 10);

  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
    },
  });

  console.log(`✅ Admin account ready: ${admin.username} (id: ${admin.id})`);

  // Set semua user existing yang masih PENDING ke APPROVED
  const { count } = await prisma.user.updateMany({
    where: { status: "PENDING" },
    data: { status: "APPROVED" },
  });

  if (count > 0) {
    console.log(`✅ ${count} existing user(s) set to APPROVED`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
