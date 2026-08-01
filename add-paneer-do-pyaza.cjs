const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const paneerCat = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { contains: 'Paneer', mode: 'insensitive' } }
      ]
    }
  });

  if (paneerCat) {
    const existing = await prisma.dish.findFirst({
      where: { name: 'Paneer Do Pyaza' }
    });

    if (!existing) {
      const created = await prisma.dish.create({
        data: {
          name: 'Paneer Do Pyaza',
          description: 'Delicious cottage cheese cooked with double onions in rich gravy.',
          price: "235",
          image: '/paneer-do-pyaza.jpg',
          categoryId: paneerCat.id,
          isVegetarian: true,
          isOutOfStock: false
        }
      });
      console.log(`Created Dish ["${created.name}"] -> ${created.image}`);
    } else {
      await prisma.dish.update({
        where: { id: existing.id },
        data: { image: '/paneer-do-pyaza.jpg' }
      });
      console.log(`Updated Dish ["${existing.name}"] -> /paneer-do-pyaza.jpg`);
    }
  }
}

main().finally(() => prisma.$disconnect());
