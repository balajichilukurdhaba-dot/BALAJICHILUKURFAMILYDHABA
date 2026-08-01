const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Corn', mode: 'insensitive' } },
        { name: { contains: 'Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Baby', mode: 'insensitive' } },
        { name: { contains: 'Chilly', mode: 'insensitive' } },
        { name: { contains: 'Paneer', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 3 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
