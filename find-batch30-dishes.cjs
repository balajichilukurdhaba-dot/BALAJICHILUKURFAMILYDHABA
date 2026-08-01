const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Dum Biryani', mode: 'insensitive' } },
        { name: { contains: 'Paneer Biryani', mode: 'insensitive' } },
        { name: { contains: 'Kaju Biryani', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Biryani', mode: 'insensitive' } },
        { name: { contains: 'Kaju Paneer Biryani', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 30 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
