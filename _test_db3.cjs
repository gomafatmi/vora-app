const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new (require("@prisma/client").PrismaClient)({ adapter });

  try {
    const [row] = await prisma.$queryRaw`SELECT current_database() as db, inet_server_port() as port`;
    console.log("DB:", row.db, "Port:", row.port);
  } catch (e) {
    console.error("Query error:", e.message);
    if (e.meta) console.error("Meta:", e.meta);
  }
  await prisma.$disconnect();
}
main();
