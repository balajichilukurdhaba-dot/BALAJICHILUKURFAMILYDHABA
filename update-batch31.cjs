const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch31Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785481394846.jpg'),
    destFile: path.join(publicDir, 'handi-biryani.jpg'),
    dishNames: ['Handi Biryani'],
    galleryTitle: 'Handi Biryani',
    category: 'Biryani',
    price: "240",
    publicUrl: '/handi-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481404523.jpg'),
    destFile: path.join(publicDir, 'jumbo-family-pack.jpg'),
    dishNames: ['Jumbo Family Pack', 'Jumbo family pack'],
    galleryTitle: 'Jumbo Family Pack',
    category: 'Jumbo Family Pack',
    price: "650",
    publicUrl: '/jumbo-family-pack.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481406433.jpg'),
    destFile: path.join(publicDir, 'veg-fried-rice.jpg'),
    dishNames: ['Veg Fried Rice', 'Veg. Fried Rice'],
    galleryTitle: 'Veg Fried Rice',
    category: 'Fried Rice',
    price: "160",
    publicUrl: '/veg-fried-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481410134.jpg'),
    destFile: path.join(publicDir, 'schezwan-fried-rice.jpg'),
    dishNames: ['Schezwan Fried Rice'],
    galleryTitle: 'Schezwan Fried Rice',
    category: 'Fried Rice',
    price: "175",
    publicUrl: '/schezwan-fried-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481412534.jpg'),
    destFile: path.join(publicDir, 'masala-fried-rice.jpg'),
    dishNames: ['Masala Fried Rice'],
    galleryTitle: 'Masala Fried Rice',
    category: 'Fried Rice',
    price: "170",
    publicUrl: '/masala-fried-rice.jpg'
  }
];

// Copy files
console.log('Copying Batch 31 images...');
batch31Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 31...');

  for (const b of batch31Updates) {
    let updatedCount = 0;
    for (const name of b.dishNames) {
      const updated = await prisma.dish.updateMany({
        where: { name: name },
        data: { image: b.publicUrl }
      });
      updatedCount += updated.count;
    }

    if (updatedCount > 0) {
      console.log(`Updated Dish ["${b.dishNames[0]}"]: ${updatedCount} row(s) -> ${b.publicUrl}`);
    } else {
      const parentCategory = await prisma.category.findFirst({
        where: { name: { contains: b.category, mode: 'insensitive' } }
      });

      if (parentCategory) {
        const created = await prisma.dish.create({
          data: {
            name: b.dishNames[0],
            description: `Delicious house special ${b.galleryTitle}.`,
            price: b.price,
            image: b.publicUrl,
            categoryId: parentCategory.id,
            isVegetarian: true,
            isOutOfStock: false
          }
        });
        console.log(`Created new Dish ["${created.name}"] -> ${b.publicUrl}`);
      }
    }

    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        title: { equals: b.galleryTitle, mode: 'insensitive' }
      }
    });

    if (existingPhoto) {
      await prisma.galleryPhoto.update({
        where: { id: existingPhoto.id },
        data: { src: b.publicUrl }
      });
      console.log(`Updated GalleryPhoto ["${existingPhoto.title}"] -> ${b.publicUrl}`);
    } else {
      await prisma.galleryPhoto.create({
        data: {
          src: b.publicUrl,
          title: b.galleryTitle,
          menuCategory: b.category,
          menuDishName: b.dishNames[0],
          order: 300,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 31 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Handi Biryani', 'Jumbo Family Pack', 'Veg Fried Rice', 'Schezwan Fried Rice', 'Masala Fried Rice'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
