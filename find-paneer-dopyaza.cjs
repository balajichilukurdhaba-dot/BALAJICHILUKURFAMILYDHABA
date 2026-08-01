const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      name: { contains: 'Paneer Do Pyaza', mode: 'insensitive' }
    }
  });

  console.log('--- DB MATCHES FOR PANEER DO PYAZA ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
