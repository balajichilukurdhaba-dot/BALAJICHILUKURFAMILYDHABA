const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncMenuToGallery() {
  console.log('🔄 Syncing menu items (dishes) from database into gallery_photos table...');

  // Fetch all dishes with their category from database
  const dishes = await prisma.dish.findMany({
    include: { category: true },
    where: { isHidden: false },
    orderBy: { name: 'asc' }
  });

  console.log(`📦 Found ${dishes.length} total dishes in database.`);

  const itemsWithImages = dishes.filter(d => d.image && typeof d.image === 'string' && d.image.trim().length > 0);

  console.log(`📸 Found ${itemsWithImages.length} dishes with images.`);

  // Clear old default/generic gallery entries
  await prisma.galleryPhoto.deleteMany({});
  console.log('🧹 Cleared old gallery_photos records from database.');

  // Create new gallery photo entries from the database dishes
  const galleryData = itemsWithImages.map((dish, index) => {
    let srcUrl = dish.image.trim();
    if (!srcUrl.startsWith('http://') && !srcUrl.startsWith('https://') && !srcUrl.startsWith('/')) {
      srcUrl = '/' + srcUrl;
    }

    const catName = dish.category ? dish.category.name : 'Dishes';

    return {
      src: srcUrl,
      title: dish.name,
      menuCategory: catName,
      menuDishName: dish.name,
      altText: dish.name,
      albumName: catName,
      isFeatured: dish.isBestseller || dish.isChefSpecial || index < 12,
      order: index
    };
  });

  const created = await prisma.galleryPhoto.createMany({
    data: galleryData
  });

  console.log(`🎉 Successfully populated ${created.count} gallery photos directly from database dishes!`);
}

syncMenuToGallery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
