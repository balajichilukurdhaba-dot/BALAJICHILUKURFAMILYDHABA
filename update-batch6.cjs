const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch6Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785474067469.jpg'),
    destFile: path.join(publicDir, 'french-fries.jpg'),
    dishNames: ['French Fries'],
    galleryTitle: 'French Fries',
    publicUrl: '/french-fries.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474069340.jpg'),
    destFile: path.join(publicDir, 'honey-chilli-potato.jpg'),
    dishNames: ['Honey Chilly Potato', 'Honey Chilli Potato'],
    galleryTitle: 'Honey Chilli Potato',
    publicUrl: '/honey-chilli-potato.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474087754.jpg'),
    destFile: path.join(publicDir, 'crispy-baby-corn.jpg'),
    dishNames: ['Crispy Baby Corn'],
    galleryTitle: 'Crispy Baby Corn',
    publicUrl: '/crispy-baby-corn.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474090310.jpg'),
    destFile: path.join(publicDir, 'mushroom-butter-pepper.jpg'),
    dishNames: ['Mushroom Butter Pepper'],
    galleryTitle: 'Mushroom Butter Pepper',
    publicUrl: '/mushroom-butter-pepper.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474093915.jpg'),
    destFile: path.join(publicDir, 'sangrila-paneer.jpg'),
    extraCopies: [path.join(publicDir, 'paneer-sangai.jpg')],
    dishNames: ['Sangrila Paneer', 'Sangai Paneer'],
    galleryTitle: 'Sangrila Paneer',
    publicUrl: '/sangrila-paneer.jpg'
  }
];

// Copy files
console.log('Copying Batch 6 images...');
batch6Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 6...');

  for (const b of batch6Updates) {
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
          menuCategory: 'Special Starters',
          menuDishName: b.dishNames[0],
          order: 125,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 6 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'French', mode: 'insensitive' } },
        { name: { contains: 'Honey', mode: 'insensitive' } },
        { name: { contains: 'Crispy Baby Corn', mode: 'insensitive' } },
        { name: { contains: 'Mushroom Butter Pepper', mode: 'insensitive' } },
        { name: { contains: 'Sangrila Paneer', mode: 'insensitive' } },
      ]
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
