require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB INSPECTION ---');
  
  // 1. Site Settings
  const settings = await prisma.siteSettings.findMany();
  console.log(`Found ${settings.length} site settings rows:`);
  settings.forEach(s => {
    console.log(`Key: ${s.key}`);
    try {
      const parsed = JSON.parse(s.value);
      console.log('Value:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Value (raw):', s.value);
    }
  });

  // 2. Gallery photos
  const gallery = await prisma.galleryPhoto.findMany();
  console.log(`\nFound ${gallery.length} gallery photos:`);
  gallery.forEach(g => {
    console.log(`- [${g.id}] ${g.title}: ${g.src} (featured: ${g.isFeatured})`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
