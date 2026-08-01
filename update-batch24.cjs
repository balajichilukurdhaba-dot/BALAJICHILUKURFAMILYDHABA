const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch24Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785479707493.jpg'),
    destFile: path.join(publicDir, 'shahi-paneer.jpg'),
    dishNames: ['Shahi Paneer (Sweet)', 'Shahi Paneer'],
    galleryTitle: 'Shahi Paneer',
    category: 'Paneer Specialities',
    price: "240",
    publicUrl: '/shahi-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479708887.jpg'),
    destFile: path.join(publicDir, 'schezwan-handi-paneer.jpg'),
    dishNames: ['Schezwan Handi Paneer'],
    galleryTitle: 'Schezwan Handi Paneer',
    category: 'Paneer Specialities',
    price: "250",
    publicUrl: '/schezwan-handi-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479711227.jpg'),
    destFile: path.join(publicDir, 'soya-chaap-paneer.jpg'),
    dishNames: ['Soya Chaap Paneer'],
    galleryTitle: 'Soya Chaap Paneer',
    category: 'Paneer Specialities',
    price: "230",
    publicUrl: '/soya-chaap-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479713255.jpg'),
    destFile: path.join(publicDir, 'tomato-chutney.jpg'),
    dishNames: ['Tomato Chutney'],
    galleryTitle: 'Tomato Chutney',
    category: 'Accompaniments',
    price: "120",
    publicUrl: '/tomato-chutney.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479716380.jpg'),
    destFile: path.join(publicDir, 'tomato-curry.jpg'),
    dishNames: ['Tomato Curry'],
    galleryTitle: 'Tomato Curry',
    category: 'Main Course Veg',
    price: "160",
    publicUrl: '/tomato-curry.jpg'
  }
];

// Copy files
console.log('Copying Batch 24 images...');
batch24Updates.forEach(b => {
  if (fs.existsSync(b.srcFile)) {
    fs.copyFileSync(b.srcFile, b.destFile);
    console.log(`Copied ${path.basename(b.srcFile)} -> ${path.basename(b.destFile)}`);
  } else {
    console.error(`Source missing: ${b.srcFile}`);
  }
});

const prisma = new PrismaClient();

async function runUpdates() {
  console.log('\nUpdating DB records for Batch 24...');

  for (const b of batch24Updates) {
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
            description: `Flavorful homemade ${b.galleryTitle}.`,
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
          order: 230,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 24 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Shahi Paneer (Sweet)', 'Schezwan Handi Paneer', 'Soya Chaap Paneer', 'Tomato Chutney', 'Tomato Curry'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
