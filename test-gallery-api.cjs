const http = require('http');

http.get('http://localhost:3000/api/cms/gallery', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Status Code:', res.statusCode);
      console.log('Success:', json.success);
      console.log('Photos Count:', json.photos ? json.photos.length : 0);
      if (json.photos) {
        json.photos.forEach((p, i) => console.log(`${i+1}. ${p.title} (${p.src})`));
      }
    } catch(e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', err => console.error('HTTP error:', err.message));
