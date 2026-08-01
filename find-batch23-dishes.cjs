const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Tadka Paneer', mode: 'insensitive' } },
        { name: { contains: 'Tadka Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Stuffed Capsicum', mode: 'insensitive' } },
        { name: { contains: 'Stuff Capsicum', mode: 'insensitive' } },
        { name: { contains: 'Stuffed Tomato', mode: 'insensitive' } },
        { name: { contains: 'Stuff Tomato', mode: 'insensitive' } },
        { name: { contains: 'Gobhi Masala', mode: 'insensitive' } },
        { name: { contains: 'Punjabi Gobhi', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 23 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
