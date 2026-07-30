const { Client } = require('pg');

const host = 'aws-1-ap-south-1.pooler.supabase.com';
const user = 'postgres.wgjrmvybfkgqxlyiscqf';
const pass = 'BALAJI@chilukur';

async function main() {
  console.log("Testing Session Pooler (port 5432)...");
  const client = new Client({
    user: user,
    password: pass,
    host: host,
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`\n🎉 SESSION POOLER 5432 SUCCESS!`);
    await client.end();
  } catch (err) {
    console.log(`Session Pooler 5432 failed: ${err.message}`);
    try { await client.end(); } catch(e){}
  }
}

main();
