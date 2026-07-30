const fs = require('fs');
const path = require('path');

const menuDataPath = path.join(__dirname, 'src', 'utils', 'menuData.ts');
let content = fs.readFileSync(menuDataPath, 'utf8');

const lines = content.split('\n');
let fixedCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trimEnd();
  // Check if line looks like an object property e.g. "image: '...'" without ending in comma
  if (line.match(/^\s*(id|name|teluguName|description|price|category|image|src|title|menuCategory|menuDishName|rating|isVegetarian|isBestseller|isChefSpecial|isSeasonal|isOutOfStock|isHidden|isRecommended|altText|isFeatured|albumName):\s*['"`\w].*$/) && !line.endsWith(',') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith('[')) {
    lines[i] = line + ',';
    fixedCount++;
  }
}

fs.writeFileSync(menuDataPath, lines.join('\n'), 'utf8');
console.log(`Fixed ${fixedCount} missing commas in src/utils/menuData.ts`);
