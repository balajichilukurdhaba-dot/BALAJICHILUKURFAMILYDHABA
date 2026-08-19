require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const offers = await prisma.offer.findMany();
  console.log(`Found ${offers.length} offers in DB:`);
  offers.forEach(o => {
    console.log(`- [${o.id}] "${o.title}" | image: ${o.image} | price: ${o.price}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
