const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: '65', mode: 'insensitive' } },
        { name: { contains: 'Aloo', mode: 'insensitive' } },
        { name: { contains: 'Gobhi', mode: 'insensitive' } },
        { name: { contains: 'Gobi', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 9 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
