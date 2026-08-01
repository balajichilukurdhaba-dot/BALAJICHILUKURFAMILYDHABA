const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch33Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785481919597.jpg'),
    destFile: path.join(publicDir, 'kashmiri-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'kashmiri-pullaw.jpg')],
    dishNames: ['Kashmiri Pulao (Sweet)', 'Kashmiri Pullaw (Sweet)'],
    galleryTitle: 'Kashmiri Pulao (Sweet)',
    category: 'Pulao',
    price: "210",
    publicUrl: '/kashmiri-pulao.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481922143.jpg'),
    destFile: path.join(publicDir, 'punjabi-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'punjabi-pullaw.jpg')],
    dishNames: ['Punjabi Pulao', 'Punjabi Pullaw'],
    galleryTitle: 'Punjabi Pulao',
    category: 'Pulao',
    price: "185",
    publicUrl: '/punjabi-pulao.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481924869.jpg'),
    destFile: path.join(publicDir, 'paneer-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'paneer-pullaw.jpg')],
    dishNames: ['Paneer Pulao', 'Paneer Pullaw'],
    galleryTitle: 'Paneer Pulao',
    category: 'Pulao',
    price: "200",
    publicUrl: '/paneer-pulao.jpg'
  }
];

// Copy files
console.log('Copying Batch 33 images...');
batch33Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 33...');

  for (const b of batch33Updates) {
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
          order: 320,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 33 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Kashmiri Pulao (Sweet)', 'Punjabi Pulao', 'Paneer Pulao'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
