const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

const imagesMap = [
  {
    srcFile: path.join(brainDir, 'media__1785472590163.jpg'),
    destFile: path.join(publicDir, 'tomato-soup.jpg'),
    dishName: 'Tomato Soup (Sweet)',
    galleryTitle: 'Tomato Soup',
    publicUrl: '/tomato-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472598231.jpg'),
    destFile: path.join(publicDir, 'sweet-corn-soup.jpg'),
    dishName: 'Sweet Corn Soup',
    galleryTitle: 'Sweet Corn Soup',
    publicUrl: '/sweet-corn-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472600773.jpg'),
    destFile: path.join(publicDir, 'veg-hot-and-sour-soup.jpg'),
    dishName: 'Veg Hot & Sour Soup',
    galleryTitle: 'Veg Hot & Sour Soup',
    publicUrl: '/veg-hot-and-sour-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472603242.jpg'),
    destFile: path.join(publicDir, 'veg-corn-soup.jpg'),
    dishName: 'Veg Corn Soup (Sweet)',
    galleryTitle: 'Veg Corn Soup (Sweet)',
    publicUrl: '/veg-corn-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472605953.jpg'),
    destFile: path.join(publicDir, 'mushroom-soup.jpg'),
    dishName: 'Mushroom Soup',
    galleryTitle: 'Mushroom Soup',
    publicUrl: '/mushroom-soup.jpg'
  }
];

// 1. Copy image files
console.log('Copying images to public directory...');
imagesMap.forEach(item => {
  if (fs.existsSync(item.srcFile)) {
    fs.copyFileSync(item.srcFile, item.destFile);
    console.log(`Copied ${path.basename(item.srcFile)} -> ${path.basename(item.destFile)}`);
  } else {
    console.error(`Source file not found: ${item.srcFile}`);
  }
});

// 2. Update Database via Prisma
const prisma = new PrismaClient();

async function updateDatabase() {
  console.log('Updating database records...');

  for (const item of imagesMap) {
    // Update dish
    const updatedDish = await prisma.dish.updateMany({
      where: {
        name: {
          contains: item.dishName.split(' ')[0],
          mode: 'insensitive'
        }
      },
      data: {
        image: item.publicUrl
      }
    }).catch(err => console.error(`Failed to update dish ${item.dishName}:`, err.message));

    // Also update exact dish match
    await prisma.dish.updateMany({
      where: { name: item.dishName },
      data: { image: item.publicUrl }
    }).catch(() => {});

    console.log(`Updated DB dish image for ${item.dishName} -> ${item.publicUrl}`);

    // Update gallery photo if exists, or upsert
    const existingPhoto = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { title: { contains: item.galleryTitle, mode: 'insensitive' } },
          { menuDishName: { contains: item.galleryTitle, mode: 'insensitive' } }
        ]
      }
    });

    if (existingPhoto) {
      await prisma.galleryPhoto.update({
        where: { id: existingPhoto.id },
        data: { src: item.publicUrl }
      });
      console.log(`Updated DB gallery photo ${existingPhoto.title} -> ${item.publicUrl}`);
    } else {
      await prisma.galleryPhoto.create({
        data: {
          src: item.publicUrl,
          title: item.galleryTitle,
          menuCategory: 'Soups',
          menuDishName: item.dishName,
          order: 100,
          altText: item.galleryTitle,
          isFeatured: true,
          albumName: 'General'
        }
      });
      console.log(`Created DB gallery photo ${item.galleryTitle} -> ${item.publicUrl}`);
    }
  }

  // Also update "Cream Up Mushroom Soup (Sweet)" to use mushroom-soup.jpg
  await prisma.dish.updateMany({
    where: { name: 'Cream Up Mushroom Soup (Sweet)' },
    data: { image: '/mushroom-soup.jpg' }
  }).catch(() => {});

  console.log('Database updates completed successfully!');
}

updateDatabase()
  .catch(err => console.error('Error updating DB:', err))
  .finally(() => prisma.$disconnect());
