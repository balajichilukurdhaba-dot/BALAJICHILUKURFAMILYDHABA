const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('--- ALL DB CATEGORIES ---');
  categories.forEach(c => console.log(`ID: ${c.id} | Name: "${c.name}"`));
}

main().finally(() => prisma.$disconnect());
