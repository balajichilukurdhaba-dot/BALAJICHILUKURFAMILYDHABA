const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Kashmiri', mode: 'insensitive' } },
        { name: { contains: 'Punjabi Pulao', mode: 'insensitive' } },
        { name: { contains: 'Punjabi Pullaw', mode: 'insensitive' } },
        { name: { contains: 'Paneer Pulao', mode: 'insensitive' } },
        { name: { contains: 'Paneer Pullaw', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 33 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
