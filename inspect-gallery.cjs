const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.galleryPhoto.findMany({
    orderBy: { order: 'asc' }
  });

  console.log(`TOTAL GALLERY PHOTOS IN DB: ${photos.length}`);
  photos.forEach((p, i) => {
    console.log(`${i + 1}. [${p.id}] "${p.title}" -> ${p.src}`);
  });
}

main().finally(() => prisma.$disconnect());
