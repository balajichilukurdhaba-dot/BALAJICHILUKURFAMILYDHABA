const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Aloo Paratha', mode: 'insensitive' } },
        { name: { contains: 'Alu Paratha', mode: 'insensitive' } },
        { name: { contains: 'Paneer Paratha', mode: 'insensitive' } },
        { name: { contains: 'Lacha', mode: 'insensitive' } },
        { name: { contains: 'Lachha', mode: 'insensitive' } },
        { name: { contains: 'Methi Paratha', mode: 'insensitive' } },
        { name: { contains: 'Pudina Paratha', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 14 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
