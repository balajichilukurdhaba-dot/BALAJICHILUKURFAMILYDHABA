const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch20Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785478606195.jpg'),
    destFile: path.join(publicDir, 'cold-drinks.jpg'),
    extraCopies: [path.join(publicDir, 'cold-drink-300ml.jpg')],
    dishNames: ['Cold Drink (300ml)', 'Cold Drinks (300 ml)'],
    galleryTitle: 'Cold Drinks (300 ml)',
    category: 'Beverages',
    publicUrl: '/cold-drinks.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478609329.jpg'),
    destFile: path.join(publicDir, 'mineral-water.jpg'),
    dishNames: ['Mineral Water'],
    galleryTitle: 'Mineral Water',
    category: 'Beverages',
    publicUrl: '/mineral-water.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478613369.jpg'),
    destFile: path.join(publicDir, 'combo-veg-manchuria-paneer-roti-biryani.jpg'),
    extraCopies: [path.join(publicDir, 'combo-family-feast.jpg')],
    dishNames: ['Veg Manchuria + Paneer Butter Masala + 8 Butter Rotis + Half Veg Biryani'],
    galleryTitle: 'Family Feast Combo',
    category: 'Combos',
    publicUrl: '/combo-veg-manchuria-paneer-roti-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478618912.jpg'),
    destFile: path.join(publicDir, 'garlic-butter-naan.jpg'),
    dishNames: ['Garlic Butter Naan', 'Garlic butter naan'],
    galleryTitle: 'Garlic Butter Naan',
    category: 'Roti & Naan',
    publicUrl: '/garlic-butter-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478622983.jpg'),
    destFile: path.join(publicDir, 'plain-naan.jpg'),
    dishNames: ['Plain Naan', 'plain naan'],
    galleryTitle: 'Plain Naan',
    category: 'Roti & Naan',
    publicUrl: '/plain-naan.jpg'
  }
];

// Copy files
console.log('Copying Batch 20 images...');
batch20Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 20...');

  for (const b of batch20Updates) {
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
          order: 195,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 20 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: {
        in: [
          'Cold Drink (300ml)',
          'Mineral Water',
          'Veg Manchuria + Paneer Butter Masala + 8 Butter Rotis + Half Veg Biryani',
          'Garlic Butter Naan',
          'Plain Naan'
        ]
      }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
