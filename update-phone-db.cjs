require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING PHONE NUMBERS IN DATABASE ===\n');

  // 1. Update branches
  const branches = await prisma.branch.findMany();
  console.log(`Found ${branches.length} branches:`);
  for (const b of branches) {
    console.log(`- [${b.id}] ${b.name}: ${b.phone}`);
    await prisma.branch.update({
      where: { id: b.id },
      data: { phone: '+91 98494 98681' }
    });
  }
  console.log('Updated all branch phone numbers to +91 98494 98681');

  // 2. Update site_settings if any phone exists
  const settings = await prisma.siteSettings.findMany();
  for (const s of settings) {
    if (s.value.includes('9347104569') || s.value.includes('93471 04569') || s.value.includes('93471')) {
      const newValue = s.value
        .replace(/9347104569/g, '9849498681')
        .replace(/93471\s*04569/g, '98494 98681');
      await prisma.siteSettings.update({
        where: { key: s.key },
        data: { value: newValue }
      });
      console.log(`Updated phone in site_settings key: ${s.key}`);
    }
  }

  console.log('\n=== DB PHONE UPDATE COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
