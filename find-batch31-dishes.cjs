const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Handi Biryani', mode: 'insensitive' } },
        { name: { contains: 'Jumbo', mode: 'insensitive' } },
        { name: { contains: 'Veg Fried Rice', mode: 'insensitive' } },
        { name: { contains: 'Veg. Fried Rice', mode: 'insensitive' } },
        { name: { contains: 'Schezwan Fried Rice', mode: 'insensitive' } },
        { name: { contains: 'Masala Fried Rice', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 31 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
