const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Kasha', mode: 'insensitive' } },
        { name: { contains: 'Zil', mode: 'insensitive' } },
        { name: { contains: 'Mandakini', mode: 'insensitive' } },
        { name: { contains: 'Kandhari', mode: 'insensitive' } },
        { name: { contains: 'Kandari', mode: 'insensitive' } },
        { name: { contains: 'Haryali', mode: 'insensitive' } },
        { name: { contains: 'Hariyali', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 11 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
