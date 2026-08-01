const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch7Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785474540516.jpg'),
    destFile: path.join(publicDir, 'stick-paneer.jpg'),
    dishName: 'Stick Paneer',
    galleryTitle: 'Stick Paneer',
    publicUrl: '/stick-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474556305.jpg'),
    destFile: path.join(publicDir, 'dragon-paneer.jpg'),
    dishName: 'Dragon Paneer',
    galleryTitle: 'Dragon Paneer',
    publicUrl: '/dragon-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474567393.jpg'),
    destFile: path.join(publicDir, 'narmada-paneer.jpg'),
    dishName: 'Narmada Paneer',
    galleryTitle: 'Narmada Paneer',
    publicUrl: '/narmada-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474578169.jpg'),
    destFile: path.join(publicDir, 'veg-spring-roll.jpg'),
    dishName: 'Veg Spring Roll',
    galleryTitle: 'Veg Spring Roll',
    publicUrl: '/veg-spring-roll.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474588084.jpg'),
    destFile: path.join(publicDir, 'veg-bullet.jpg'),
    dishName: 'Veg Bullet',
    galleryTitle: 'Veg Bullet',
    publicUrl: '/veg-bullet.jpg'
  }
];

// Copy files
console.log('Copying Batch 7 images...');
batch7Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 7...');

  for (const b of batch7Updates) {
    const updated = await prisma.dish.updateMany({
      where: { name: b.dishName },
      data: { image: b.publicUrl }
    });
    console.log(`Updated Dish ["${b.dishName}"]: ${updated.count} row(s) -> ${b.publicUrl}`);

    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { title: { contains: b.galleryTitle, mode: 'insensitive' } },
          { menuDishName: b.dishName }
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
          menuDishName: b.dishName,
          order: 130,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 7 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: batch7Updates.map(b => b.dishName) }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
