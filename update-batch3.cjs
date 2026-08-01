const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch3Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785473463511.jpg'),
    destFile: path.join(publicDir, 'crispy-corn.jpg'),
    dishNames: ['Crispy Corn'],
    galleryTitle: 'Crispy Corn',
    publicUrl: '/crispy-corn.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473466331.jpg'),
    destFile: path.join(publicDir, 'chilly-mushroom.jpg'),
    dishNames: ['Chilly Mushroom', 'Mushroom 65', 'Mushroom Butter Pepper'],
    galleryTitle: 'Chilly Mushroom',
    publicUrl: '/chilly-mushroom.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473499657.jpg'),
    destFile: path.join(publicDir, 'mushroom-manchuria.jpg'),
    dishNames: ['Mushroom Manchuria'],
    galleryTitle: 'Mushroom Manchuria',
    publicUrl: '/mushroom-manchuria.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473513411.jpg'),
    destFile: path.join(publicDir, 'chilly-baby-corn.jpg'),
    dishNames: ['Chilly Baby Corn', 'Crispy Baby Corn', 'Baby Corn Manchuria'],
    galleryTitle: 'Chilly Baby Corn',
    publicUrl: '/chilly-baby-corn.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473525222.jpg'),
    destFile: path.join(publicDir, 'paneer-manchuria.jpg'),
    extraCopies: [path.join(publicDir, 'chilly-paneer.jpg')],
    dishNames: ['Paneer Manchuria', 'Chilly Paneer'],
    galleryTitle: 'Paneer Manchuria',
    publicUrl: '/paneer-manchuria.jpg'
  }
];

// Copy files
console.log('Copying Batch 3 images...');
batch3Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 3...');

  for (const b of batch3Updates) {
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
          menuCategory: 'Starters',
          menuDishName: b.dishNames[0],
          order: 110,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 3 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Crispy Corn', mode: 'insensitive' } },
        { name: { contains: 'Chilly Mushroom', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Manchuria', mode: 'insensitive' } },
        { name: { contains: 'Chilly Baby Corn', mode: 'insensitive' } },
        { name: { contains: 'Paneer Manchuria', mode: 'insensitive' } },
      ]
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
