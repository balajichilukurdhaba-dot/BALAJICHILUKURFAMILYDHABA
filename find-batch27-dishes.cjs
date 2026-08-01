const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Mutter Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Matar Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Marwadi', mode: 'insensitive' } },
        { name: { contains: 'Marwari', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Masala', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Paneer', mode: 'insensitive' } },
        { name: { contains: 'Paneer Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Methi Chaman', mode: 'insensitive' } },
        { name: { contains: 'Methi Chamman', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 27 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
