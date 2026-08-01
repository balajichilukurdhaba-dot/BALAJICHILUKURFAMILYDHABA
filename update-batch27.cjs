const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch27Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785480566095.jpg'),
    destFile: path.join(publicDir, 'mutter-mushroom-masala.jpg'),
    dishNames: ['Mutter Mushroom Masala'],
    galleryTitle: 'Mutter Mushroom Masala',
    category: 'Mushroom Specialities',
    price: "190",
    publicUrl: '/mutter-mushroom-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480568507.jpg'),
    destFile: path.join(publicDir, 'marwadi-veg.jpg'),
    dishNames: ['Marwadi Veg', 'Marwadi Veg.'],
    galleryTitle: 'Marwadi Veg.',
    category: 'Veg Curries',
    price: "185",
    publicUrl: '/marwadi-veg.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480571137.jpg'),
    destFile: path.join(publicDir, 'mushroom-masala.jpg'),
    dishNames: ['Mushroom Masala'],
    galleryTitle: 'Mushroom Masala',
    category: 'Mushroom Specialities',
    price: "180",
    publicUrl: '/mushroom-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480574183.jpg'),
    destFile: path.join(publicDir, 'mushroom-paneer.jpg'),
    dishNames: ['Mushroom Paneer'],
    galleryTitle: 'Mushroom Paneer',
    category: 'Mushroom Specialities',
    price: "200",
    publicUrl: '/mushroom-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480575964.jpg'),
    destFile: path.join(publicDir, 'methi-chaman.jpg'),
    extraCopies: [path.join(publicDir, 'haryali-methi-chaman.jpg')],
    dishNames: ['Methi Chaman', 'Haryali Methi Chaman', 'Methi Chamman'],
    galleryTitle: 'Methi Chaman',
    category: 'Special Veg Curries',
    price: "195",
    publicUrl: '/methi-chaman.jpg'
  }
];

// Copy files
console.log('Copying Batch 27 images...');
batch27Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 27...');

  for (const b of batch27Updates) {
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
            description: `Aromatic & delicious ${b.galleryTitle}.`,
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
          order: 260,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 27 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Mutter Mushroom Masala', 'Marwadi Veg', 'Mushroom Masala', 'Mushroom Paneer', 'Methi Chaman'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
