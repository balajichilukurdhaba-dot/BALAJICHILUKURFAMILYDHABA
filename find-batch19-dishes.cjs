const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Butter Milk', mode: 'insensitive' } },
        { name: { contains: 'Lassi', mode: 'insensitive' } },
        { name: { contains: 'Lime Soda', mode: 'insensitive' } },
        { name: { contains: 'Fresh Lime', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 19 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
