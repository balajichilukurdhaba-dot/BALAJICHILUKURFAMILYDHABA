const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dishes = await prisma.dish.findMany();
  const unsplashOrPlaceholder = dishes.filter(d => 
    !d.image || 
    d.image.includes('unsplash') || 
    d.image.includes('soup.jpg')
  );

  console.log(`\n========================================`);
  console.log(`TOTAL DISHES IN DB: ${dishes.length}`);
  console.log(`UPDATED REAL DISHES: ${dishes.length - unsplashOrPlaceholder.length}`);
  console.log(`REMAINING PLACEHOLDERS/UNSPLASH: ${unsplashOrPlaceholder.length}`);
  console.log(`========================================\n`);

  if (unsplashOrPlaceholder.length > 0) {
    console.log('REMAINING ITEMS NEEDING REAL IMAGES:');
    unsplashOrPlaceholder.forEach(d => console.log(`- "${d.name}" (${d.image})`));
  }
}

main().finally(() => prisma.$disconnect());
