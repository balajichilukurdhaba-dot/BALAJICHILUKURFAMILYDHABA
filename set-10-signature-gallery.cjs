const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const signature10Photos = [
  {
    title: "Veg Dum Biryani",
    src: "/dum-biryani.jpg",
    menuCategory: "Biryani",
    menuDishName: "Dum Biryani",
    order: 1,
    altText: "Signature Hyderabadi Veg Dum Biryani",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Paneer Butter Masala",
    src: "/paneer-butter-masala.jpg",
    menuCategory: "Paneer Specialities",
    menuDishName: "Paneer Butter Masala",
    order: 2,
    altText: "Rich & Creamy Paneer Butter Masala",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Kaju Paneer Biryani",
    src: "/kaju-paneer-biryani.jpg",
    menuCategory: "Biryani",
    menuDishName: "Kaju Paneer Biryani",
    order: 3,
    altText: "Royal Kaju Paneer Biryani",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Paneer Tikka Masala",
    src: "/paneer-tikka-masala.jpg",
    menuCategory: "Paneer Specialities",
    menuDishName: "Paneer Tikka Masala",
    order: 4,
    altText: "Tandoori Paneer Tikka Masala",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Kaju Butter Masala",
    src: "/kaju-butter-masala.jpg",
    menuCategory: "Special Veg Curries",
    menuDishName: "Kaju Butter Masala",
    order: 5,
    altText: "Golden Roasted Kaju Butter Masala",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Butter Naan",
    src: "/butter-naan.jpg",
    menuCategory: "Naan",
    menuDishName: "Butter Naan",
    order: 6,
    altText: "Soft Tandoori Butter Naan",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Paneer Patiala",
    src: "/paneer-patiala.jpg",
    menuCategory: "Paneer Specialities",
    menuDishName: "Paneer Patiala (Sweet)",
    order: 7,
    altText: "Signature Stuffed Paneer Patiala",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Veg Manchuria",
    src: "/veg-manchuria.jpg",
    menuCategory: "Starters",
    menuDishName: "Veg Manchuria",
    order: 8,
    altText: "Crispy Indo-Chinese Veg Manchuria",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Kashmiri Pulao (Sweet)",
    src: "/kashmiri-pulao.jpg",
    menuCategory: "Pulao",
    menuDishName: "Kashmiri Pulao (Sweet)",
    order: 9,
    altText: "Royal Kashmiri Pulao with Fresh Fruits & Nuts",
    isFeatured: true,
    albumName: "Signature Dishes"
  },
  {
    title: "Jumbo Family Pack",
    src: "/jumbo-family-pack.jpg",
    menuCategory: "Jumbo Family Pack",
    menuDishName: "Jumbo Family Pack",
    order: 10,
    altText: "Grand Balaji Dhaba Family Feast Pack",
    isFeatured: true,
    albumName: "Signature Dishes"
  }
];

async function main() {
  console.log('Cleaning existing GalleryPhoto table...');
  await prisma.galleryPhoto.deleteMany({});
  console.log('Deleted all old photos from gallery table.');

  console.log('\nInserting 10 Signature Dishes into GalleryPhoto table...');
  for (const photo of signature10Photos) {
    const created = await prisma.galleryPhoto.create({
      data: photo
    });
    console.log(`- Created [Order ${created.order}]: "${created.title}" -> ${created.src}`);
  }

  console.log('\n--- VERIFYING 10 GALLERY PHOTOS ---');
  const count = await prisma.galleryPhoto.count();
  console.log(`Total photos now in Gallery: ${count}`);
}

main().finally(() => prisma.$disconnect());
