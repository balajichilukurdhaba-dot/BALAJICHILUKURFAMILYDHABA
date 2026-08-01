const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Plain Palak', mode: 'insensitive' } },
        { name: { contains: 'Channa Masala', mode: 'insensitive' } },
        { name: { contains: 'Chana Masala', mode: 'insensitive' } },
        { name: { contains: 'Paneer Butter Masala', mode: 'insensitive' } },
        { name: { contains: 'Paneer Kheema', mode: 'insensitive' } },
        { name: { contains: 'Paneer Keema', mode: 'insensitive' } },
        { name: { contains: 'Palak Paneer', mode: 'insensitive' } },
      ]
    }
  });

  console.log('--- DB MATCHES FOR BATCH 28 ---');
  dishes.forEach(d => console.log(`ID: ${d.id} | Name: "${d.name}" | Image: "${d.image}"`));
}

main().finally(() => prisma.$disconnect());
