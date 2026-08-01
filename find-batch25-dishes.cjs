const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Veg Korma', mode: 'insensitive' } },
        { name: { contains: 'Veg Kheema', mode: 'insensitive' } },
        { name: { contains: 'Veg Garlic', mode: 'insensitive' } },
        { name: { contains: 'Veg Do Pyaza', mode: 'insensitive' } },
        { name: { contains: 'Veg Kolhapuri', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 25 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
