import { neon } from '@neondatabase/serverless';

declare const process: any;

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(url);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getDb();
    const { canonicalIssueId, voterCapabilityHash, direction = 'UP' } = req.body || {};

    if (!canonicalIssueId || !voterCapabilityHash) {
      return res.status(400).json({ error: 'Missing canonicalIssueId or voterCapabilityHash' });
    }

    const now = new Date().toISOString();

    // Check existing vote
    const existing = await sql`
      SELECT * FROM support_votes
      WHERE canonical_issue_id = ${canonicalIssueId} AND voter_capability_hash = ${voterCapabilityHash}
    `;

    if (existing.length > 0) {
      const current = existing[0];
      if (current.direction === direction) {
        // Toggle vote off
        await sql`
          DELETE FROM support_votes
          WHERE id = ${current.id}
        `;
        await sql`
          UPDATE canonical_issues
          SET support_count = GREATEST(0, support_count - 1),
              last_activity_at = ${now}
          WHERE id = ${canonicalIssueId}
        `;
        return res.status(200).json({ userVote: null, action: 'REMOVED' });
      } else {
        // Update direction
        await sql`
          UPDATE support_votes
          SET direction = ${direction}
          WHERE id = ${current.id}
        `;
        return res.status(200).json({ userVote: direction, action: 'UPDATED' });
      }
    } else {
      // New vote
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await sql`
        INSERT INTO support_votes (id, canonical_issue_id, voter_capability_hash, direction, created_at)
        VALUES (${voteId}, ${canonicalIssueId}, ${voterCapabilityHash}, ${direction}, ${now})
      `;

      await sql`
        UPDATE canonical_issues
        SET support_count = support_count + 1,
            last_activity_at = ${now}
        WHERE id = ${canonicalIssueId}
      `;

      return res.status(200).json({ userVote: direction, action: 'ADDED' });
    }
  } catch (err: any) {
    console.error('Vote API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
