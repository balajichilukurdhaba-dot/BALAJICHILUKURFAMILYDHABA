const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Veg Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Wet Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Clear', mode: 'insensitive' } },
        { name: { contains: 'Stick', mode: 'insensitive' } },
        { name: { contains: '65', mode: 'insensitive' } },
        { name: { contains: 'Dragon', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 5 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
