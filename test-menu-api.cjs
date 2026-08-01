const http = require('http');

http.get('http://localhost:3000/api/cms/menu', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('Success:', parsed.success);
    console.log('Categories Count:', parsed.categories ? parsed.categories.length : 0);
  });
}).on('error', err => {
  console.error('Error fetching menu API:', err.message);
});
