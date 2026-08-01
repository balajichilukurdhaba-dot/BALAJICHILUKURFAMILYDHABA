const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vegCurriesCategory = await prisma.category.findFirst({
    where: { name: 'Veg Curries' }
  });

  if (vegCurriesCategory) {
    const existing = await prisma.dish.findFirst({
      where: { name: 'Tomato Chutney' }
    });

    if (!existing) {
      const created = await prisma.dish.create({
        data: {
          name: 'Tomato Chutney',
          description: 'Spicy and tangy homemade style tomato chutney.',
          price: "120",
          image: '/tomato-chutney.jpg',
          categoryId: vegCurriesCategory.id,
          isVegetarian: true,
          isOutOfStock: false
        }
      });
      console.log(`Created Dish ["${created.name}"] -> ${created.image}`);
    } else {
      await prisma.dish.update({
        where: { id: existing.id },
        data: { image: '/tomato-chutney.jpg' }
      });
      console.log(`Updated Dish ["${existing.name}"] -> /tomato-chutney.jpg`);
    }
  }
}

main().finally(() => prisma.$disconnect());
