const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch12Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785476051599.jpg'),
    destFile: path.join(publicDir, 'zilmil-veg.jpg'),
    dishNames: ['Zilmil Veg', 'ZilMil Veg'],
    galleryTitle: 'ZilMil Veg',
    category: 'Veg Curries',
    publicUrl: '/zilmil-veg.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476060059.jpg'),
    destFile: path.join(publicDir, 'tandoori-roti.jpg'),
    dishNames: ['Tandoori Roti'],
    galleryTitle: 'Tandoori Roti',
    category: 'Roti & Naan',
    publicUrl: '/tandoori-roti.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476072224.jpg'),
    destFile: path.join(publicDir, 'butter-roti.jpg'),
    dishNames: ['Butter Roti'],
    galleryTitle: 'Butter Roti',
    category: 'Roti & Naan',
    publicUrl: '/butter-roti.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476084600.jpg'),
    destFile: path.join(publicDir, 'kothmir-roti.jpg'),
    dishNames: ['Kothmir Roti'],
    galleryTitle: 'Kothmir Roti',
    category: 'Roti & Naan',
    publicUrl: '/kothmir-roti.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476094277.jpg'),
    destFile: path.join(publicDir, 'pudina-roti.jpg'),
    dishNames: ['Pudina Roti'],
    galleryTitle: 'Pudina Roti',
    category: 'Roti & Naan',
    publicUrl: '/pudina-roti.jpg'
  }
];

// Copy files
console.log('Copying Batch 12 images...');
batch12Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 12...');

  for (const b of batch12Updates) {
    for (const name of b.dishNames) {
      const updated = await prisma.dish.updateMany({
        where: { name: name },
        data: { image: b.publicUrl }
      });
      if (updated.count > 0) {
        console.log(`Updated Dish ["${name}"]: ${updated.count} row(s) -> ${b.publicUrl}`);
      }
    }

    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { title: { contains: b.galleryTitle, mode: 'insensitive' } },
          { menuDishName: { in: b.dishNames } }
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
          menuCategory: b.category,
          menuDishName: b.dishNames[0],
          order: 155,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 12 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Zilmil Veg', 'Tandoori Roti', 'Butter Roti', 'Kothmir Roti', 'Pudina Roti'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
