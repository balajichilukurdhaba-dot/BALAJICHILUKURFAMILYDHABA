const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Rajasthani Methi Paratha', mode: 'insensitive' } },
        { name: { contains: 'Kulcha', mode: 'insensitive' } },
        { name: { contains: 'Pudina Paratha', mode: 'insensitive' } },
        { name: { contains: 'Rice', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 15 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
