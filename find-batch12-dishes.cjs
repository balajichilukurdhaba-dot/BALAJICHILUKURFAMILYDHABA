const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Zilmil', mode: 'insensitive' } },
        { name: { contains: 'Tandoori Roti', mode: 'insensitive' } },
        { name: { contains: 'Butter Roti', mode: 'insensitive' } },
        { name: { contains: 'Kothmir', mode: 'insensitive' } },
        { name: { contains: 'Kothimeera', mode: 'insensitive' } },
        { name: { contains: 'Pudina', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 12 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
