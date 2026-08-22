require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE TABLES & ROW COUNTS ===');
  console.log('Branches:', await prisma.branch.count());
  console.log('Categories:', await prisma.category.count());
  console.log('Dishes:', await prisma.dish.count());
  console.log('GalleryPhotos:', await prisma.galleryPhoto.count());
  console.log('Testimonials:', await prisma.testimonial.count());
  console.log('Offers:', await prisma.offer.count());
  console.log('Reservations:', await prisma.reservation.count());
  console.log('WhatsAppOrders:', await prisma.whatsAppOrder.count());
  console.log('ContactMessages:', await prisma.contactMessage.count());
  console.log('SiteSettings:', await prisma.siteSettings.count());
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
