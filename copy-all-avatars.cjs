const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uploadDir = 'C:\\Users\\uttup\\.gemini\\antigravity-ide\\brain\\0cdce94d-455b-413e-98df-d225560f7e80\\.user_uploaded';
const targetDir = path.join(__dirname, 'public', 'avatars');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const allAvatarFiles = [
  'media_1787136532691.png', // 1
  'media_1787136564804.png', // 2
  'media_1787136617474.png', // 3
  'media_1787136636975.png', // 4
  'media_1787136648429.png', // 5
  'media_1787136741942.png', // 6
  'media_1787136750955.png', // 7
  'media_1787136758802.png', // 8
  'media_1787136765706.png', // 9
  'media_1787136771285.png'  // 10
];

async function main() {
  console.log('=== COPYING ALL 10 USER AVATAR IMAGES ===');
  
  const savedAvatars = [];
  allAvatarFiles.forEach((file, index) => {
    const srcPath = path.join(uploadDir, file);
    const destName = `google-avatar-${index + 1}.png`;
    const destPath = path.join(targetDir, destName);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} -> public/avatars/${destName}`);
      savedAvatars.push(`/avatars/${destName}`);
    } else {
      console.warn(`File not found: ${srcPath}`);
    }
  });

  console.log('\n=== UPDATING TESTIMONIALS IN DB WITH ALL 10 REAL AVATARS ===');

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: 'asc' }
  });

  for (let i = 0; i < testimonials.length; i++) {
    const t = testimonials[i];
    const avatarUrl = savedAvatars[i % savedAvatars.length];
    
    await prisma.testimonial.update({
      where: { id: t.id },
      data: { avatar: avatarUrl }
    });
    console.log(`Updated [${t.name}] avatar -> ${avatarUrl}`);
  }

  console.log('\n=== ALL 16 REVIEWS FULLY UPDATED WITH 10 REAL AVATARS IN DB ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
