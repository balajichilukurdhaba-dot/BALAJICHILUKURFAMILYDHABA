require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAll() {
  console.log('====================================================');
  console.log('🔄 STARTING COMPREHENSIVE DATABASE SYNCHRONIZATION');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // 1. SYNC BRANCHES TABLE (Phone Number + Details)
  // ----------------------------------------------------
  console.log('1️⃣ Syncing Branches...');
  const branches = await prisma.branch.findMany();
  for (const b of branches) {
    await prisma.branch.update({
      where: { id: b.id },
      data: {
        phone: '+91 98494 98681'
      }
    });
    console.log(`   ✔ Branch [${b.name}] phone set to: +91 98494 98681`);
  }

  // ----------------------------------------------------
  // 2. SYNC OFFERS TABLE (Images & Promos)
  // ----------------------------------------------------
  console.log('\n2️⃣ Syncing Offers...');
  const offers = await prisma.offer.findMany();
  for (const o of offers) {
    let targetImage = o.image;
    if (o.title.toLowerCase().includes('10%') || o.title.toLowerCase().includes('booking')) {
      targetImage = '/online-booking-offer.jpg';
    } else if (o.title.toLowerCase().includes('jumbo') || o.title.toLowerCase().includes('family pack')) {
      targetImage = '/jumbo-family-pack.jpg';
    }

    await prisma.offer.update({
      where: { id: o.id },
      data: {
        image: targetImage,
        isActive: true
      }
    });
    console.log(`   ✔ Offer [${o.title}] image set to: ${targetImage}`);
  }

  // ----------------------------------------------------
  // 3. SYNC SITE_SETTINGS TABLE (About, Hero, Contact)
  // ----------------------------------------------------
  console.log('\n3️⃣ Syncing Site Settings...');
  const settings = await prisma.siteSettings.findMany();
  
  // Update existing settings
  for (const s of settings) {
    try {
      const parsed = JSON.parse(s.value);
      let updated = false;

      // About section
      if (s.key === 'homepage_about') {
        parsed.image = '/dhaba-exterior.jpg';
        updated = true;
      }

      // Hero section
      if (s.key === 'homepage_hero') {
        parsed.fallbackImage = '/dhaba-exterior.jpg';
        updated = true;
      }

      // Website / contact settings
      if (s.key === 'website_settings' || s.key === 'contact_settings') {
        parsed.phone = '+91 98494 98681';
        parsed.whatsapp = '+91 98494 98681';
        parsed.ogImage = '/dhaba-exterior.jpg';
        updated = true;
      }

      if (updated) {
        await prisma.siteSettings.update({
          where: { key: s.key },
          data: { value: JSON.stringify(parsed) }
        });
        console.log(`   ✔ Site Setting [${s.key}] updated.`);
      }
    } catch (e) {
      // ignore
    }
  }

  // Ensure homepage_about exists
  const aboutCheck = await prisma.siteSettings.findUnique({ where: { key: 'homepage_about' } });
  if (!aboutCheck) {
    await prisma.siteSettings.create({
      data: {
        key: 'homepage_about',
        value: JSON.stringify({
          heading: 'Our Culinary Journey',
          subheading: 'A Legacy of Pure Vegetarian Excellence Since 1999',
          content: 'At Balaji Chilkur Family Dhaba, we bring you the finest flavors of North & South Indian cuisine. Our dishes are prepared by expert chefs using the freshest local produce and pure spices. Perfect for family dining, farm events, and travelers looking for a premium dining stop.',
          image: '/dhaba-exterior.jpg',
          isActive: true
        })
      }
    });
    console.log('   ✔ Created homepage_about in site_settings.');
  }

  // ----------------------------------------------------
  // 4. SYNC GALLERY_PHOTOS TABLE (Real Restaurant Photos)
  // ----------------------------------------------------
  console.log('\n4️⃣ Syncing Featured Gallery Photos...');

  const realPhotos = [
    {
      src: '/dhaba-exterior.jpg',
      title: 'Balaji Chilkur Family Dhaba - Main Entrance',
      albumName: 'Restaurant & Ambience',
      altText: 'Balaji Chilkur Family Dhaba 100% Pure Veg Main Entrance - Rajpurohit Empire'
    },
    {
      src: '/dhaba-interior-dining.jpg',
      title: 'Balaji Chilkur Dhaba - Family Section Dining',
      albumName: 'Restaurant & Ambience',
      altText: 'Balaji Chilkur Family Dhaba comfortable interior dining with plush blue chairs'
    },
    {
      src: '/online-booking-offer.jpg',
      title: 'Balaji Chilkur Dhaba - Main Dining Hall & Booths',
      albumName: 'Restaurant & Ambience',
      altText: 'Balaji Chilkur Family Dhaba spacious interior dining hall with cushioned booths and tables'
    },
    {
      src: '/jumbo-family-pack.jpg',
      title: 'Jumbo Family Pack Special',
      albumName: 'Food & Specials',
      altText: 'Balaji Chilkur Dhaba Jumbo Family Pack Combo Biryanis'
    }
  ];

  for (let idx = 0; idx < realPhotos.length; idx++) {
    const p = realPhotos[idx];
    const existing = await prisma.galleryPhoto.findFirst({
      where: {
        OR: [
          { src: p.src },
          { title: p.title }
        ]
      }
    });

    if (existing) {
      await prisma.galleryPhoto.update({
        where: { id: existing.id },
        data: {
          src: p.src,
          title: p.title,
          isFeatured: true,
          albumName: p.albumName,
          altText: p.altText
        }
      });
      console.log(`   ✔ Updated gallery photo: ${p.title} -> ${p.src}`);
    } else {
      const created = await prisma.galleryPhoto.create({
        data: {
          src: p.src,
          title: p.title,
          isFeatured: true,
          order: idx,
          albumName: p.albumName,
          altText: p.altText
        }
      });
      console.log(`   ✔ Created gallery photo: ${p.title} -> ${p.src}`);
    }
  }

  console.log('\n====================================================');
  console.log('✅ ALL DATABASE SECTIONS FULLY SYNCHRONIZED!');
  console.log('====================================================\n');
}

syncAll()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
