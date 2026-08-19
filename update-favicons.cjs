const fs = require('fs');

const logoBuf = fs.readFileSync('public/bsd-logo.png');
const base64 = logoBuf.toString('base64');

// Pure logo with transparent background (NO white background circle)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${base64}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;

fs.writeFileSync('public/favicon.svg', svgContent);
fs.writeFileSync('public/favicon.ico', logoBuf);
fs.writeFileSync('public/favicon.png', logoBuf);
fs.writeFileSync('public/apple-touch-icon.png', logoBuf);
fs.writeFileSync('app/icon.svg', svgContent);
fs.writeFileSync('app/icon.png', logoBuf);
fs.writeFileSync('app/favicon.ico', logoBuf);

console.log('✔ Transparent pure logo favicons created successfully!');
