const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch25Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785480016616.jpg'),
    destFile: path.join(publicDir, 'veg-korma.jpg'),
    dishNames: ['Veg Korma'],
    galleryTitle: 'Veg Korma',
    category: 'Veg Curries',
    price: "180",
    publicUrl: '/veg-korma.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480019879.jpg'),
    destFile: path.join(publicDir, 'veg-kheema-masala.jpg'),
    extraCopies: [path.join(publicDir, 'veg-keema-masala.jpg')],
    dishNames: ['Veg Keema Masala', 'Veg Kheema Masala'],
    galleryTitle: 'Veg Kheema Masala',
    category: 'Veg Curries',
    price: "190",
    publicUrl: '/veg-kheema-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480022985.jpg'),
    destFile: path.join(publicDir, 'veg-garlic.jpg'),
    dishNames: ['Veg Garlic'],
    galleryTitle: 'Veg Garlic',
    category: 'Veg Curries',
    price: "185",
    publicUrl: '/veg-garlic.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480027603.jpg'),
    destFile: path.join(publicDir, 'veg-do-pyaza.jpg'),
    dishNames: ['Veg Do Pyaza'],
    galleryTitle: 'Veg Do Pyaza',
    category: 'Veg Curries',
    price: "185",
    publicUrl: '/veg-do-pyaza.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480030624.jpg'),
    destFile: path.join(publicDir, 'veg-kolhapuri.jpg'),
    dishNames: ['Veg Kolhapuri'],
    galleryTitle: 'Veg Kolhapuri',
    category: 'Veg Curries',
    price: "190",
    publicUrl: '/veg-kolhapuri.jpg'
  }
];

// Copy files
console.log('Copying Batch 25 images...');
batch25Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 25...');

  for (const b of batch25Updates) {
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
    } else {
      const parentCategory = await prisma.category.findFirst({
        where: { name: { contains: b.category, mode: 'insensitive' } }
      });

      if (parentCategory) {
        const created = await prisma.dish.create({
          data: {
            name: b.dishNames[0],
            description: `Delicious house special ${b.galleryTitle}.`,
            price: b.price,
            image: b.publicUrl,
            categoryId: parentCategory.id,
            isVegetarian: true,
            isOutOfStock: false
          }
        });
        console.log(`Created new Dish ["${created.name}"] -> ${b.publicUrl}`);
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
          order: 240,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 25 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Veg Korma', 'Veg Keema Masala', 'Veg Garlic', 'Veg Do Pyaza', 'Veg Kolhapuri'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
