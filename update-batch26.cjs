const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch26Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785480282178.jpg'),
    destFile: path.join(publicDir, 'veg-kolhapuri.jpg'),
    dishNames: ['Veg Kolhapuri'],
    galleryTitle: 'Veg Kolhapuri',
    category: 'Veg Curries',
    price: "190",
    publicUrl: '/veg-kolhapuri.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480285559.jpg'),
    destFile: path.join(publicDir, 'veg-punjabi.jpg'),
    dishNames: ['Veg Punjabi'],
    galleryTitle: 'Veg Punjabi',
    category: 'Veg Curries',
    price: "195",
    publicUrl: '/veg-punjabi.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480288459.jpg'),
    destFile: path.join(publicDir, 'veg-chatpata.jpg'),
    dishNames: ['Veg Chatpata'],
    galleryTitle: 'Veg Chatpata',
    category: 'Veg Curries',
    price: "185",
    publicUrl: '/veg-chatpata.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480292050.jpg'),
    destFile: path.join(publicDir, 'veg-navratan-kurma.jpg'),
    dishNames: ['Veg Navratan Kurma (Sweet)', 'Veg Navratan Kurma'],
    galleryTitle: 'Veg Navratan Kurma',
    category: 'Veg Curries',
    price: "200",
    publicUrl: '/veg-navratan-kurma.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480303365.jpg'),
    destFile: path.join(publicDir, 'mix-veg.jpg'),
    extraCopies: [path.join(publicDir, 'mix-vegetable.jpg')],
    dishNames: ['Mix Vegetable', 'Mix veg'],
    galleryTitle: 'Mix Vegetable',
    category: 'Veg Curries',
    price: "175",
    publicUrl: '/mix-veg.jpg'
  }
];

// Copy files
console.log('Copying Batch 26 images...');
batch26Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 26...');

  for (const b of batch26Updates) {
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
      const parentCategory = await prisma.category.findFirst({
        where: { name: { contains: b.category, mode: 'insensitive' } }
      });

      if (parentCategory) {
        const created = await prisma.dish.create({
          data: {
            name: b.dishNames[0],
            description: `Delicious Punjabi style ${b.galleryTitle}.`,
            price: b.price,
            image: b.publicUrl,
            categoryId: parentCategory.id,
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
          order: 250,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 26 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Veg Kolhapuri', 'Veg Punjabi', 'Veg Chatpata', 'Veg Navratan Kurma (Sweet)', 'Mix Vegetable'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
