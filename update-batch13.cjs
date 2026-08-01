const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch13Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785476195047.jpg'),
    destFile: path.join(publicDir, 'pudina-butter-roti.jpg'),
    extraCopies: [path.join(publicDir, 'podina-butter-roti.jpg')],
    dishNames: ['Podina Butter Roti', 'Pudina Butter Roti'],
    galleryTitle: 'Pudina Butter Roti',
    category: 'Roti & Naan',
    publicUrl: '/pudina-butter-roti.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476209354.jpg'),
    destFile: path.join(publicDir, 'rumali-roti.jpg'),
    extraCopies: [path.join(publicDir, 'roomali-roti.jpg')],
    dishNames: ['Rumali Roti', 'Roomali Roti'],
    galleryTitle: 'Rumali Roti',
    category: 'Roti & Naan',
    publicUrl: '/rumali-roti.jpg'
  }
];

// Copy files
console.log('Copying Batch 13 images...');
batch13Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 13...');

  for (const b of batch13Updates) {
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
          order: 160,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 13 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Podina Butter Roti', 'Pudina Butter Roti', 'Rumali Roti', 'Roomali Roti'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
