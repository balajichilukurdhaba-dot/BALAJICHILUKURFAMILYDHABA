const { execSync } = require('child_process');
const fs = require('fs');

const gitExe = 'C:\\Users\\uttup\\AppData\\Local\\Programs\\MinGit\\cmd\\git.exe';
const env = { ...process.env, PATH: 'C:\\Users\\uttup\\AppData\\Local\\Programs\\MinGit\\cmd;' + 'C:\\Users\\uttup\\AppData\\Local\\Programs\\MinGit\\bin;' + process.env.PATH };

// Clean up helper scripts
['git-check-status.cjs', 'git-stage-and-status.cjs', 'map-emblem.cjs'].forEach(f => {
  if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch {}
});

// Configure git user
try {
  execSync(`"${gitExe}" config user.name "Balaji Dhaba"`, { env });
  execSync(`"${gitExe}" config user.email "balajichilukurdhaba@gmail.com"`, { env });
} catch (e) {}

console.log('1. Staging changes...');
execSync(`"${gitExe}" add -A`, { env });

console.log('2. Committing changes...');
try {
  const commitOut = execSync(`"${gitExe}" commit -m "feat: complete website enhancements, BSD logo branding, responsive layout, and assets"`, { env }).toString();
  console.log(commitOut);
} catch (e) {
  console.log('Commit note:', e.stdout ? e.stdout.toString() : e.message);
}

console.log('3. Pushing to origin main...');
try {
  const pushOut = execSync(`"${gitExe}" push origin main`, { env }).toString();
  console.log('Push output:', pushOut);
  console.log('✔ Successfully pushed all changes to https://github.com/balajichilukurdhaba-dot/BALAJICHILUKURFAMILYDHABA.git');
} catch (e) {
  console.error('Push error:', e.stderr ? e.stderr.toString() : e.message);
  if (e.stdout) console.log('Stdout:', e.stdout.toString());
}
