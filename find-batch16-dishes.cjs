const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Curd Rice', mode: 'insensitive' } },
        { name: { contains: 'Lemon Rice', mode: 'insensitive' } },
        { name: { contains: 'Butter Rice', mode: 'insensitive' } },
        { name: { contains: 'Jeera Rice', mode: 'insensitive' } },
        { name: { contains: 'Tomato Rice', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 16 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
