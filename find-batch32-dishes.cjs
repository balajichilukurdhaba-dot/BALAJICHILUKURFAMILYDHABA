const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Kaju Fried Rice', mode: 'insensitive' } },
        { name: { contains: 'Dum Biryani', mode: 'insensitive' } },
        { name: { contains: 'Paneer Fried Rice', mode: 'insensitive' } },
        { name: { contains: 'Veg Pulao', mode: 'insensitive' } },
        { name: { contains: 'Veg. Pullaw', mode: 'insensitive' } },
        { name: { contains: 'Veg Pullaw', mode: 'insensitive' } },
        { name: { contains: 'Corn Kaju', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 32 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
