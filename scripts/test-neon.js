import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be provided through the environment.');
}
const sql = neon(databaseUrl);

async function test() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('Successfully connected to Neon PostgreSQL! Tables found:', tables.map(t => t.table_name));
}

test().catch(console.error);
