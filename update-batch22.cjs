const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch22Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785479181920.jpg'),
    destFile: path.join(publicDir, 'stuff-naan.jpg'),
    extraCopies: [path.join(publicDir, 'stuffed-naan.jpg')],
    dishNames: ['Stuff Naan', 'Stuff naan'],
    galleryTitle: 'Stuff Naan',
    category: 'Roti & Naan',
    publicUrl: '/stuff-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479184849.jpg'),
    destFile: path.join(publicDir, 'kothmir-butter-naan.jpg'),
    dishNames: ['Kothmir Butter Naan', 'Kothmir butter naan'],
    galleryTitle: 'Kothmir Butter Naan',
    category: 'Roti & Naan',
    publicUrl: '/kothmir-butter-naan.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479204317.jpg'),
    destFile: path.join(publicDir, 'paneer-bhurji.jpg'),
    dishNames: ['Paneer Bhurji', 'Paneer bhurji'],
    galleryTitle: 'Paneer Bhurji',
    category: 'Paneer Specialities',
    publicUrl: '/paneer-bhurji.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479209292.jpg'),
    destFile: path.join(publicDir, 'paneer-patiala.jpg'),
    dishNames: ['Paneer Patiala (Sweet)', 'Paneer Patiala'],
    galleryTitle: 'Paneer Patiala',
    category: 'Paneer Specialities',
    publicUrl: '/paneer-patiala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479212613.jpg'),
    destFile: path.join(publicDir, 'paneer-tikka-masala.jpg'),
    dishNames: ['Paneer Tikka Masala'],
    galleryTitle: 'Paneer Tikka Masala',
    category: 'Paneer Specialities',
    publicUrl: '/paneer-tikka-masala.jpg'
  }
];

// Copy files
console.log('Copying Batch 22 images...');
batch22Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 22...');

  for (const b of batch22Updates) {
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
          order: 210,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 22 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Stuff Naan', 'Kothmir Butter Naan', 'Paneer Bhurji', 'Paneer Patiala (Sweet)', 'Paneer Tikka Masala'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
