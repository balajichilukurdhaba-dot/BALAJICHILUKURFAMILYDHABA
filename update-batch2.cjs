const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch2Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785473210989.jpg'),
    destFile: path.join(publicDir, 'veg-manchow-soup.jpg'),
    dishNames: ['Veg Manchow Soup', 'Manchow Soup'],
    galleryTitle: 'Veg Manchow Soup',
    publicUrl: '/veg-manchow-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473226765.jpg'),
    destFile: path.join(publicDir, 'cream-up-mushroom-soup.jpg'),
    dishNames: ['Cream Up Mushroom Soup (Sweet)', 'Cream up mushroom soup sweet'],
    galleryTitle: 'Cream Up Mushroom Soup',
    publicUrl: '/cream-up-mushroom-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473236018.jpg'),
    destFile: path.join(publicDir, 'lemon-coriander-soup.jpg'),
    dishNames: ['Lemon Coriander Soup'],
    galleryTitle: 'Lemon Coriander Soup',
    publicUrl: '/lemon-coriander-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473248032.jpg'),
    destFile: path.join(publicDir, 'tandoori-soya-chaap.jpg'),
    dishNames: ['Tandoori Soya Chaap', 'Tandoori Soya Chaap (20 Min Wait)', 'Soya Chaap Manchuria'],
    galleryTitle: 'Tandoori Soya Chaap',
    publicUrl: '/tandoori-soya-chaap.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785473263020.jpg'),
    destFile: path.join(publicDir, 'tandoori-paneer-tikka-dry.jpg'),
    dishNames: ['Tandoori Paneer Tikka', 'Tandoori Paneer Tikka Dry', 'Paneer Tikka Masala'],
    galleryTitle: 'Tandoori Paneer Tikka Dry',
    publicUrl: '/tandoori-paneer-tikka-dry.jpg'
  }
];

// Copy files
console.log('Copying Batch 2 images...');
batch2Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 2...');

  for (const b of batch2Updates) {
    for (const name of b.dishNames) {
      const updated = await prisma.dish.updateMany({
        where: { name: name },
        data: { image: b.publicUrl }
      });
      if (updated.count > 0) {
        console.log(`Updated Dish ["${name}"]: ${updated.count} row(s) -> ${b.publicUrl}`);
      }
    }

    // Upsert or update gallery photo
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
          order: 105,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 2 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { name: { contains: 'Manchow', mode: 'insensitive' } },
        { name: { contains: 'Cream', mode: 'insensitive' } },
        { name: { contains: 'Lemon', mode: 'insensitive' } },
        { name: { contains: 'Soya', mode: 'insensitive' } },
        { name: { contains: 'Tandoori', mode: 'insensitive' } },
      ]
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
