const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Drink', mode: 'insensitive' } },
        { name: { contains: 'Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Cold', mode: 'insensitive' } },
        { name: { contains: 'Water', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- ALL DRINKS & COMBOS IN DB ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
