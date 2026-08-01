const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'menuData.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newGalleryPhotos = `export const GALLERY_PHOTOS = [
  { id: 'g1',  src: '/dum-biryani.jpg',          title: 'Veg Dum Biryani',        menuCategory: 'Biryani',              menuDishName: 'Dum Biryani' },
  { id: 'g2',  src: '/paneer-butter-masala.jpg',  title: 'Paneer Butter Masala',   menuCategory: 'Paneer Specialities',  menuDishName: 'Paneer Butter Masala' },
  { id: 'g3',  src: '/kaju-paneer-biryani.jpg',   title: 'Kaju Paneer Biryani',    menuCategory: 'Biryani',              menuDishName: 'Kaju Paneer Biryani' },
  { id: 'g4',  src: '/paneer-tikka-masala.jpg',   title: 'Paneer Tikka Masala',    menuCategory: 'Paneer Specialities',  menuDishName: 'Paneer Tikka Masala' },
  { id: 'g5',  src: '/kaju-butter-masala.jpg',    title: 'Kaju Butter Masala',     menuCategory: 'Special Veg Curries',  menuDishName: 'Kaju Butter Masala' },
  { id: 'g6',  src: '/butter-naan.jpg',           title: 'Butter Naan',            menuCategory: 'Naan',                 menuDishName: 'Butter Naan' },
  { id: 'g7',  src: '/paneer-patiala.jpg',        title: 'Paneer Patiala',         menuCategory: 'Paneer Specialities',  menuDishName: 'Paneer Patiala (Sweet)' },
  { id: 'g8',  src: '/veg-manchuria.jpg',         title: 'Veg Manchuria',          menuCategory: 'Starters',             menuDishName: 'Veg Manchuria' },
  { id: 'g9',  src: '/kashmiri-pulao.jpg',        title: 'Kashmiri Pulao (Sweet)', menuCategory: 'Pulao',                menuDishName: 'Kashmiri Pulao (Sweet)' },
  { id: 'g10', src: '/jumbo-family-pack.jpg',     title: 'Jumbo Family Pack',      menuCategory: 'Jumbo Family Pack',    menuDishName: 'Jumbo Family Pack' },
];`;

content = content.replace(/export const GALLERY_PHOTOS = \[[\s\S]*?\n\];/s, newGalleryPhotos);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated GALLERY_PHOTOS array in src/utils/menuData.ts!');
