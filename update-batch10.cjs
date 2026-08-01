const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch10Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785475535186.jpg'),
    destFile: path.join(publicDir, 'baby-corn-65.jpg'),
    dishName: 'Baby Corn 65',
    galleryTitle: 'Baby Corn 65',
    publicUrl: '/baby-corn-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475537585.jpg'),
    destFile: path.join(publicDir, 'mushroom-65.jpg'),
    extraCopies: [path.join(publicDir, 'mushroom-sixty-five.jpg')],
    dishName: 'Mushroom 65',
    galleryTitle: 'Mushroom 65',
    publicUrl: '/mushroom-65.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475557458.jpg'),
    destFile: path.join(publicDir, 'kundan-paneer.jpg'),
    dishName: 'Kundan Paneer',
    galleryTitle: 'Kundan Paneer',
    publicUrl: '/kundan-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475559913.jpg'),
    destFile: path.join(publicDir, 'malai-methi-paneer.jpg'),
    dishName: 'Malai Methi Paneer',
    galleryTitle: 'Malai Methi Paneer',
    publicUrl: '/malai-methi-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475564166.jpg'),
    destFile: path.join(publicDir, 'sangai-paneer.jpg'),
    extraCopies: [path.join(publicDir, 'paneer-sangai.jpg')],
    dishName: 'Sangai Paneer',
    galleryTitle: 'Sangai Paneer',
    publicUrl: '/sangai-paneer.jpg'
  }
];

// Copy files
console.log('Copying Batch 10 images...');
batch10Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 10...');

  for (const b of batch10Updates) {
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
          menuCategory: b.dishName.includes('65') ? '65 Ki Pasand' : 'Veg Curries',
          menuDishName: b.dishName,
          order: 145,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 10 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: batch10Updates.map(b => b.dishName) }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
