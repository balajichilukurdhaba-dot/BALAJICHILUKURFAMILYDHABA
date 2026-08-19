const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uploadDir = 'C:\\Users\\uttup\\.gemini\\antigravity-ide\\brain\\0cdce94d-455b-413e-98df-d225560f7e80\\.user_uploaded';
const targetDir = path.join(__dirname, 'public', 'avatars');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const avatarFiles = [
  'media_1787136532691.png',
  'media_1787136564804.png',
  'media_1787136617474.png',
  'media_1787136636975.png',
  'media_1787136648429.png'
];

async function main() {
  console.log('=== COPYING USER AVATAR IMAGES ===');
  
  const savedAvatars = [];
  avatarFiles.forEach((file, index) => {
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

  console.log('\n=== UPDATING TESTIMONIALS WITH REAL AVATARS ===');

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

  console.log('\n=== DB AVATARS UPDATE COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
