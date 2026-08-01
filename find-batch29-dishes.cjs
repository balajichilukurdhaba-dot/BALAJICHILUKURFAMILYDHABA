const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Paneer Chatpata', mode: 'insensitive' } },
        { name: { contains: 'Paneer Makhanwala', mode: 'insensitive' } },
        { name: { contains: 'Paneer Do Pyaza', mode: 'insensitive' } },
        { name: { contains: 'Veg Biryani', mode: 'insensitive' } },
        { name: { contains: 'Veg. Biryani', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 29 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
