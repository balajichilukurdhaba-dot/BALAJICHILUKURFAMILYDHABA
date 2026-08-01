const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Punjabi Papad', mode: 'insensitive' } },
        { name: { contains: 'Raita', mode: 'insensitive' } },
        { name: { contains: 'Curd', mode: 'insensitive' } },
        { name: { contains: 'Dahi', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 18 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
