const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Alias existing images to these variant names
  await prisma.dish.updateMany({
    where: { name: 'Punjabi Gobi Masala' },
    data: { image: '/punjabi-gobhi-masala.jpg' }
  });

  await prisma.dish.updateMany({
    where: { name: 'Tomato Chatni' },
    data: { image: '/tomato-chutney.jpg' }
  });

  await prisma.dish.updateMany({
    where: { name: 'Veg Do-Pyazza' },
    data: { image: '/veg-do-pyaza.jpg' }
  });

  console.log('Updated aliases for Punjabi Gobi Masala, Tomato Chatni, Veg Do-Pyazza!');
}

main().finally(() => prisma.$disconnect());
