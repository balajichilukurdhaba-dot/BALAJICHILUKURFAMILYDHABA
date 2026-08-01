const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'French', mode: 'insensitive' } },
        { name: { contains: 'Honey', mode: 'insensitive' } },
        { name: { contains: 'Baby Corn', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Butter', mode: 'insensitive' } },
        { name: { contains: 'Sangrila', mode: 'insensitive' } },
        { name: { contains: 'Sangai', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 6 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
