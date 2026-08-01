const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch15Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785476553179.jpg'),
    destFile: path.join(publicDir, 'rajasthani-methi-paratha.jpg'),
    dishNames: ['Rajasthani Methi Paratha'],
    galleryTitle: 'Rajasthani Methi Paratha',
    category: 'Roti & Naan',
    publicUrl: '/rajasthani-methi-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476556721.jpg'),
    destFile: path.join(publicDir, 'masala-kulcha.jpg'),
    dishNames: ['Masala Kulcha'],
    galleryTitle: 'Masala Kulcha',
    category: 'Roti & Naan',
    publicUrl: '/masala-kulcha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476559510.jpg'),
    destFile: path.join(publicDir, 'paneer-kulcha.jpg'),
    dishNames: ['Paneer Kulcha'],
    galleryTitle: 'Paneer Kulcha',
    category: 'Roti & Naan',
    publicUrl: '/paneer-kulcha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476562396.jpg'),
    destFile: path.join(publicDir, 'pudina-paratha.jpg'),
    dishNames: ['Pudina Paratha'],
    galleryTitle: 'Pudina Paratha',
    category: 'Roti & Naan',
    publicUrl: '/pudina-paratha.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785476565408.jpg'),
    destFile: path.join(publicDir, 'plain-rice.jpg'),
    extraCopies: [path.join(publicDir, 'steamed-rice.jpg')],
    dishNames: ['Plain Rice'],
    galleryTitle: 'Plain Rice',
    category: 'Rice Dishes',
    publicUrl: '/plain-rice.jpg'
  }
];

// Copy files
console.log('Copying Batch 15 images...');
batch15Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 15...');

  for (const b of batch15Updates) {
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
          order: 170,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 15 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: ['Rajasthani Methi Paratha', 'Masala Kulcha', 'Paneer Kulcha', 'Pudina Paratha', 'Plain Rice'] }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
