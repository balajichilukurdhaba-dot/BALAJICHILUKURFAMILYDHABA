const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch5Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785473802656.jpg'),
    destFile: path.join(publicDir, 'veg-manchuria-dry.jpg'),
    dishNames: ['Veg Manchuria Dry'],
    galleryTitle: 'Veg Manchuria Dry',
    publicUrl: '/veg-manchuria-dry.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473806404.jpg'),
    destFile: path.join(publicDir, 'wet-manchuria.jpg'),
    dishNames: ['Wet Manchuria', 'Manchuria'],
    galleryTitle: 'Wet Manchuria',
    publicUrl: '/wet-manchuria.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473810590.jpg'),
    destFile: path.join(publicDir, 'veg-clear-soup.jpg'),
    dishNames: ['Veg Clear Soup'],
    galleryTitle: 'Veg Clear Soup',
    publicUrl: '/veg-clear-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473848703.jpg'),
    destFile: path.join(publicDir, 'dragon-paneer.jpg'),
    extraCopies: [path.join(publicDir, 'stick-paneer.jpg')],
    dishNames: ['Dragon Paneer', 'Stick Paneer'],
    galleryTitle: 'Dragon Paneer',
    publicUrl: '/dragon-paneer.jpg'
  }
];

// Copy files
console.log('Copying Batch 5 images...');
batch5Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 5...');

  for (const b of batch5Updates) {
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
          menuCategory: b.galleryTitle.includes('Soup') ? 'Soups' : 'Starters',
          menuDishName: b.dishNames[0],
          order: 120,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 5 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Veg Manchuria Dry', mode: 'insensitive' } },
        { name: { contains: 'Wet Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Veg Clear Soup', mode: 'insensitive' } },
        { name: { contains: 'Dragon Paneer', mode: 'insensitive' } },
      ]
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
