const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Stuff Naan', mode: 'insensitive' } },
        { name: { contains: 'Kothmir Butter Naan', mode: 'insensitive' } },
        { name: { contains: 'Paneer Bhurji', mode: 'insensitive' } },
        { name: { contains: 'Paneer Patiala', mode: 'insensitive' } },
        { name: { contains: 'Paneer Tikka', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 22 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
