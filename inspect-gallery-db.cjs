const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.galleryPhoto.findMany();
  console.log('=== DATABASE GALLERY PHOTOS (' + photos.length + ' items) ===');
  photos.forEach(p => {
    console.log(`ID: ${p.id} | Title: "${p.title}" | isFeatured: ${p.isFeatured} | Src: "${p.src}"`);
  });
}

main().finally(() => prisma.$disconnect());
