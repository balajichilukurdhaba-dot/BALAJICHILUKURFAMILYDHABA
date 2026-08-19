require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATING DATABASE IMAGES ===\n');

  // 1. Check and update site_settings
  const settings = await prisma.siteSettings.findMany();
  console.log(`Checking ${settings.length} site settings rows...`);

  for (const s of settings) {
    console.log(`\nKey: ${s.key}`);
    try {
      const parsed = JSON.parse(s.value);
      let updated = false;

      // Check homepage_about
      if (s.key === 'homepage_about') {
        parsed.image = '/dhaba-exterior.jpg';
        updated = true;
        console.log('Updated homepage_about.image to /dhaba-exterior.jpg');
      }

      // Check homepage_hero
      if (s.key === 'homepage_hero' && parsed.fallbackImage) {
        parsed.fallbackImage = '/dhaba-exterior.jpg';
        updated = true;
        console.log('Updated homepage_hero.fallbackImage to /dhaba-exterior.jpg');
      }

      // Check website_settings
      if (s.key === 'website_settings') {
        if (parsed.ogImage) {
          parsed.ogImage = '/dhaba-exterior.jpg';
          updated = true;
        }
      }

      if (updated) {
        await prisma.siteSettings.update({
          where: { key: s.key },
          data: { value: JSON.stringify(parsed) }
        });
        console.log(`Saved updated ${s.key} to database.`);
      }
    } catch (e) {
      console.log(`Raw value: ${s.value}`);
    }
  }

  // 2. Ensure homepage_about exists in site_settings
  const aboutSetting = await prisma.siteSettings.findUnique({
    where: { key: 'homepage_about' }
  });

  if (!aboutSetting) {
    const defaultAbout = {
      heading: 'Our Culinary Journey',
      subheading: 'A Legacy of Pure Vegetarian Excellence Since 1999',
      content: 'At Balaji Chilkur Family Dhaba, we bring you the finest flavors of North & South Indian cuisine. Our dishes are prepared by expert chefs using the freshest local produce and pure spices. Perfect for family dining, farm events, and travelers looking for a premium dining stop.',
      image: '/dhaba-exterior.jpg',
      isActive: true
    };
    await prisma.siteSettings.create({
      data: {
        key: 'homepage_about',
        value: JSON.stringify(defaultAbout)
      }
    });
    console.log('\nCreated homepage_about in site_settings table with /dhaba-exterior.jpg');
  }

  // 3. Check / Add Gallery Photo for the Restaurant Exterior
  const existingExterior = await prisma.galleryPhoto.findFirst({
    where: {
      OR: [
        { src: '/dhaba-exterior.jpg' },
        { title: { contains: 'Exterior', mode: 'insensitive' } },
        { title: { contains: 'Balaji Chilkur Family Dhaba', mode: 'insensitive' } },
        { title: { contains: 'Restaurant Ambience', mode: 'insensitive' } }
      ]
    }
  });

  if (existingExterior) {
    await prisma.galleryPhoto.update({
      where: { id: existingExterior.id },
      data: {
        src: '/dhaba-exterior.jpg',
        title: 'Balaji Chilkur Family Dhaba - Main Entrance',
        isFeatured: true,
        albumName: 'Restaurant & Ambience'
      }
    });
    console.log(`\nUpdated existing gallery photo [${existingExterior.id}] to /dhaba-exterior.jpg`);
  } else {
    const newPhoto = await prisma.galleryPhoto.create({
      data: {
        src: '/dhaba-exterior.jpg',
        title: 'Balaji Chilkur Family Dhaba - Main Entrance',
        isFeatured: true,
        order: 0,
        albumName: 'Restaurant & Ambience',
        altText: 'Balaji Chilkur Family Dhaba 100% Pure Veg Main Entrance - Rajpurohit Empire'
      }
    });
    console.log(`\nAdded new gallery photo [${newPhoto.id}] with /dhaba-exterior.jpg`);
  }

  console.log('\n=== DATABASE UPDATE COMPLETE ===');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
