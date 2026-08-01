const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch4Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785473638933.jpg'),
    destFile: path.join(publicDir, 'baby-corn-majestic.jpg'),
    dishName: 'Baby Corn Majestic',
    galleryTitle: 'Baby Corn Majestic',
    publicUrl: '/baby-corn-majestic.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473652610.jpg'),
    destFile: path.join(publicDir, 'baby-corn-manchuria.jpg'),
    dishName: 'Baby Corn Manchuria',
    galleryTitle: 'Baby Corn Manchuria',
    publicUrl: '/baby-corn-manchuria.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473663138.jpg'),
    destFile: path.join(publicDir, 'soya-chaap-manchuria.jpg'),
    dishName: 'Soya Chaap Manchuria',
    galleryTitle: 'Soya Chaap Manchuria',
    publicUrl: '/soya-chaap-manchuria.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473674927.jpg'),
    destFile: path.join(publicDir, 'paneer-manchuria.jpg'),
    dishName: 'Paneer Manchuria',
    galleryTitle: 'Paneer Manchuria',
    publicUrl: '/paneer-manchuria.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473683314.jpg'),
    destFile: path.join(publicDir, 'schezwan-manchuria.jpg'),
    dishName: 'Schezwan Manchuria',
    galleryTitle: 'Schezwan Manchuria',
    publicUrl: '/schezwan-manchuria.jpg'
  }
];

// Copy files
console.log('Copying Batch 4 images...');
batch4Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 4...');

  for (const b of batch4Updates) {
    const updated = await prisma.dish.updateMany({
      where: { name: b.dishName },
      data: { image: b.publicUrl }
    });
    console.log(`Updated Dish ["${b.dishName}"]: ${updated.count} row(s) -> ${b.publicUrl}`);

    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { title: { contains: b.galleryTitle, mode: 'insensitive' } },
          { menuDishName: b.dishName }
        ]
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
          menuCategory: 'Starters',
          menuDishName: b.dishName,
          order: 115,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 4 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: batch4Updates.map(b => b.dishName) }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
