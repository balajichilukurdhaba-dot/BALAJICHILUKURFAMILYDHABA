const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const brainDir = 'C:\\Users\\shaik\\.gemini\\antigravity-ide\\brain\\aa17fc51-4927-4d39-bf49-2eedc7b8ba69';
const publicDir = path.join(__dirname, 'public');

// 1. Exact mapping of received images to destination files and dish names
const updates = [
  {
    srcFile: path.join(brainDir, 'media__1785472590163.jpg'), // Red tomato soup with cream swirl
    destFile: path.join(publicDir, 'tomato-soup.jpg'),
    exactDishName: 'Tomato Soup (Sweet)',
    galleryTitle: 'Tomato Soup',
    publicUrl: '/tomato-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472598231.jpg'), // Yellow veg corn soup in white bowl
    destFile: path.join(publicDir, 'sweet-corn-soup.jpg'),
    exactDishName: 'Sweet Corn Soup',
    galleryTitle: 'Sweet Corn Soup',
    publicUrl: '/sweet-corn-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472600773.jpg'), // Dark brown soup with spoon
    destFile: path.join(publicDir, 'veg-hot-and-sour-soup.jpg'),
    exactDishName: 'Veg Hot & Sour Soup',
    galleryTitle: 'Veg Hot & Sour Soup',
    publicUrl: '/veg-hot-and-sour-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472603242.jpg'), // Soup in dark bowl with spring onions
    destFile: path.join(publicDir, 'veg-corn-soup.jpg'),
    exactDishName: 'Veg Corn Soup (Sweet)',
    galleryTitle: 'Veg Corn Soup (Sweet)',
    publicUrl: '/veg-corn-soup.jpg'
  },
  {
    srcFile: path.join(brainDir, 'media__1785472605953.jpg'), // Mushroom soup in blue bowl
    destFile: path.join(publicDir, 'mushroom-soup.jpg'),
    exactDishName: 'Mushroom Soup',
    galleryTitle: 'Mushroom Soup',
    publicUrl: '/mushroom-soup.jpg'
  }
];

// Copy images
console.log('Copying images...');
updates.forEach(u => {
  if (fs.existsSync(u.srcFile)) {
    fs.copyFileSync(u.srcFile, u.destFile);
    console.log(`Copied -> ${path.basename(u.destFile)}`);
  }
});

const prisma = new PrismaClient();

async function main() {
  console.log('Updating database records with EXACT matching...');

  for (const u of updates) {
    // Update exact dish by name
    const resDish = await prisma.dish.updateMany({
      where: { name: u.exactDishName },
      data: { image: u.publicUrl }
    });
    console.log(`Updated Dish [${u.exactDishName}]: ${resDish.count} row(s) updated to ${u.publicUrl}`);

    // Update gallery photos matching dish name or title
    const resGal = await prisma.galleryPhoto.updateMany({
      where: {
        OR: [
          { menuDishName: u.exactDishName },
          { title: u.galleryTitle }
        ]
      },
      data: { src: u.publicUrl }
    });
    console.log(`Updated GalleryPhoto [${u.galleryTitle}]: ${resGal.count} row(s) updated to ${u.publicUrl}`);
  }

  // Also update Cream Up Mushroom Soup (Sweet) to /mushroom-soup.jpg
  await prisma.dish.updateMany({
    where: { name: 'Cream Up Mushroom Soup (Sweet)' },
    data: { image: '/mushroom-soup.jpg' }
  });

  console.log('\n--- VERIFYING UPDATED SOUPS IN DB ---');
  const soups = await prisma.dish.findMany({
    where: {
      category: { name: { contains: 'Soup', mode: 'insensitive' } }
    }
  });
  soups.forEach(s => console.log(`Dish: "${s.name}" => "${s.image}"`));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
