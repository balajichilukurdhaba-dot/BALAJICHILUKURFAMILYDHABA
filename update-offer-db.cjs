require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING ONLINE BOOKING OFFER IMAGE IN DB ===\n');

  // 1. Update in offers table
  const updated = await prisma.offer.updateMany({
    where: {
      OR: [
        { title: { contains: '10%', mode: 'insensitive' } },
        { title: { contains: 'Online Bookings', mode: 'insensitive' } },
        { link: { contains: 'reserve', mode: 'insensitive' } }
      ]
    },
    data: {
      image: '/online-booking-offer.jpg'
    }
  });
  console.log(`Updated ${updated.count} offer record(s) in DB to /online-booking-offer.jpg`);

  // 2. Also add this photo to gallery_photos under Restaurant & Ambience
  const existingGallery = await prisma.galleryPhoto.findFirst({
    where: {
      OR: [
        { src: '/online-booking-offer.jpg' },
        { src: '/dhaba-dining-hall.jpg' },
        { title: { contains: 'Main Dining Hall', mode: 'insensitive' } }
      ]
    }
  });

  if (existingGallery) {
    await prisma.galleryPhoto.update({
      where: { id: existingGallery.id },
      data: {
        src: '/online-booking-offer.jpg',
        title: 'Balaji Chilkur Dhaba - Main Dining Hall & Booths',
        isFeatured: true,
        albumName: 'Restaurant & Ambience'
      }
    });
    console.log(`Updated gallery photo [${existingGallery.id}] to /online-booking-offer.jpg`);
  } else {
    const newG = await prisma.galleryPhoto.create({
      data: {
        src: '/online-booking-offer.jpg',
        title: 'Balaji Chilkur Dhaba - Main Dining Hall & Booths',
        isFeatured: true,
        order: 2,
        albumName: 'Restaurant & Ambience',
        altText: 'Balaji Chilkur Family Dhaba spacious interior dining hall with cushioned booths and tables'
      }
    });
    console.log(`Added new gallery photo [${newG.id}] for dining hall`);
  }

  console.log('\n=== UPDATE COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
