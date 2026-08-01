const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      category: {
        name: { contains: 'Soup', mode: 'insensitive' }
      }
    },
    include: { category: true }
  });

  console.log('--- DB SOUPS ---');
  dishes.forEach(d => {
    console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`);
  });
}

main().finally(() => prisma.$disconnect());
