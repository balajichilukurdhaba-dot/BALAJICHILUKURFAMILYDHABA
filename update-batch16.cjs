const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch16Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785476737211.jpg'),
    destFile: path.join(publicDir, 'curd-rice.jpg'),
    dishNames: ['Curd Rice'],
    galleryTitle: 'Curd Rice',
    category: 'Rice Dishes',
    publicUrl: '/curd-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476739960.jpg'),
    destFile: path.join(publicDir, 'lemon-rice.jpg'),
    dishNames: ['Lemon Rice'],
    galleryTitle: 'Lemon Rice',
    category: 'Rice Dishes',
    publicUrl: '/lemon-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476743182.jpg'),
    destFile: path.join(publicDir, 'butter-rice.jpg'),
    dishNames: ['Butter Rice'],
    galleryTitle: 'Butter Rice',
    category: 'Rice Dishes',
    publicUrl: '/butter-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476746076.jpg'),
    destFile: path.join(publicDir, 'jeera-rice.jpg'),
    dishNames: ['Jeera Rice'],
    galleryTitle: 'Jeera Rice',
    category: 'Rice Dishes',
    publicUrl: '/jeera-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476748394.jpg'),
    destFile: path.join(publicDir, 'tomato-rice.jpg'),
    dishNames: ['Tomato Rice'],
    galleryTitle: 'Tomato Rice',
    category: 'Rice Dishes',
    publicUrl: '/tomato-rice.jpg'
  }
];

// Copy files
console.log('Copying Batch 16 images...');
batch16Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 16...');

  for (const b of batch16Updates) {
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
          order: 175,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 16 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Curd Rice', 'Lemon Rice', 'Butter Rice', 'Jeera Rice', 'Tomato Rice'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
