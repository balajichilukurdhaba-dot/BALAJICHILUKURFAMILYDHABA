const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Veg Kolhapuri', mode: 'insensitive' } },
        { name: { contains: 'Veg Punjabi', mode: 'insensitive' } },
        { name: { contains: 'Veg Chatpata', mode: 'insensitive' } },
        { name: { contains: 'Navratan', mode: 'insensitive' } },
        { name: { contains: 'Mix Veg', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 26 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
