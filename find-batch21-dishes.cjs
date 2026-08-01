const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Butter Naan', mode: 'insensitive' } },
        { name: { contains: 'Kothmir', mode: 'insensitive' } },
        { name: { contains: 'Pudina', mode: 'insensitive' } },
        { name: { contains: 'Baby Naan', mode: 'insensitive' } },
        { name: { contains: 'Kashmiri', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 21 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
