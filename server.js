require('./fix-fs.cjs');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const preparePromise = app.prepare().then(() => {
  console.log('> Next.js app prepared successfully');
}).catch((err) => {
  console.error('> Error during app.prepare():', err);
});

const server = createServer(async (req, res) => {
  try {
    await preparePromise;
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error handling request:', req.url, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error: ' + (err?.message || ''));
    }
  }
});

server.once('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(port, hostname, () => {
  console.log(`\n========================================`);
  console.log(`> Server is LIVE and listening!`);
  console.log(`> Localhost: http://localhost:${port}`);
  console.log(`> Localhost (IPv4): http://127.0.0.1:${port}`);
  console.log(`========================================\n`);
});
