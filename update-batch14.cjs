const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch14Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785476342217.jpg'),
    destFile: path.join(publicDir, 'aloo-paratha.jpg'),
    dishNames: ['Aloo Paratha', 'Alu Paratha'],
    galleryTitle: 'Aloo Paratha',
    category: 'Roti & Naan',
    publicUrl: '/aloo-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476344537.jpg'),
    destFile: path.join(publicDir, 'paneer-paratha.jpg'),
    dishNames: ['Paneer Paratha'],
    galleryTitle: 'Paneer Paratha',
    category: 'Roti & Naan',
    publicUrl: '/paneer-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476367453.jpg'),
    destFile: path.join(publicDir, 'laccha-paratha.jpg'),
    extraCopies: [path.join(publicDir, 'lacha-paratha.jpg')],
    dishNames: ['Laccha Paratha', 'Lacha Paratha'],
    galleryTitle: 'Laccha Paratha',
    category: 'Roti & Naan',
    publicUrl: '/laccha-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476380945.jpg'),
    destFile: path.join(publicDir, 'rajasthani-methi-paratha.jpg'),
    dishNames: ['Rajasthani Methi Paratha'],
    galleryTitle: 'Rajasthani Methi Paratha',
    category: 'Roti & Naan',
    publicUrl: '/rajasthani-methi-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476396196.jpg'),
    destFile: path.join(publicDir, 'pudina-paratha.jpg'),
    dishNames: ['Pudina Paratha'],
    galleryTitle: 'Pudina Paratha',
    category: 'Roti & Naan',
    publicUrl: '/pudina-paratha.jpg'
  }
];

// Copy files
console.log('Copying Batch 14 images...');
batch14Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 14...');

  for (const b of batch14Updates) {
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
          order: 165,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 14 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Aloo Paratha', 'Paneer Paratha', 'Laccha Paratha', 'Rajasthani Methi Paratha', 'Pudina Paratha'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
