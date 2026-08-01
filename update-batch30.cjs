const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch30Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785481227007.jpg'),
    destFile: path.join(publicDir, 'dum-biryani.jpg'),
    dishNames: ['Dum Biryani', 'Veg Dum Biryani'],
    galleryTitle: 'Veg Dum Biryani',
    category: 'Biryani',
    price: "200",
    publicUrl: '/dum-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481235100.jpg'),
    destFile: path.join(publicDir, 'paneer-biryani.jpg'),
    dishNames: ['Paneer Biryani'],
    galleryTitle: 'Paneer Biryani',
    category: 'Biryani',
    price: "230",
    publicUrl: '/paneer-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481243301.jpg'),
    destFile: path.join(publicDir, 'kaju-biryani.jpg'),
    dishNames: ['Kaju Biryani'],
    galleryTitle: 'Kaju Biryani',
    category: 'Biryani',
    price: "240",
    publicUrl: '/kaju-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481254176.jpg'),
    destFile: path.join(publicDir, 'mushroom-biryani.jpg'),
    dishNames: ['Mushroom Biryani'],
    galleryTitle: 'Mushroom Biryani',
    category: 'Biryani',
    price: "220",
    publicUrl: '/mushroom-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785481263743.jpg'),
    destFile: path.join(publicDir, 'kaju-paneer-biryani.jpg'),
    dishNames: ['Kaju Paneer Biryani'],
    galleryTitle: 'Kaju Paneer Biryani',
    category: 'Biryani',
    price: "260",
    publicUrl: '/kaju-paneer-biryani.jpg'
  }
];

// Copy files
console.log('Copying Batch 30 images...');
batch30Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 30...');

  for (const b of batch30Updates) {
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
          order: 290,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 30 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Dum Biryani', 'Paneer Biryani', 'Kaju Biryani', 'Mushroom Biryani', 'Kaju Paneer Biryani'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
