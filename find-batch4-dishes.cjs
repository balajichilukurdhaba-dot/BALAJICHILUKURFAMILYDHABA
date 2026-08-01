const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Baby Corn', mode: 'insensitive' } },
        { name: { contains: 'Soya', mode: 'insensitive' } },
        { name: { contains: 'Paneer Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Schezwan', mode: 'insensitive' } },
        { name: { contains: 'Manchuria', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 4 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
