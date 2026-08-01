const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch34Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785489053777.jpg'),
    destFile: path.join(publicDir, 'punjabi-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'punjabi-pulao-alt.jpg')],
    dishNames: ['Punjabi Pulao'],
    galleryTitle: 'Punjabi Pulao',
    category: 'Pulao',
    price: "185",
    publicUrl: '/punjabi-pulao.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785489056555.jpg'),
    destFile: path.join(publicDir, 'navratan-pulao.jpg'),
    dishNames: ['Navratan Pulao (Sweet)', 'Navratan Pulao'],
    galleryTitle: 'Navratan Pulao (Sweet)',
    category: 'Pulao',
    price: "210",
    publicUrl: '/navratan-pulao.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785489061781.jpg'),
    destFile: path.join(publicDir, 'veg-jaipuri.jpg'),
    dishNames: ['Veg Jaipuri'],
    galleryTitle: 'Veg Jaipuri',
    category: 'Veg Curries',
    price: "190",
    publicUrl: '/veg-jaipuri.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785489064665.jpg'),
    destFile: path.join(publicDir, 'gobhi-manchuria.jpg'),
    extraCopies: [path.join(publicDir, 'gobi-manchuria.jpg')],
    dishNames: ['Gobhi Manchuria', 'Gobi Manchuria'],
    galleryTitle: 'Gobhi Manchuria',
    category: 'Starters',
    price: "170",
    publicUrl: '/gobhi-manchuria.jpg'
  }
];

// Copy files
console.log('Copying Batch 34 images...');
batch34Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 34...');

  for (const b of batch34Updates) {
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
          order: 330,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 34 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Punjabi Pulao', 'Navratan Pulao (Sweet)', 'Veg Jaipuri', 'Gobhi Manchuria'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
