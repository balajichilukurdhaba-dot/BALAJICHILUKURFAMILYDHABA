const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch29Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785480950502.jpg'),
    destFile: path.join(publicDir, 'paneer-chatpata.jpg'),
    dishNames: ['Paneer Chatpata', 'paneer chatpata'],
    galleryTitle: 'Paneer Chatpata',
    category: 'Paneer Specialities',
    price: "240",
    publicUrl: '/paneer-chatpata.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480953571.jpg'),
    destFile: path.join(publicDir, 'paneer-makhanwala.jpg'),
    dishNames: ['Paneer Makhanwala', 'paneer makhanwala'],
    galleryTitle: 'Paneer Makhanwala',
    category: 'Paneer Specialities',
    price: "230",
    publicUrl: '/paneer-makhanwala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480961205.jpg'),
    destFile: path.join(publicDir, 'paneer-do-pyaza.jpg'),
    dishNames: ['Paneer Do Pyaza', 'paneer do pyaza'],
    galleryTitle: 'Paneer Do Pyaza',
    category: 'Paneer Specialities',
    price: "235",
    publicUrl: '/paneer-do-pyaza.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480968088.jpg'),
    destFile: path.join(publicDir, 'veg-biryani.jpg'),
    extraCopies: [path.join(publicDir, 'veg-biryani-main.jpg')],
    dishNames: ['Veg Biryani', 'Veg. Biryani'],
    galleryTitle: 'Veg Biryani',
    category: 'Biryani',
    price: "180",
    publicUrl: '/veg-biryani.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785480971237.jpg'),
    destFile: path.join(publicDir, 'veg-biryani-2.jpg'),
    dishNames: [],
    galleryTitle: 'Special Veg Biryani Bowl',
    category: 'Biryani',
    price: "180",
    publicUrl: '/veg-biryani-2.jpg'
  }
];

// Copy files
console.log('Copying Batch 29 images...');
batch29Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 29...');

  for (const b of batch29Updates) {
    if (b.dishNames.length > 0) {
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
              description: `Authentic house special ${b.galleryTitle}.`,
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
          menuDishName: b.dishNames[0] || 'Veg Biryani',
          order: 280,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 29 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Paneer Chatpata', 'Paneer Makhanwala', 'Paneer Do Pyaza', 'Veg Biryani'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
