require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GOOGLE_REVIEWS = [
  {
    name: 'Pavan Bhadramraju',
    role: 'Paneer Butter Masala & Butter Naan',
    content: 'We ordered Paneer Butter Masala with Butter Naan, the taste was awesome, the hotel appearance was too good, plenty of vegetarian dishes available here.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    order: 1
  },
  {
    name: 'Nilabh Verma',
    role: 'Family Dining & Vegetarian Specialties',
    content: "A good family restaurant in Aziz Nagar, Himayat Nagar and Chilkur locality. It's an all vegetarian restaurant and the food quality is good. There is plenty of parking space. The staff is good.",
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    order: 2
  },
  {
    name: 'Rakesh Sharma',
    role: 'Farmhouse Orders & Family Feasts',
    content: 'Good restaurant, friendly staff. Owner is very good and down to earth. Visited with my wife. Loved the food. I also have a farmhouse nearby and we ordered food multiple times from here.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
    order: 3
  },
  {
    name: 'Srinivas Mankala',
    role: 'Pure Veg Lunch & Dinner',
    content: 'Great vegetarian restaurant serving very tasty food. Reasonable price and good service.',
    rating: 5,
    source: 'Google Reviews',
    date: '6 months ago',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    order: 4
  },
  {
    name: 'Anand Kumar',
    role: 'Weekend Family Dining',
    content: 'Awesome food and a must go place for all vegetarians. I always go with my family during weekends. Must try. Best vegetarian restaurant nearby. Multiple cuisines for vegetarian lovers.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
    order: 5
  },
  {
    name: 'Sathvik Krishna',
    role: 'Malai Paneer & Butter Naan',
    content: "This is a very good place for Veg lovers. You'll love the malai paneer and butter naan here. Many varieties available in veg. Enjoy the food!",
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    order: 6
  },
  {
    name: 'Hari Kashyap',
    role: 'Ambience & Vegetarian Gravies',
    content: 'Ambience and food was amazing. Great pure vegetarian options and tasty gravies.',
    rating: 5,
    source: 'Google Reviews',
    date: '6 months ago',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    order: 7
  },
  {
    name: 'Vijaykant Bilebhavi',
    role: 'Dal Tadka, Dum Aloo & Rotis',
    content: 'Nice atmosphere even in non family section. Of course tasty food, veg noodles 5*, Dal Tadka 5*, Dum aalu 4.3*, Rotis 4*.',
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    order: 8
  },
  {
    name: 'MOULANA MSK',
    role: 'Special Veg Biryani',
    content: 'Super food, very tasty! Best dining experience on the Chilkur route.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 months ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    order: 9
  },
  {
    name: 'Ankita Buriwale',
    role: 'Family Quantities & Quick Service',
    content: 'Tastiest food among all santosh dhabas. Serves largest quantities of food with prompt service.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    order: 10
  },
  {
    name: 'Shreeram Menon',
    role: 'Hospitality & Fresh Food',
    content: 'Sambhu has given excellent service, really good food. Great dining experience for our family.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80',
    order: 11
  },
  {
    name: 'Srikanth Reddy',
    role: 'Paneer 65 & Kaju Biryani',
    content: 'You will never forget this place once you visit here, food taste is top notch 👌',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&h=150&q=80',
    order: 12
  },
  {
    name: 'Vijay C',
    role: 'Large Group & Family Gatherings',
    content: 'We went with a group of 20 and we were well taken care of. Food was delicious and plentiful.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80',
    order: 13
  },
  {
    name: 'Kedar Shankaar M',
    role: 'North Indian Curries & Tandoori Breads',
    content: 'Neat, silent, tasty veg food served in time. Not too costly, great dining atmosphere.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    order: 14
  },
  {
    name: 'Subba Raju Mitta',
    role: 'Dhaba Style Dal Makhani & Roti',
    content: 'Good place, authentic dhaba taste and courteous staff service.',
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    order: 15
  },
  {
    name: 'Rishab Akilan',
    role: 'Pure Veg Specialties',
    content: 'Really excellent vegetarian dishes, authentic flavors and clean dining area.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    order: 16
  }
];

async function seedReviews() {
  console.log('=== SEEDING REAL GOOGLE REVIEWS INTO DATABASE ===\n');

  // 1. Clear previous testimonials
  const deleted = await prisma.testimonial.deleteMany({});
  console.log(`Deleted ${deleted.count} old testimonials from database.`);

  // 2. Insert all real Google Reviews
  for (const r of GOOGLE_REVIEWS) {
    const created = await prisma.testimonial.create({
      data: {
        name: r.name,
        role: r.role,
        content: r.content,
        rating: r.rating,
        source: 'Google Reviews',
        avatar: r.avatar,
        date: r.date,
        isApproved: true,
        order: r.order
      }
    });
    console.log(`✔ Added [${created.name}] - ${created.rating}★ (${created.date})`);
  }

  const count = await prisma.testimonial.count();
  console.log(`\n=== SUCCESS: ${count} REAL GOOGLE REVIEWS IN DATABASE ===`);
}

seedReviews()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
