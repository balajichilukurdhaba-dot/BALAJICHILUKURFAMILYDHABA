const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch11Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785475782009.jpg'),
    destFile: path.join(publicDir, 'paneer-kasha-masala.jpg'),
    dishNames: ['Paneer Kasha Masala'],
    galleryTitle: 'Paneer Kasha Masala',
    publicUrl: '/paneer-kasha-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475790453.jpg'),
    destFile: path.join(publicDir, 'zilmil-paneer.jpg'),
    extraCopies: [path.join(publicDir, 'zilmil-veg.jpg')],
    dishNames: ['ZilMil Paneer', 'Zilmil Veg'],
    galleryTitle: 'ZilMil Paneer',
    publicUrl: '/zilmil-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475793676.jpg'),
    destFile: path.join(publicDir, 'veg-mandakini.jpg'),
    dishNames: ['Veg Mandakini'],
    galleryTitle: 'Veg Mandakini',
    publicUrl: '/veg-mandakini.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475846261.jpg'),
    destFile: path.join(publicDir, 'kandhari-veg.jpg'),
    extraCopies: [path.join(publicDir, 'kandari-veg.jpg')],
    dishNames: ['Kandhari Veg'],
    galleryTitle: 'Kandhari Veg',
    publicUrl: '/kandhari-veg.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785475849487.jpg'),
    destFile: path.join(publicDir, 'haryali-methi-chaman.jpg'),
    extraCopies: [path.join(publicDir, 'hariyali-methi-chaman.jpg')],
    dishNames: ['Haryali Methi Chaman'],
    galleryTitle: 'Haryali Methi Chaman',
    publicUrl: '/haryali-methi-chaman.jpg'
  }
];

// Copy files
console.log('Copying Batch 11 images...');
batch11Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 11...');

  for (const b of batch11Updates) {
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
          menuCategory: 'Veg Curries',
          menuDishName: b.dishNames[0],
          order: 150,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 11 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Paneer Kasha Masala', 'ZilMil Paneer', 'Zilmil Veg', 'Veg Mandakini', 'Kandhari Veg', 'Haryali Methi Chaman'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
