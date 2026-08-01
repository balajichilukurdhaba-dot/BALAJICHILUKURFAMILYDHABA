const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch28Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785480780160.jpg'),
    destFile: path.join(publicDir, 'plain-palak.jpg'),
    dishNames: ['Plain Palak'],
    galleryTitle: 'Plain Palak',
    category: 'Veg Curries',
    price: "160",
    publicUrl: '/plain-palak.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480783794.jpg'),
    destFile: path.join(publicDir, 'punjabi-channa-masala.jpg'),
    dishNames: ['Punjabi Channa Masala'],
    galleryTitle: 'Punjabi Channa Masala',
    category: 'Special Veg Curries',
    price: "180",
    publicUrl: '/punjabi-channa-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480787711.jpg'),
    destFile: path.join(publicDir, 'paneer-butter-masala.jpg'),
    dishNames: ['Paneer Butter Masala'],
    galleryTitle: 'Paneer Butter Masala',
    category: 'Paneer Specialities',
    price: "220",
    publicUrl: '/paneer-butter-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480790831.jpg'),
    destFile: path.join(publicDir, 'paneer-kheema-masala.jpg'),
    dishNames: ['Paneer Kheema Masala'],
    galleryTitle: 'Paneer Kheema Masala',
    category: 'Paneer Specialities',
    price: "230",
    publicUrl: '/paneer-kheema-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480798213.jpg'),
    destFile: path.join(publicDir, 'palak-paneer.jpg'),
    dishNames: ['Palak Paneer', 'palak paneer'],
    galleryTitle: 'Palak Paneer',
    category: 'Paneer Specialities',
    price: "210",
    publicUrl: '/palak-paneer.jpg'
  }
];

// Copy files
console.log('Copying Batch 28 images...');
batch28Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 28...');

  for (const b of batch28Updates) {
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
          order: 270,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 28 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Plain Palak', 'Punjabi Channa Masala', 'Paneer Butter Masala', 'Paneer Kheema Masala', 'Palak Paneer'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
