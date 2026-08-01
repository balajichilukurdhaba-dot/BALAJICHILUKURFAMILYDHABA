const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch21Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785478854565.jpg'),
    destFile: path.join(publicDir, 'butter-naan.jpg'),
    dishNames: ['Butter Naan', 'butter naan'],
    galleryTitle: 'Butter Naan',
    category: 'Roti & Naan',
    price: "45",
    publicUrl: '/butter-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478856990.jpg'),
    destFile: path.join(publicDir, 'kothmir-naan.jpg'),
    dishNames: ['Kothmir Naan', 'kothmir naan'],
    galleryTitle: 'Kothmir Naan',
    category: 'Roti & Naan',
    price: "50",
    publicUrl: '/kothmir-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478859640.jpg'),
    destFile: path.join(publicDir, 'pudina-butter-naan.jpg'),
    dishNames: ['Pudina Butter Naan', 'pudina butter naan'],
    galleryTitle: 'Pudina Butter Naan',
    category: 'Roti & Naan',
    price: "55",
    publicUrl: '/pudina-butter-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478864778.jpg'),
    destFile: path.join(publicDir, 'baby-naan.jpg'),
    dishNames: ['Baby Naan', 'Baby naan'],
    galleryTitle: 'Baby Naan',
    category: 'Roti & Naan',
    price: "40",
    publicUrl: '/baby-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478867837.jpg'),
    destFile: path.join(publicDir, 'kashmiri-naan.jpg'),
    dishNames: ['Kashmiri Naan', 'Kashmiri naan'],
    galleryTitle: 'Kashmiri Naan',
    category: 'Roti & Naan',
    price: "75",
    publicUrl: '/kashmiri-naan.jpg'
  }
];

const prisma = new PrismaClient();

async function fixGarlicButterNaanPhoto() {
  await prisma.galleryPhoto.updateMany({
    where: { title: 'Garlic Butter Naan' },
    data: { src: '/garlic-butter-naan.jpg' }
  });
}

async function runUpdates() {
  await fixGarlicButterNaanPhoto();

  console.log('Copying Batch 21 images...');
  batch21Updates.forEach(b => {
    if (fs.existsSync(b.srcFile)) {
      fs.copyFileSync(b.srcFile, b.destFile);
      console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
    }
  });

  console.log('\nUpdating DB records for Batch 21...');

  for (const b of batch21Updates) {
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
    } else {
      const rotiCategory = await prisma.category.findFirst({
        where: { name: { contains: 'Roti', mode: 'insensitive' } }
      });

      if (rotiCategory) {
        const created = await prisma.dish.create({
          data: {
            name: b.dishNames[0],
            description: 'Delicious royal Kashmiri Naan stuffed with dry fruits and nuts.',
            price: b.price,
            image: b.publicUrl,
            categoryId: rotiCategory.id,
            isVegetarian: true,
            isOutOfStock: false
          }
        });
        console.log(`Created new Dish ["${created.name}"] -> ${b.publicUrl}`);
      }
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
          order: 200,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 21 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Butter Naan', 'Kothmir Naan', 'Pudina Butter Naan', 'Baby Naan', 'Kashmiri Naan'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
