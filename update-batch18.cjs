const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch18Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785478233470.jpg'),
    destFile: path.join(publicDir, 'special-punjabi-papad.jpg'),
    dishNames: ['Special Punjabi Papad'],
    galleryTitle: 'Special Punjabi Papad',
    category: 'Accompaniments',
    publicUrl: '/special-punjabi-papad.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478244291.jpg'),
    destFile: path.join(publicDir, 'mix-raita.jpg'),
    dishNames: ['Mix Raita'],
    galleryTitle: 'Mix Raita',
    category: 'Accompaniments',
    publicUrl: '/mix-raita.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478251634.jpg'),
    destFile: path.join(publicDir, 'onion-raita.jpg'),
    dishNames: ['Onion Raita'],
    galleryTitle: 'Onion Raita',
    category: 'Accompaniments',
    publicUrl: '/onion-raita.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478264507.jpg'),
    destFile: path.join(publicDir, 'boondi-raita.jpg'),
    extraCopies: [path.join(publicDir, 'bundi-raita.jpg')],
    dishNames: ['Boondi Raita'],
    galleryTitle: 'Boondi Raita',
    category: 'Accompaniments',
    publicUrl: '/boondi-raita.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785478274911.jpg'),
    destFile: path.join(publicDir, 'curd-dahi.jpg'),
    extraCopies: [path.join(publicDir, 'curd.jpg')],
    dishNames: ['Curd (Dahi)'],
    galleryTitle: 'Curd (Dahi)',
    category: 'Accompaniments',
    publicUrl: '/curd-dahi.jpg'
  }
];

// Copy files
console.log('Copying Batch 18 images...');
batch18Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 18...');

  for (const b of batch18Updates) {
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
          order: 185,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 18 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Special Punjabi Papad', 'Mix Raita', 'Onion Raita', 'Boondi Raita', 'Curd (Dahi)'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
