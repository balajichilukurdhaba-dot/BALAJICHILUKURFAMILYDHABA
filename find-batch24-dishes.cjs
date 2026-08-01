const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Shahi Paneer', mode: 'insensitive' } },
        { name: { contains: 'Schezwan Handi', mode: 'insensitive' } },
        { name: { contains: 'Handi Paneer', mode: 'insensitive' } },
        { name: { contains: 'Soya Chaap Paneer', mode: 'insensitive' } },
        { name: { contains: 'Soya Chaap', mode: 'insensitive' } },
        { name: { contains: 'Tomato Chutney', mode: 'insensitive' } },
        { name: { contains: 'Tomato Curry', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 24 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
