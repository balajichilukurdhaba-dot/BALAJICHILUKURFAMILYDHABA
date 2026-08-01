const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Stick', mode: 'insensitive' } },
        { name: { contains: 'Dragon', mode: 'insensitive' } },
        { name: { contains: 'Narmada', mode: 'insensitive' } },
        { name: { contains: 'Spring', mode: 'insensitive' } },
        { name: { contains: 'Bullet', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 7 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
