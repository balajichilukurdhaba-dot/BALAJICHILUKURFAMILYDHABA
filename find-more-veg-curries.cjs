const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Kheema', mode: 'insensitive' } },
        { name: { contains: 'Keema', mode: 'insensitive' } },
        { name: { contains: 'Pyaza', mode: 'insensitive' } },
        { name: { contains: 'Piyaza', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- ALL KHEEMA & DO PYAZA ITEMS IN DB ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
