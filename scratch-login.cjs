const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_login_sessions (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      admin_email  TEXT NOT NULL,
      login_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      photo_base64 TEXT,
      latitude     DOUBLE PRECISION,
      longitude    DOUBLE PRECISION,
      ip_address   TEXT,
      user_agent   TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(
    `INSERT INTO admin_login_sessions (id, admin_email, photo_base64, latitude, longitude, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    require('crypto').randomUUID(),
    'admin@balajichilkur.com',
    null,
    17.3850,
    78.4867,
    '127.0.0.1',
    'Chrome / Windows'
  );

  console.log('Login session recorded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
