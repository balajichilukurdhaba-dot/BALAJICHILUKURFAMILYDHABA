const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Cold Drinks', mode: 'insensitive' } },
        { name: { contains: 'Mineral Water', mode: 'insensitive' } },
        { name: { contains: 'Combo', mode: 'insensitive' } },
        { name: { contains: 'Garlic', mode: 'insensitive' } },
        { name: { contains: 'Plain Naan', mode: 'insensitive' } },
        { name: { contains: 'Naan', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 20 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
