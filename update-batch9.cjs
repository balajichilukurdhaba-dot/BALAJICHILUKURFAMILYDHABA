const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch9Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785475335796.jpg'),
    destFile: path.join(publicDir, 'veg-65.jpg'),
    dishNames: ['Veg 65'],
    galleryTitle: 'Veg 65',
    publicUrl: '/veg-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475337266.jpg'),
    destFile: path.join(publicDir, 'aloo-65.jpg'),
    dishNames: ['Aloo 65'],
    galleryTitle: 'Aloo 65',
    publicUrl: '/aloo-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475356964.jpg'),
    destFile: path.join(publicDir, 'soya-chaap-65.jpg'),
    dishNames: ['Soya Chaap 65'],
    galleryTitle: 'Soya Chaap 65',
    publicUrl: '/soya-chaap-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475358427.jpg'),
    destFile: path.join(publicDir, 'gobhi-65.jpg'),
    extraCopies: [path.join(publicDir, 'gobi-65.jpg')],
    dishNames: ['Gobhi 65', 'Gobi 65'],
    galleryTitle: 'Gobhi 65',
    publicUrl: '/gobhi-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475375906.jpg'),
    destFile: path.join(publicDir, 'paneer-65.jpg'),
    extraCopies: [
      path.join(publicDir, 'paneer-sixty-five.jpg'),
      path.join(publicDir, 'paneer-sixty-five-special.jpg')
    ],
    dishNames: ['Paneer 65'],
    galleryTitle: 'Paneer 65',
    publicUrl: '/paneer-65.jpg'
  }
];

// Copy files
console.log('Copying Batch 9 images...');
batch9Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
    if (b.extraCopies) {
      b.extraCopies.forEach(ec => {
        fs.copyFileSync(b.srcFile, ec);
        console.log(`Extra copy -> ${path.basename(ec)}`);
      });
    }
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 9...');

  for (const b of batch9Updates) {
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
          menuCategory: '65 Ki Pasand',
          menuDishName: b.dishNames[0],
          order: 140,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 9 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Veg 65', 'Aloo 65', 'Soya Chaap 65', 'Gobhi 65', 'Paneer 65'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
