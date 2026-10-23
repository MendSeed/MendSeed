import { neon } from '@neondatabase/serverless';

declare const process: any;

export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return res.status(500).json({ status: 'ERROR', error: 'DATABASE_URL is not set' });
    }

    const sql = neon(url);
    const result = await sql`SELECT 1 as connected, extname FROM pg_extension WHERE extname = 'vector'`;

    return res.status(200).json({
      status: 'OK',
      postgres: 'CONNECTED',
      pgvector: result.length > 0 ? 'ENABLED' : 'MISSING',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      error: err.message,
    });
  }
}
