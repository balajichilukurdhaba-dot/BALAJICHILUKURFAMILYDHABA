const fs = require('fs');
const path = require('path');

const menuDataPath = path.join(__dirname, 'src', 'utils', 'menuData.ts');

// We will replace any Unsplash URLs or stale paths for starters/special starters in menuData.ts
let content = fs.readFileSync(menuDataPath, 'utf8');

const staticImageFixes = [
  { dish: 'Veg Manchow Soup', url: '/veg-manchow-soup.jpg' },
  { dish: 'Cream Up Mushroom Soup (Sweet)', url: '/cream-up-mushroom-soup.jpg' },
  { dish: 'Lemon Coriander Soup', url: '/lemon-coriander-soup.jpg' },
  { dish: 'French Fries', url: '/french-fries.jpg' },
  { dish: 'Honey Chilly Potato', url: '/honey-chilli-potato.jpg' },
  { dish: 'Crispy Baby Corn', url: '/crispy-baby-corn.jpg' },
  { dish: 'Mushroom Butter Pepper', url: '/mushroom-butter-pepper.jpg' },
  { dish: 'Sangrila Paneer', url: '/sangrila-paneer.jpg' },
  { dish: 'Stick Paneer', url: '/stick-paneer.jpg' },
  { dish: 'Dragon Paneer', url: '/dragon-paneer.jpg' },
  { dish: 'Narmada Paneer', url: '/narmada-paneer.jpg' },
  { dish: 'Veg Spring Roll', url: '/veg-spring-roll.jpg' },
  { dish: 'Veg Bullet', url: '/veg-bullet.jpg' },
  { dish: 'Wet Manchuria', url: '/wet-manchuria.jpg' },
  { dish: 'Veg Manchuria Dry', url: '/veg-manchuria-dry.jpg' },
  { dish: 'Veg Clear Soup', url: '/veg-clear-soup.jpg' }
];

console.log('Validating menuData.ts...');
console.log('menuData.ts length:', content.length);
