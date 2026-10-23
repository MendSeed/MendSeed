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
  try {
    const sql = getDb();

    if (req.method === 'GET') {
      const { category, status, query, limit = '50' } = req.query || {};

      let sqlQuery = 'SELECT * FROM canonical_issues WHERE 1=1';
      const params: any[] = [];

      if (category && category !== 'ALL') {
        params.push(category);
        sqlQuery += ` AND category = $${params.length}`;
      }

      if (status && status !== 'ALL') {
        if (status === 'UNSOLVED') {
          sqlQuery += " AND status != 'SOLVED'";
        } else {
          params.push(status);
          sqlQuery += ` AND status = $${params.length}`;
        }
      }

      if (query && query.trim()) {
        params.push(`%${query.trim()}%`);
        sqlQuery += ` AND (title ILIKE $${params.length} OR problem_statement ILIKE $${params.length} OR description ILIKE $${params.length})`;
      }

      sqlQuery += ` ORDER BY last_activity_at DESC LIMIT ${Math.min(parseInt(limit as string) || 50, 100)}`;

      const issues = await (sql as any)(sqlQuery, params);

      // Fetch frictions, solutions, and claims for these issues
      const issueIds = issues.map((i: any) => i.id);
      let frictions: any[] = [];
      let solutions: any[] = [];
      let claims: any[] = [];

      if (issueIds.length > 0) {
        frictions = await sql`SELECT * FROM observed_frictions WHERE canonical_issue_id = ANY(${issueIds})`;
        solutions = await sql`SELECT * FROM solution_reports WHERE canonical_issue_id = ANY(${issueIds})`;
        claims = await sql`SELECT * FROM work_claims WHERE canonical_issue_id = ANY(${issueIds}) AND status = 'ACTIVE'`;
      }

      const formatted = issues.map((iss: any) => ({
        id: iss.id,
        slug: iss.slug,
        title: iss.title,
        problemStatement: iss.problem_statement,
        description: iss.description,
        category: iss.category,
        status: iss.status,
        supportCount: iss.support_count,
        downvoteCount: iss.downvote_count,
        reportCount: iss.report_count,
        summaryVersion: iss.summary_version,
        publishedAt: iss.published_at,
        lastActivityAt: iss.last_activity_at,
        observedFrictions: frictions.filter((f: any) => f.canonical_issue_id === iss.id).map((f: any) => ({
          id: f.id,
          issueId: f.canonical_issue_id,
          statement: f.statement,
          supportingReportIds: f.supporting_report_ids || [],
          source: f.source,
          confidence: f.confidence,
          createdAt: f.created_at,
        })),
        solutions: solutions.filter((s: any) => s.canonical_issue_id === iss.id).map((s: any) => ({
          id: s.id,
          canonicalIssueId: s.canonical_issue_id,
          submitterCapabilityHash: s.submitter_capability_hash,
          title: s.title,
          summary: s.summary,
          aspectsAddressed: s.aspects_addressed || [],
          usageInstructions: s.usage_instructions,
          stage: s.stage,
          projectName: s.project_name,
          githubUrl: s.github_url,
          demoUrl: s.demo_url,
          docsUrl: s.docs_url,
          verificationEvidence: s.verification_evidence,
          status: s.status,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
        activeClaim: claims.find((c: any) => c.canonical_issue_id === iss.id) ? {
          id: claims.find((c: any) => c.canonical_issue_id === iss.id).id,
          canonicalIssueId: iss.id,
          claimantCapabilityHash: claims.find((c: any) => c.canonical_issue_id === iss.id).claimant_capability_hash,
          status: 'ACTIVE',
          createdAt: claims.find((c: any) => c.canonical_issue_id === iss.id).created_at,
          lastActivityAt: claims.find((c: any) => c.canonical_issue_id === iss.id).last_activity_at,
          expiresAt: claims.find((c: any) => c.canonical_issue_id === iss.id).expires_at,
          notes: claims.find((c: any) => c.canonical_issue_id === iss.id).notes,
        } : undefined,
      }));

      return res.status(200).json({ issues: formatted });
    }

    if (req.method === 'POST') {
      const {
        title,
        description,
        category,
        reporterCapabilityHash,
        targetCanonicalIssueId,
      } = req.body || {};

      if (!title || !description || !category || !reporterCapabilityHash) {
        return res.status(400).json({ error: 'Missing required report fields' });
      }

      const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      let canonicalId = targetCanonicalIssueId;

      if (!canonicalId) {
        // Create a new canonical issue for this problem
        canonicalId = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

        await sql`
          INSERT INTO canonical_issues (
            id, slug, title, problem_statement, description, category, status,
            support_count, downvote_count, report_count, summary_version,
            published_at, last_activity_at
          ) VALUES (
            ${canonicalId}, ${slug}, ${title}, ${description.slice(0, 300)}, ${description},
            ${category}, 'OPEN', 1, 0, 1, 1, ${now}, ${now}
          )
        `;

        // Create observed friction
        const frictionId = `fric_${Date.now()}`;
        await sql`
          INSERT INTO observed_frictions (
            id, canonical_issue_id, statement, supporting_report_ids, source, confidence, created_at
          ) VALUES (
            ${frictionId}, ${canonicalId}, ${title}, ${[reportId]}, 'DIRECT_REPORT', 0.95, ${now}
          )
        `;
      } else {
        // Increment report count on existing issue
        await sql`
          UPDATE canonical_issues
          SET report_count = report_count + 1,
              last_activity_at = ${now}
          WHERE id = ${canonicalId}
        `;
      }

      // Insert problem report
      await sql`
        INSERT INTO problem_reports (
          id, canonical_issue_id, title, description, category, status,
          reporter_capability_hash, created_at, updated_at
        ) VALUES (
          ${reportId}, ${canonicalId}, ${title}, ${description}, ${category},
          'PUBLISHED', ${reporterCapabilityHash}, ${now}, ${now}
        )
      `;

      // Log public audit event
      const eventId = `evt_${Date.now()}`;
      await sql`
        INSERT INTO issue_events (
          id, canonical_issue_id, type, actor_description, details, created_at
        ) VALUES (
          ${eventId}, ${canonicalId}, 'PROBLEM_REPORTED', 'Anonymous Reporter',
          ${`New report registered: "${title}"`}, ${now}
        )
      `;

      return res.status(201).json({
        success: true,
        reportId,
        canonicalIssueId: canonicalId,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
