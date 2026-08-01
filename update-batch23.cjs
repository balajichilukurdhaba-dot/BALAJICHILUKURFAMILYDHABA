const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch23Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785479381714.jpg'),
    destFile: path.join(publicDir, 'tadka-paneer.jpg'),
    dishNames: ['Tadka Paneer'],
    galleryTitle: 'Tadka Paneer',
    category: 'Paneer Specialities',
    publicUrl: '/tadka-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479388468.jpg'),
    destFile: path.join(publicDir, 'tadka-mushroom.jpg'),
    dishNames: ['Tadka Mushroom'],
    galleryTitle: 'Tadka Mushroom',
    category: 'Mushroom Specialities',
    publicUrl: '/tadka-mushroom.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479393301.jpg'),
    destFile: path.join(publicDir, 'stuff-capsicum-masala.jpg'),
    extraCopies: [path.join(publicDir, 'stuffed-capsicum-masala.jpg')],
    dishNames: ['Stuff Capsicum Masala', 'Stuffed Capsicum Masala'],
    galleryTitle: 'Stuffed Capsicum Masala',
    category: 'Main Course Veg',
    publicUrl: '/stuff-capsicum-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479396592.jpg'),
    destFile: path.join(publicDir, 'stuff-tomato-masala.jpg'),
    extraCopies: [path.join(publicDir, 'stuffed-tomato-masala.jpg')],
    dishNames: ['Stuff Tomato Masala', 'Stuffed Tomato Masala'],
    galleryTitle: 'Stuffed Tomato Masala',
    category: 'Main Course Veg',
    publicUrl: '/stuff-tomato-masala.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785479399899.jpg'),
    destFile: path.join(publicDir, 'punjabi-gobhi-masala.jpg'),
    extraCopies: [path.join(publicDir, 'special-punjabi-gobhi-masala.jpg')],
    dishNames: ['Punjabi Gobhi Masala', 'Special Punjabi Gobhi Masala'],
    galleryTitle: 'Special Punjabi Gobhi Masala',
    category: 'Main Course Veg',
    publicUrl: '/punjabi-gobhi-masala.jpg'
  }
];

// Copy files
console.log('Copying Batch 23 images...');
batch23Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 23...');

  for (const b of batch23Updates) {
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
          order: 220,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 23 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Tadka Paneer', 'Tadka Mushroom', 'Stuff Capsicum Masala', 'Stuff Tomato Masala', 'Punjabi Gobhi Masala'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
