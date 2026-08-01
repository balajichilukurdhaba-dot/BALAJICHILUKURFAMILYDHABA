const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Punjabi Pulao', mode: 'insensitive' } },
        { name: { contains: 'Navratan Pulao', mode: 'insensitive' } },
        { name: { contains: 'Veg Jaipuri', mode: 'insensitive' } },
        { name: { contains: 'Gobhi Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Gobi Manchuria', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 34 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
