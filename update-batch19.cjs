const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch19Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785478405195.jpg'),
    destFile: path.join(publicDir, 'butter-milk.jpg'),
    dishNames: ['Butter Milk'],
    galleryTitle: 'Butter Milk',
    category: 'Beverages',
    publicUrl: '/butter-milk.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478411966.jpg'),
    destFile: path.join(publicDir, 'sweet-lassi.jpg'),
    extraCopies: [path.join(publicDir, 'lassi-sweet.jpg')],
    dishNames: ['Lassi Sweet', 'Sweet Lassi'],
    galleryTitle: 'Sweet Lassi',
    category: 'Beverages',
    publicUrl: '/sweet-lassi.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478415600.jpg'),
    destFile: path.join(publicDir, 'salted-lassi.jpg'),
    extraCopies: [path.join(publicDir, 'lassi-salted.jpg')],
    dishNames: ['Lassi Salted', 'Salted Lassi'],
    galleryTitle: 'Salted Lassi',
    category: 'Beverages',
    publicUrl: '/salted-lassi.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478418432.jpg'),
    destFile: path.join(publicDir, 'fresh-lime-soda-sweet.jpg'),
    dishNames: ['Fresh Lime Soda (Sweet)'],
    galleryTitle: 'Fresh Lime Soda (Sweet)',
    category: 'Beverages',
    publicUrl: '/fresh-lime-soda-sweet.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478421847.jpg'),
    destFile: path.join(publicDir, 'fresh-lime-soda-salt.jpg'),
    extraCopies: [path.join(publicDir, 'fresh-lime-soda-salted.jpg')],
    dishNames: ['Fresh Lime Soda (Salt)', 'Fresh Lime Soda (Salted)'],
    galleryTitle: 'Fresh Lime Soda (Salted)',
    category: 'Beverages',
    publicUrl: '/fresh-lime-soda-salt.jpg'
  }
];

// Copy files
console.log('Copying Batch 19 images...');
batch19Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 19...');

  for (const b of batch19Updates) {
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
          order: 190,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 19 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Butter Milk', 'Lassi Sweet', 'Lassi Salted', 'Fresh Lime Soda (Sweet)', 'Fresh Lime Soda (Salt)'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
