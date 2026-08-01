const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch32Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785481615598.jpg'),
    destFile: path.join(publicDir, 'kaju-fried-rice.jpg'),
    dishNames: ['Kaju Fried Rice'],
    galleryTitle: 'Kaju Fried Rice',
    category: 'Fried Rice',
    price: "190",
    publicUrl: '/kaju-fried-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481622691.jpg'),
    destFile: path.join(publicDir, 'dum-biryani-alt.jpg'),
    extraCopies: [path.join(publicDir, 'dum-biryani.jpg')],
    dishNames: ['Dum Biryani'],
    galleryTitle: 'Special Dum Biryani',
    category: 'Biryani',
    price: "200",
    publicUrl: '/dum-biryani-alt.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481654532.jpg'),
    destFile: path.join(publicDir, 'paneer-fried-rice.jpg'),
    dishNames: ['Paneer Fried Rice'],
    galleryTitle: 'Paneer Fried Rice',
    category: 'Fried Rice',
    price: "185",
    publicUrl: '/paneer-fried-rice.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481675463.jpg'),
    destFile: path.join(publicDir, 'veg-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'veg-pullaw.jpg')],
    dishNames: ['Veg Pulao', 'Veg. Pullaw'],
    galleryTitle: 'Veg Pulao',
    category: 'Pulao',
    price: "170",
    publicUrl: '/veg-pulao.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481687864.jpg'),
    destFile: path.join(publicDir, 'corn-kaju-pulao.jpg'),
    extraCopies: [path.join(publicDir, 'corn-kaju-pullaw.jpg')],
    dishNames: ['Corn Kaju Pulao', 'Corn Kaju Pullaw'],
    galleryTitle: 'Corn Kaju Pulao',
    category: 'Pulao',
    price: "195",
    publicUrl: '/corn-kaju-pulao.jpg'
  }
];

// Copy files
console.log('Copying Batch 32 images...');
batch32Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 32...');

  for (const b of batch32Updates) {
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
          order: 310,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 32 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Kaju Fried Rice', 'Dum Biryani', 'Paneer Fried Rice', 'Veg Pulao', 'Corn Kaju Pulao'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
