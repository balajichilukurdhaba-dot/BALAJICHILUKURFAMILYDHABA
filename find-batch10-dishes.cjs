const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Baby Corn 65', mode: 'insensitive' } },
        { name: { contains: 'Mushroom 65', mode: 'insensitive' } },
        { name: { contains: 'Kundan', mode: 'insensitive' } },
        { name: { contains: 'Methi', mode: 'insensitive' } },
        { name: { contains: 'Sangai', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 10 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
