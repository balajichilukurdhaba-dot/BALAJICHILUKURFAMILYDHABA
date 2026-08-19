const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GUARANTEED_GALLERY_PHOTOS = [
  {
    title: 'Veg Dum Biryani',
    src: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Biryani Specials',
    menuDishName: 'Veg Dum Biryani',
    isFeatured: true,
    albumName: 'Biryani Specials'
  },
  {
    title: 'Paneer Butter Masala',
    src: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Paneer Specials',
    menuDishName: 'Paneer Butter Masala',
    isFeatured: true,
    albumName: 'Paneer Specials'
  },
  {
    title: 'Kaju Paneer Biryani',
    src: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Biryani Specials',
    menuDishName: 'Kaju Paneer Biryani',
    isFeatured: true,
    albumName: 'Biryani Specials'
  },
  {
    title: 'Paneer Tikka Masala',
    src: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Paneer Specials',
    menuDishName: 'Paneer Tikka Masala',
    isFeatured: true,
    albumName: 'Paneer Specials'
  },
  {
    title: 'Kaju Butter Masala',
    src: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Curries',
    menuDishName: 'Kaju Butter Masala',
    isFeatured: true,
    albumName: 'Curries'
  },
  {
    title: 'Butter Naan',
    src: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Roti & Naan',
    menuDishName: 'Butter Naan',
    isFeatured: true,
    albumName: 'Roti & Naan'
  },
  {
    title: 'Paneer Patiala',
    src: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Paneer Specials',
    menuDishName: 'Paneer Patiala',
    isFeatured: true,
    albumName: 'Paneer Specials'
  },
  {
    title: 'Veg Manchuria',
    src: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Starters',
    menuDishName: 'Veg Manchuria Dry',
    isFeatured: true,
    albumName: 'Starters'
  },
  {
    title: 'Kashmiri Pulao (Sweet)',
    src: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Biryani Specials',
    menuDishName: 'Kashmiri Pulao (Sweet)',
    isFeatured: true,
    albumName: 'Biryani Specials'
  },
  {
    title: 'Jumbo Family Pack',
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    menuCategory: 'Combos & Family Packs',
    menuDishName: 'Jumbo Family Pack',
    isFeatured: true,
    albumName: 'Combos & Family Packs'
  }
];

async function updateGallery() {
  console.log('🔄 Updating database gallery_photos with 100% reliable high-definition image URLs...');

  const existingPhotos = await prisma.galleryPhoto.findMany({ orderBy: { order: 'asc' } });

  for (let i = 0; i < GUARANTEED_GALLERY_PHOTOS.length; i++) {
    const item = GUARANTEED_GALLERY_PHOTOS[i];
    if (existingPhotos[i]) {
      await prisma.galleryPhoto.update({
        where: { id: existingPhotos[i].id },
        data: {
          src: item.src,
          title: item.title,
          menuCategory: item.menuCategory,
          menuDishName: item.menuDishName,
          isFeatured: true,
          albumName: item.albumName,
          order: i
        }
      });
      console.log(`✅ Updated photo #${i + 1}: ${item.title} -> ${item.src}`);
    } else {
      await prisma.galleryPhoto.create({
        data: {
          src: item.src,
          title: item.title,
          menuCategory: item.menuCategory,
          menuDishName: item.menuDishName,
          isFeatured: true,
          albumName: item.albumName,
          order: i
        }
      });
      console.log(`✅ Created photo #${i + 1}: ${item.title}`);
    }
  }

  console.log('🎉 Gallery database update complete!');
}

updateGallery()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
