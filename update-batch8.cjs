const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const batch8Updates = [
  {
    srcFile: path.join(brainDir, 'media__1785474887224.jpg'),
    destFile: path.join(publicDir, 'chilkur-special-paneer.jpg'),
    extraCopies: [path.join(publicDir, 'paneer-sangai.jpg')],
    dishName: 'Chilkur Special Paneer',
    galleryTitle: 'Chilkur Special Paneer',
    publicUrl: '/chilkur-special-paneer.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785474908045.jpg'),
    destFile: path.join(publicDir, 'chilkur-special-veg.jpg'),
    dishName: 'Chilkur Special Veg',
    galleryTitle: 'Chilkur Special Veg',
    publicUrl: '/chilkur-special-veg.jpg'
  }
];

// Copy files
console.log('Copying Batch 8 images...');
batch8Updates.forEach(b => {
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
  console.log('\nUpdating DB records for Batch 8...');

  for (const b of batch8Updates) {
    const updated = await prisma.dish.updateMany({
      where: { name: b.dishName },
      data: { image: b.publicUrl }
    });
    console.log(`Updated Dish ["${b.dishName}"]: ${updated.count} row(s) -> ${b.publicUrl}`);

    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { title: { contains: b.galleryTitle, mode: 'insensitive' } },
          { menuDishName: b.dishName }
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
          menuCategory: 'Special Starters',
          menuDishName: b.dishName,
          order: 135,
          altText: b.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created GalleryPhoto ["${b.galleryTitle}"] -> ${b.publicUrl}`);
    }
  }

  console.log('\n--- VERIFYING BATCH 8 DB UPDATES ---');
  const allDishes = await prisma.dish.findMany({
    where: {
      name: { in: batch8Updates.map(b => b.dishName) }
    }
  });

  allDishes.forEach(d => console.log(`Dish: "${d.name}" => "${d.image}"`));
}

runUpdates()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
