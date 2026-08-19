require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ADDING INTERIOR PHOTO TO DATABASE ===\n');

  // Check if already exists
  const existing = await prisma.galleryPhoto.findFirst({
    where: {
      OR: [
        { src: '/dhaba-interior-dining.jpg' },
        { src: '/dhaba-family-section.jpg' },
        { title: { contains: 'Family Section', mode: 'insensitive' } }
      ]
    }
  });

  if (existing) {
    await prisma.galleryPhoto.update({
      where: { id: existing.id },
      data: {
        src: '/dhaba-interior-dining.jpg',
        title: 'Balaji Chilkur Dhaba - Family Section Dining',
        isFeatured: true,
        albumName: 'Restaurant & Ambience',
        altText: 'Balaji Chilkur Family Dhaba comfortable interior dining with plush blue chairs'
      }
    });
    console.log(`Updated gallery photo [${existing.id}] to /dhaba-interior-dining.jpg`);
  } else {
    const newPhoto = await prisma.galleryPhoto.create({
      data: {
        src: '/dhaba-interior-dining.jpg',
        title: 'Balaji Chilkur Dhaba - Family Section Dining',
        isFeatured: true,
        order: 1,
        albumName: 'Restaurant & Ambience',
        altText: 'Balaji Chilkur Family Dhaba comfortable interior dining with plush blue chairs'
      }
    });
    console.log(`Added new gallery photo [${newPhoto.id}] with /dhaba-interior-dining.jpg`);
  }

  console.log('\n=== DB OPERATION COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
