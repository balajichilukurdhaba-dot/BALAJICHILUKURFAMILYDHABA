const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Manchow', mode: 'insensitive' } },
        { name: { contains: 'Cream', mode: 'insensitive' } },
        { name: { contains: 'Lemon', mode: 'insensitive' } },
        { name: { contains: 'Soya', mode: 'insensitive' } },
        { name: { contains: 'Tikka', mode: 'insensitive' } },
        { name: { contains: 'Paneer', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- MATCHED DISHES IN DB ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
