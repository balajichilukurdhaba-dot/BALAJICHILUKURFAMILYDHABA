require('./fix-fs.cjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MATCHED_GOOGLE_REVIEWS = [
  {
    name: 'Hari Kashyap',
    role: 'Ambience & Pure Veg Food',
    content: 'Service is bit late but ambience and food was amazing. Great pure vegetarian options and tasty gravies.',
    rating: 5,
    source: 'Google Reviews',
    date: '6 months ago',
    avatar: '/avatars/google-avatar-1.png', // Pink shirt waterfront
    order: 1
  },
  {
    name: 'Nilabh Verma',
    role: 'Family Dining & Parking Facility',
    content: "A good family restaurant in Aziz Nagar, Himayat Nagar and Chilkur locality. It's an all vegetarian restaurant and the food quality is good. There is plenty of parking space. The staff is good.",
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: '/avatars/google-avatar-2.png', // Yellow shirt selfie
    order: 2
  },
  {
    name: 'Pavan Bhadramraju',
    role: 'Paneer Butter Masala & Butter Naan',
    content: 'We ordered Paneer Butter Masala with Butter Naan, the taste was awesome, the hotel appearance was too good, plenty of vegetarian dishes available here.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: '/avatars/google-avatar-3.png', // Red polo shirt
    order: 3
  },
  {
    name: 'Rakesh Sharma',
    role: 'Farmhouse Orders & Family Feasts',
    content: 'Good restaurant, friendly staff. Owner is very good and down to earth. Visited with my wife. Loved the food. I also have a farmhouse nearby and we ordered food multiple times from here.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: '/avatars/google-avatar-4.png', // Butterfly bench
    order: 4
  },
  {
    name: 'Srinivas Mankala',
    role: 'Pure Veg Lunch & Dinner',
    content: 'Great vegetarian restaurant serving very tasty food. Reasonable price and good service.',
    rating: 5,
    source: 'Google Reviews',
    date: '6 months ago',
    avatar: '/avatars/google-avatar-5.png', // Blue suit & tie
    order: 5
  },
  {
    name: 'Kedar Shankaar M',
    role: 'Tandoori Breads & Veg Curries',
    content: 'Good those who want veg food can surely go. Neat, silent, tasty veg food served in time. Not too costly.',
    rating: 5,
    source: 'Google Reviews',
    date: 'a year ago',
    avatar: '/avatars/google-avatar-6.png', // Purple shirt seated
    order: 6
  },
  {
    name: 'Anand Kumar',
    role: 'Weekend Family Dining',
    content: 'Awesome food and a must go place for all vegetarians. I always go with my family during weekends. Must try. Best vegetarian restaurant nearby. Multiple cuisines for vegetarian lovers.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-7.png', // White shirt selfie
    order: 7
  },
  {
    name: 'Sathvik Krishna',
    role: 'Malai Paneer & Butter Naan',
    content: "This is a very good place for Veg lovers. You'll love the malai paneer and butter naan here. Many varieties available in veg. Enjoy the food!",
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: '/avatars/google-avatar-8.png', // Black suit & tie
    order: 8
  },
  {
    name: 'Vijaykant Bilebhavi',
    role: 'Dal Tadka, Dum Aloo & Rotis',
    content: 'Nice atmosphere even in non family section. Of course tasty food, veg noodles 5*, Dal Tadka 5*, Dum aalu 4.3*, Rotis 4*.',
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: '/avatars/google-avatar-9.png', // Orange shirt motorcycle
    order: 9
  },
  {
    name: 'MOULANA MSK',
    role: 'Special Veg Biryani',
    content: 'Super food, very tasty! Best dining experience on the Chilkur route.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 months ago',
    avatar: '/avatars/google-avatar-10.png', // Sunglasses blue shirt temple
    order: 10
  },
  {
    name: 'Vijay C',
    role: 'Large Group & Family Gatherings',
    content: 'We went with a group of 20 and we were well taken care of. Food was delicious and plentiful.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-11.png', // Red polo shirt
    order: 11
  },
  {
    name: 'Shreeram Menon',
    role: 'Hospitality & Fresh Food',
    content: 'Sambhu has given excellent service, really good food. Great dining experience for our family.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-12.png', // Grey shirt leaning railing
    order: 12
  },
  {
    name: 'Srikanth Reddy',
    role: 'Paneer 65 & Kaju Biryani',
    content: 'You will never forget this place once you visit here, food taste is top notch 👌',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-13.png', // Blue blazer red tie
    order: 13
  },
  {
    name: 'VIJAY KUMAR Naidu',
    role: 'North Indian Thali & Lunch',
    content: 'Lunch is very Tasty here. Great place for authentic dhaba food with quick service.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-14.png', // Sunglasses mustache
    order: 14
  },
  {
    name: 'Rishab Akilan',
    role: 'Pure Veg Specialties',
    content: 'Really excellent vegetarian dishes, authentic flavors and clean dining area.',
    rating: 5,
    source: 'Google Reviews',
    date: '2 years ago',
    avatar: '/avatars/google-avatar-15.png', // Red t-shirt
    order: 15
  },
  {
    name: 'Subba Raju Mitta',
    role: 'Dhaba Style Dal Makhani & Roti',
    content: 'Good place, authentic dhaba taste and courteous staff service.',
    rating: 5,
    source: 'Google Reviews',
    date: '3 years ago',
    avatar: '/avatars/google-avatar-2.png',
    order: 16
  }
];

async function syncMatchedReviews() {
  console.log('=== EXACT MATCHING OF GOOGLE REVIEWS & AVATARS ===\n');

  await prisma.testimonial.deleteMany({});
  console.log('Cleared previous testimonials in DB.');

  for (const r of MATCHED_GOOGLE_REVIEWS) {
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
    console.log(`✔ [${created.name}] -> ${created.avatar}`);
  }

  console.log('\n=== ALL 16 REVIEWS EXACTLY MATCHED IN DATABASE ===');
}

syncMatchedReviews()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
