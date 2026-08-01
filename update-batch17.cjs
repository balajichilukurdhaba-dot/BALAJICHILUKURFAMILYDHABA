const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch17Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785477055032.jpg'),
    destFile: path.join(publicDir, 'roasted-papad.jpg'),
    dishNames: ['Roasted Papad'],
    galleryTitle: 'Roasted Papad',
    category: 'Accompaniments',
    publicUrl: '/roasted-papad.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785477057250.jpg'),
    destFile: path.join(publicDir, 'fry-papad.jpg'),
    extraCopies: [path.join(publicDir, 'fried-papad.jpg')],
    dishNames: ['Fry Papad'],
    galleryTitle: 'Fry Papad',
    category: 'Accompaniments',
    publicUrl: '/fry-papad.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785477059441.jpg'),
    destFile: path.join(publicDir, 'butter-papad.jpg'),
    dishNames: ['Butter Papad'],
    galleryTitle: 'Butter Papad',
    category: 'Accompaniments',
    publicUrl: '/butter-papad.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785477062774.jpg'),
    destFile: path.join(publicDir, 'masala-papad.jpg'),
    dishNames: ['Masala Papad'],
    galleryTitle: 'Masala Papad',
    category: 'Accompaniments',
    publicUrl: '/masala-papad.jpg'
  }
];

// Copy files
console.log('Copying Batch 17 images...');
batch17Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 17...');

  for (const b of batch17Updates) {
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
          order: 180,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 17 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Roasted Papad', 'Fry Papad', 'Butter Papad', 'Masala Papad'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
