const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany({
    include: {
      category: true
    }
  });

  const remaining = dishes.filter(d => 
    !d.image || 
    d.image.includes('unsplash') || 
    d.image.includes('soup.jpg')
  );

  console.log(`--- REMAINING ${remaining.length} DISHES ---`);
  remaining.forEach((d, i) => {
    console.log(`${i + 1}. [${d.category.name}] "${d.name}"`);
  });
}

main().finally(() => prisma.$disconnect());
