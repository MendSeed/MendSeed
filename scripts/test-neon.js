import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_eCQF7EAz9nNB@ep-weathered-dew-b7xn2b9t-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function test() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('Successfully connected to Neon PostgreSQL! Tables found:', tables.map(t => t.table_name));
}

test().catch(console.error);
