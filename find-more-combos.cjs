const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: '300ml', mode: 'insensitive' } },
        { name: { contains: 'Biryani', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
