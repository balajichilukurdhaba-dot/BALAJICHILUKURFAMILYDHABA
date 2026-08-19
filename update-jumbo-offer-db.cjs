require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING JUMBO FAMILY PACK OFFER IMAGE IN DB ===\n');

  const updated = await prisma.offer.updateMany({
    where: {
      OR: [
        { title: { contains: 'Jumbo', mode: 'insensitive' } },
        { title: { contains: 'Family Pack', mode: 'insensitive' } },
        { id: 'family-combo' }
      ]
    },
    data: {
      image: '/jumbo-family-pack.jpg'
    }
  });

  console.log(`Updated ${updated.count} offer record(s) in DB to /jumbo-family-pack.jpg`);

  const allOffers = await prisma.offer.findMany();
  console.log('\nCurrent Offers in DB:');
  allOffers.forEach(o => {
    console.log(`- [${o.id}] "${o.title}" -> ${o.image}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
