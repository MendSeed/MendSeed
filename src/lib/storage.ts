// ============================================================================
// MENDSEED DATA REPOSITORY & REALTIME NEON POSTGRESQL + PGVECTOR PERSISTENCE
// Aligned with Sections 4, 7, 8, 14, 15 of Master Product Brief
// Zero Dummy Data — Live Real Database Synchronized
// ============================================================================

import type {
  CanonicalIssue,
  Category,
  IssueEvent,
  IssueStatus,
  NewsletterSubscriber,
  ProblemReport,
  SolutionReport,
  SolutionStage,
  SupportVote,
  WorkClaim,
} from '../types';
import { hashCapability } from './capabilities';
import type { TemporalEvent } from '../../quietfray/src/model';
import { computeBatchReference } from '../../quietfray/src/model';
import { generateEmbedding } from './gemini';
import { neon } from '@neondatabase/serverless';

const STORAGE_KEY_ISSUES = 'mendseed_canonical_issues_v2';
const STORAGE_KEY_REPORTS = 'mendseed_problem_reports_v2';
const STORAGE_KEY_VOTES = 'mendseed_support_votes_v2';
const STORAGE_KEY_EVENTS = 'mendseed_issue_events_v2';
const STORAGE_KEY_SUBSCRIBERS = 'mendseed_subscribers_v2';

// Neon connection
const NEON_URL =
  (import.meta as any).env?.VITE_NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_eCQF7EAz9nNB@ep-weathered-dew-b7xn2b9t-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

let dbClient: ReturnType<typeof neon> | null = null;
function getDb() {
  if (!dbClient && NEON_URL) {
    try {
      dbClient = neon(NEON_URL);
    } catch (err) {
      console.warn('[Neon] Client initialization failed:', err);
    }
  }
  return dbClient;
}

// In-memory / browser cache (starts strictly EMPTY: zero dummy data)
let inMemoryIssues: CanonicalIssue[] = [];
let inMemoryReports: ProblemReport[] = [];
let inMemoryVotes: SupportVote[] = [];
let inMemoryEvents: IssueEvent[] = [];
let inMemorySubscribers: NewsletterSubscriber[] = [];
let isInitialized = false;

// Clear legacy dummy storage keys if present
function purgeLegacyDummyData() {
  try {
    const legacy = localStorage.getItem('mendseed_canonical_issues_v1');
    if (legacy && legacy.includes('iss_01_gov_session')) {
      localStorage.removeItem('mendseed_canonical_issues_v1');
      localStorage.removeItem('mendseed_problem_reports_v1');
      localStorage.removeItem('mendseed_issue_events_v1');
    }
  } catch {}
}

function loadStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Storage] Failed saving to localStorage (${key}):`, err);
  }
}

/**
 * Computes QuietFray score for an issue based on its temporal state.
 */
export function computeQuietFrayForIssue(issue: CanonicalIssue) {
  const publishedTime = new Date(issue.publishedAt).getTime();
  const now = new Date().getTime();
  const unresolvedDays = Math.max((now - publishedTime) / (1000 * 60 * 60 * 24), 0.1);

  const events: TemporalEvent[] = [];
  const reportsCount = Math.max(issue.reportCount, 1);
  for (let i = 0; i < reportsCount; i++) {
    const t = (i / reportsCount) * (unresolvedDays * 0.9);
    events.push({
      timeDays: t,
      channel: 'REPORT',
      mark: { confidence: 0.85, diversity: 0.8, burstSimilarity: 0.1 },
    });
  }

  const upvotes = Math.max(issue.supportCount, 0);
  const step = unresolvedDays / Math.max(upvotes, 1);
  for (let i = 0; i < Math.min(upvotes, 50); i++) {
    events.push({
      timeDays: i * step,
      channel: 'VOTE',
      direction: 'UP',
    });
  }

  const res = computeBatchReference(events, {
    categorySuccesses: 10,
    categoryTotal: 30,
    unresolvedDays,
    hasReopen: issue.status === 'REOPENED',
    currentHorizonDays: unresolvedDays + 1,
  });

  return {
    issueId: issue.id,
    modelVersion: 'QuietFray v0.1',
    score: res.score,
    upvotes: issue.supportCount,
    downvotes: issue.downvoteCount,
    reportCount: issue.reportCount,
    unresolvedDays,
    reopenCount: issue.status === 'REOPENED' ? 1 : 0,
    fastIntensity: res.state.x_V_f,
    slowIntensity: res.state.x_V_s,
    burstSimilarity: 0.1,
    categoryPrior: 0.33,
    calculatedAt: new Date().toISOString(),
    signals: {
      temporalEvidence: res.state.sum_log_ratio_V + res.state.sum_log_ratio_R,
      reportMarks: res.state.ell_marks,
      voteDirection: res.state.ell_vote,
      survivalPersistence: 1.2,
      reopenSignal: issue.status === 'REOPENED' ? 1.25 : -0.8,
      categoryPriorScore: -0.7,
    },
  };
}

/**
 * Initializes the repository and triggers a background sync with Neon PostgreSQL.
 */
export function initRepository() {
  if (isInitialized) return;
  isInitialized = true;
  purgeLegacyDummyData();

  inMemoryIssues = loadStorage<CanonicalIssue[]>(STORAGE_KEY_ISSUES, []);
  inMemoryReports = loadStorage<ProblemReport[]>(STORAGE_KEY_REPORTS, []);
  inMemoryVotes = loadStorage<SupportVote[]>(STORAGE_KEY_VOTES, []);
  inMemoryEvents = loadStorage<IssueEvent[]>(STORAGE_KEY_EVENTS, []);
  inMemorySubscribers = loadStorage<NewsletterSubscriber[]>(STORAGE_KEY_SUBSCRIBERS, []);

  for (const issue of inMemoryIssues) {
    if (!issue.quietFray) {
      issue.quietFray = computeQuietFrayForIssue(issue);
    }
  }

  syncWithNeon().catch((err) => console.warn('[Storage] Initial Neon sync error:', err));
}

/**
 * Syncs the in-memory and local cache with the real Neon PostgreSQL database.
 */
export async function syncWithNeon(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  try {
    const rawIssues = (await sql`SELECT * FROM canonical_issues ORDER BY last_activity_at DESC`) as any[];
    const rawFrictions = (await sql`SELECT * FROM observed_frictions`) as any[];
    const rawSolutions = (await sql`SELECT * FROM solution_reports ORDER BY created_at DESC`) as any[];
    const rawClaims = (await sql`SELECT * FROM work_claims WHERE status = 'ACTIVE'`) as any[];
    const rawEvents = (await sql`SELECT * FROM issue_events ORDER BY created_at DESC LIMIT 50`) as any[];
    const rawVotes = (await sql`SELECT * FROM support_votes`) as any[];
    const rawReports = (await sql`SELECT * FROM problem_reports ORDER BY created_at DESC`) as any[];

    const parsedIssues: CanonicalIssue[] = rawIssues.map((iss: any) => {
      const issueFrictions = rawFrictions
        .filter((f: any) => f.canonical_issue_id === iss.id)
        .map((f: any) => ({
          id: f.id,
          issueId: f.canonical_issue_id,
          statement: f.statement,
          supportingReportIds: f.supporting_report_ids || [],
          source: f.source,
          confidence: f.confidence,
          createdAt: f.created_at,
        }));

      const issueSolutions = rawSolutions
        .filter((s: any) => s.canonical_issue_id === iss.id)
        .map((s: any) => ({
          id: s.id,
          canonicalIssueId: s.canonical_issue_id,
          submitterCapabilityHash: s.submitter_capability_hash,
          title: s.title,
          summary: s.summary,
          aspectsAddressed: s.aspects_addressed || [],
          usageInstructions: s.usage_instructions,
          stage: s.stage as SolutionStage,
          projectName: s.project_name,
          githubUrl: s.github_url,
          demoUrl: s.demo_url,
          docsUrl: s.docs_url,
          verificationEvidence: s.verification_evidence,
          status: s.status,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));

      const activeClaimRow = rawClaims.find((c: any) => c.canonical_issue_id === iss.id);
      const activeClaim: WorkClaim | undefined = activeClaimRow
        ? {
            id: activeClaimRow.id,
            canonicalIssueId: iss.id,
            claimantCapabilityHash: activeClaimRow.claimant_capability_hash,
            status: 'ACTIVE',
            createdAt: activeClaimRow.created_at,
            lastActivityAt: activeClaimRow.last_activity_at,
            expiresAt: activeClaimRow.expires_at,
            notes: activeClaimRow.notes,
          }
        : undefined;

      const issue: CanonicalIssue = {
        id: iss.id,
        slug: iss.slug,
        title: iss.title,
        problemStatement: iss.problem_statement,
        description: iss.description,
        category: iss.category as Category,
        status: iss.status as IssueStatus,
        supportCount: Number(iss.support_count) || 0,
        downvoteCount: Number(iss.downvote_count) || 0,
        reportCount: Number(iss.report_count) || 0,
        summaryVersion: Number(iss.summary_version) || 1,
        publishedAt: iss.published_at,
        lastActivityAt: iss.last_activity_at,
        observedFrictions: issueFrictions,
        solutions: issueSolutions,
        activeClaim,
      };

      issue.quietFray = computeQuietFrayForIssue(issue);
      return issue;
    });

    inMemoryIssues = parsedIssues;
    inMemoryEvents = rawEvents.map((e: any) => ({
      id: e.id,
      canonicalIssueId: e.canonical_issue_id,
      type: e.type,
      actorDescription: e.actor_description,
      details: e.details,
      solutionReportId: e.solution_report_id,
      createdAt: e.created_at,
    }));

    inMemoryVotes = rawVotes.map((v: any) => ({
      id: v.id,
      canonicalIssueId: v.canonical_issue_id,
      voterCapabilityHash: v.voter_capability_hash,
      direction: v.direction,
      createdAt: v.created_at,
    }));

    inMemoryReports = rawReports.map((r: any) => ({
      id: r.id,
      canonicalIssueId: r.canonical_issue_id,
      title: r.title,
      description: r.description,
      category: r.category as Category,
      status: r.status,
      reporterCapabilityHash: r.reporter_capability_hash,
      confidenceProxy: r.confidence_proxy,
      diversityProxy: r.diversity_proxy,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
    saveStorage(STORAGE_KEY_REPORTS, inMemoryReports);
    saveStorage(STORAGE_KEY_VOTES, inMemoryVotes);
    saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);
  } catch (err) {
    console.warn('[Neon Sync] Background sync error:', err);
  }
}

export interface ListIssuesFilter {
  query?: string;
  category?: Category | 'ALL';
  status?: IssueStatus | 'ALL' | 'UNSOLVED';
  rankingMode?: 'trending' | 'most_supported' | 'newest' | 'quietfray';
  limit?: number;
  offset?: number;
}

export function listCanonicalIssues(filter: ListIssuesFilter = {}): { issues: CanonicalIssue[]; total: number } {
  initRepository();
  let list = [...(inMemoryIssues || [])];

  if (filter.query && filter.query.trim()) {
    const q = filter.query.toLowerCase();
    list = list.filter(
      (iss) =>
        iss.title.toLowerCase().includes(q) ||
        iss.problemStatement.toLowerCase().includes(q) ||
        iss.description.toLowerCase().includes(q) ||
        iss.observedFrictions.some((f) => f.statement.toLowerCase().includes(q))
    );
  }

  if (filter.category && filter.category !== 'ALL') {
    list = list.filter((iss) => iss.category === filter.category);
  }

  if (filter.status && filter.status !== 'ALL') {
    if (filter.status === 'UNSOLVED') {
      list = list.filter((iss) => iss.status !== 'SOLVED');
    } else {
      list = list.filter((iss) => iss.status === filter.status);
    }
  }

  const mode = filter.rankingMode || 'trending';
  if (mode === 'most_supported') {
    list.sort((a, b) => b.supportCount - a.supportCount);
  } else if (mode === 'newest') {
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  } else if (mode === 'quietfray') {
    list.sort((a, b) => (b.quietFray?.score ?? 0) - (a.quietFray?.score ?? 0));
  } else {
    list.sort((a, b) => {
      const aTime = new Date(a.lastActivityAt).getTime();
      const bTime = new Date(b.lastActivityAt).getTime();
      const aVelocity = a.supportCount * 0.4 + a.reportCount * 3.0 + aTime / 1e11;
      const bVelocity = b.supportCount * 0.4 + b.reportCount * 3.0 + bTime / 1e11;
      return bVelocity - aVelocity;
    });
  }

  const total = list.length;
  const offset = filter.offset || 0;
  const limit = filter.limit || 50;
  const paginated = list.slice(offset, offset + limit);

  return { issues: paginated, total };
}

export function getCanonicalIssue(idOrSlug: string): CanonicalIssue | undefined {
  initRepository();
  return inMemoryIssues.find((iss) => iss.id === idOrSlug || iss.slug === idOrSlug);
}

export function getAssociatedReports(canonicalIssueId: string): ProblemReport[] {
  initRepository();
  return inMemoryReports.filter((r) => r.canonicalIssueId === canonicalIssueId && r.status === 'PUBLISHED');
}

export function listPublicEvents(limit = 10): IssueEvent[] {
  initRepository();
  return [...inMemoryEvents].slice(0, limit);
}

export function getUserVote(issueId: string, voterCapabilityHash: string): 'UP' | 'DOWN' | null {
  initRepository();
  const v = inMemoryVotes.find(
    (vote) => vote.canonicalIssueId === issueId && vote.voterCapabilityHash === voterCapabilityHash
  );
  return v ? (v.direction as 'UP' | 'DOWN') : null;
}

/**
 * Real-time Candidate Matching for Report Problem Modal
 */
export function findCandidateIssues(query: string, category?: Category): CanonicalIssue[] {
  initRepository();
  if (!query || query.trim().length < 3) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  return inMemoryIssues
    .filter((iss) => {
      if (category && category !== 'OTHER' && iss.category !== category) return false;
      const t = iss.title.toLowerCase();
      const d = iss.description.toLowerCase();
      return words.some((w) => t.includes(w) || d.includes(w));
    })
    .slice(0, 5);
}

/**
 * Casts or toggles an anonymous support vote.
 */
export async function castSupportVote(
  canonicalIssueId: string,
  voterCapabilityToken: string,
  direction: 'UP' | 'DOWN' = 'UP'
): Promise<{ userVote: 'UP' | 'DOWN' | null; newCount: number }> {
  initRepository();
  const voterHash = await hashCapability(voterCapabilityToken);
  const now = new Date().toISOString();

  let userVote: 'UP' | 'DOWN' | null = null;
  let newCount = 0;

  const existingIndex = inMemoryVotes.findIndex(
    (v) => v.canonicalIssueId === canonicalIssueId && v.voterCapabilityHash === voterHash
  );

  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);

  if (existingIndex >= 0) {
    const existing = inMemoryVotes[existingIndex];
    if (existing.direction === direction) {
      inMemoryVotes.splice(existingIndex, 1);
      userVote = null;
      if (issue) issue.supportCount = Math.max(0, issue.supportCount - 1);
    } else {
      existing.direction = direction;
      userVote = direction;
    }
  } else {
    inMemoryVotes.push({
      id: `vote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      canonicalIssueId,
      voterCapabilityHash: voterHash,
      direction,
      createdAt: now,
    });
    userVote = direction;
    if (issue) issue.supportCount += 1;
  }

  if (issue) {
    issue.lastActivityAt = now;
    issue.quietFray = computeQuietFrayForIssue(issue);
    newCount = issue.supportCount;
  }

  saveStorage(STORAGE_KEY_VOTES, inMemoryVotes);
  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);

  const sql = getDb();
  if (sql) {
    try {
      if (userVote === null) {
        await sql`
          DELETE FROM support_votes
          WHERE canonical_issue_id = ${canonicalIssueId} AND voter_capability_hash = ${voterHash}
        `;
        await sql`
          UPDATE canonical_issues
          SET support_count = GREATEST(0, support_count - 1), last_activity_at = ${now}
          WHERE id = ${canonicalIssueId}
        `;
      } else {
        await sql`
          INSERT INTO support_votes (id, canonical_issue_id, voter_capability_hash, direction, created_at)
          VALUES (${`vote_${Date.now()}`}, ${canonicalIssueId}, ${voterHash}, ${direction}, ${now})
          ON CONFLICT (canonical_issue_id, voter_capability_hash)
          DO UPDATE SET direction = ${direction}
        `;
        await sql`
          UPDATE canonical_issues
          SET support_count = support_count + 1, last_activity_at = ${now}
          WHERE id = ${canonicalIssueId}
        `;
      }
    } catch (err) {
      console.warn('[Neon Vote] Write error:', err);
    }
  }

  return { userVote, newCount };
}

export interface ProblemReportInput {
  title: string;
  description: string;
  category: Category;
  candidateIssueId?: string;
}

/**
 * Submits a new problem report. Generates a pgvector embedding and syncs to Neon.
 */
export async function submitProblemReport(
  input: ProblemReportInput,
  reporterCapabilityToken: string
): Promise<{ report: ProblemReport; canonicalIssueId: string }> {
  initRepository();
  const reporterHash = await hashCapability(reporterCapabilityToken);
  const now = new Date().toISOString();
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const embedding = await generateEmbedding(`${input.title}\n${input.description}`);

  let canonicalId = input.candidateIssueId;

  if (!canonicalId) {
    canonicalId = `iss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const newIssue: CanonicalIssue = {
      id: canonicalId,
      slug,
      title: input.title,
      problemStatement: input.description.length > 300 ? input.description.slice(0, 300) + '...' : input.description,
      description: input.description,
      category: input.category,
      status: 'OPEN',
      supportCount: 1,
      downvoteCount: 0,
      reportCount: 1,
      summaryVersion: 1,
      publishedAt: now,
      lastActivityAt: now,
      observedFrictions: [
        {
          id: `fric_${Date.now()}`,
          issueId: canonicalId,
          statement: input.title,
          supportingReportIds: [reportId],
          source: 'DIRECT_REPORT',
          confidence: 0.95,
          createdAt: now,
        },
      ],
      solutions: [],
    };

    newIssue.quietFray = computeQuietFrayForIssue(newIssue);
    inMemoryIssues.unshift(newIssue);
  } else {
    const existing = inMemoryIssues.find((iss) => iss.id === canonicalId);
    if (existing) {
      existing.reportCount += 1;
      existing.lastActivityAt = now;
      existing.observedFrictions.push({
        id: `fric_${Date.now()}`,
        issueId: canonicalId,
        statement: input.title,
        supportingReportIds: [reportId],
        source: 'DIRECT_REPORT',
        confidence: 0.9,
        createdAt: now,
      });
      existing.quietFray = computeQuietFrayForIssue(existing);
    }
  }

  const report: ProblemReport = {
    id: reportId,
    canonicalIssueId: canonicalId,
    title: input.title,
    description: input.description,
    category: input.category,
    status: 'PUBLISHED',
    reporterCapabilityHash: reporterHash,
    confidenceProxy: 0.92,
    diversityProxy: 0.85,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryReports.unshift(report);

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId: canonicalId,
    type: 'REPORT_ASSOCIATED',
    actorDescription: 'Anonymous Reporter',
    details: `New problem report registered: "${input.title}"`,
    createdAt: now,
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_REPORTS, inMemoryReports);
  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      const vectorStr = `[${embedding.join(',')}]`;

      if (!input.candidateIssueId) {
        const issue = inMemoryIssues.find((iss) => iss.id === canonicalId)!;
        await sql`
          INSERT INTO canonical_issues (
            id, slug, title, problem_statement, description, category, status,
            support_count, downvote_count, report_count, summary_version,
            embedding, published_at, last_activity_at
          ) VALUES (
            ${issue.id}, ${issue.slug}, ${issue.title}, ${issue.problemStatement},
            ${issue.description}, ${issue.category}, ${issue.status},
            ${issue.supportCount}, ${issue.downvoteCount}, ${issue.reportCount},
            ${issue.summaryVersion}, ${vectorStr}::vector, ${now}, ${now}
          )
        `;

        await sql`
          INSERT INTO observed_frictions (
            id, canonical_issue_id, statement, supporting_report_ids, source, confidence, created_at
          ) VALUES (
            ${`fric_${Date.now()}`}, ${canonicalId}, ${input.title}, ${[reportId]}, 'DIRECT_REPORT', 0.95, ${now}
          )
        `;
      } else {
        await sql`
          UPDATE canonical_issues
          SET report_count = report_count + 1, last_activity_at = ${now}
          WHERE id = ${canonicalId}
        `;
      }

      await sql`
        INSERT INTO problem_reports (
          id, canonical_issue_id, title, description, category, status,
          reporter_capability_hash, embedding, created_at, updated_at
        ) VALUES (
          ${reportId}, ${canonicalId}, ${input.title}, ${input.description}, ${input.category},
          'PUBLISHED', ${reporterHash}, ${vectorStr}::vector, ${now}, ${now}
        )
      `;

      await sql`
        INSERT INTO issue_events (
          id, canonical_issue_id, type, actor_description, details, created_at
        ) VALUES (
          ${event.id}, ${canonicalId}, 'REPORT_ASSOCIATED', 'Anonymous Reporter',
          ${event.details}, ${now}
        )
      `;
    } catch (err) {
      console.warn('[Neon Report] Write error:', err);
    }
  }

  return { report, canonicalIssueId: canonicalId };
}

export type SolutionReportInput = Omit<
  SolutionReport,
  'id' | 'canonicalIssueId' | 'submitterCapabilityHash' | 'status' | 'createdAt' | 'updatedAt'
>;

/**
 * Submits a solution report with capability token and syncs to Neon.
 */
export async function submitSolutionReport(
  canonicalIssueId: string,
  input: SolutionReportInput,
  submitterCapabilityToken: string
): Promise<SolutionReport> {
  initRepository();
  const submitterHash = await hashCapability(submitterCapabilityToken);
  const now = new Date().toISOString();
  const solutionId = `sol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const solution: SolutionReport = {
    id: solutionId,
    canonicalIssueId,
    submitterCapabilityHash: submitterHash,
    title: input.title,
    summary: input.summary,
    aspectsAddressed: input.aspectsAddressed,
    usageInstructions: input.usageInstructions,
    limitations: input.limitations,
    stage: input.stage,
    projectName: input.projectName,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    docsUrl: input.docsUrl,
    verificationEvidence: input.verificationEvidence,
    status: 'PROPOSED',
    createdAt: now,
    updatedAt: now,
  };

  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);
  if (issue) {
    issue.solutions.unshift(solution);
    if (issue.status === 'OPEN') issue.status = 'BEING_BUILT';
    issue.lastActivityAt = now;
  }

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId,
    type: 'SOLUTION_SUBMITTED',
    actorDescription: 'Anonymous Builder',
    details: `Submitted solution "${input.title}" (${input.stage})`,
    solutionReportId: solutionId,
    createdAt: now,
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        INSERT INTO solution_reports (
          id, canonical_issue_id, submitter_capability_hash, title, summary,
          aspects_addressed, usage_instructions, stage, project_name,
          github_url, demo_url, docs_url, verification_evidence, status,
          created_at, updated_at
        ) VALUES (
          ${solutionId}, ${canonicalIssueId}, ${submitterHash}, ${input.title},
          ${input.summary}, ${input.aspectsAddressed}, ${input.usageInstructions},
          ${input.stage}, ${input.projectName || null}, ${input.githubUrl || null},
          ${input.demoUrl || null}, ${input.docsUrl || null},
          ${input.verificationEvidence || null}, 'PROPOSED', ${now}, ${now}
        )
      `;

      await sql`
        UPDATE canonical_issues
        SET status = CASE WHEN status = 'OPEN' THEN 'BEING_BUILT' ELSE status END,
            last_activity_at = ${now}
        WHERE id = ${canonicalIssueId}
      `;

      await sql`
        INSERT INTO issue_events (
          id, canonical_issue_id, type, actor_description, details, solution_report_id, created_at
        ) VALUES (
          ${event.id}, ${canonicalIssueId}, 'SOLUTION_SUBMITTED', 'Anonymous Builder',
          ${event.details}, ${solutionId}, ${now}
        )
      `;
    } catch (err) {
      console.warn('[Neon Solution] Write error:', err);
    }
  }

  return solution;
}

/**
 * Claims a 7-day stewardship lease on a canonical issue.
 */
export async function claimWorkOnIssue(
  canonicalIssueId: string,
  claimantCapabilityToken: string,
  notes?: string
): Promise<{ claimId: string; expiresAt: string }> {
  initRepository();
  const claimantHash = await hashCapability(claimantCapabilityToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const claimId = `clm_${Date.now()}`;

  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);
  if (!issue) throw new Error('Issue not found');

  if (issue.activeClaim && issue.activeClaim.status === 'ACTIVE') {
    const claimExpiry = new Date(issue.activeClaim.expiresAt).getTime();
    if (claimExpiry > now.getTime()) {
      throw new Error('This issue has an active stewardship lease');
    }
  }

  issue.activeClaim = {
    id: claimId,
    canonicalIssueId,
    claimantCapabilityHash: claimantHash,
    status: 'ACTIVE',
    createdAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    expiresAt,
    notes,
  };
  issue.status = 'BEING_BUILT';
  issue.lastActivityAt = now.toISOString();

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId,
    type: 'CLAIM_CREATED',
    actorDescription: 'Anonymous Builder',
    details: 'Claimed 7-day stewardship lease to build a solution.',
    createdAt: now.toISOString(),
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        INSERT INTO work_claims (
          id, canonical_issue_id, claimant_capability_hash, status, notes,
          created_at, last_activity_at, expires_at
        ) VALUES (
          ${claimId}, ${canonicalIssueId}, ${claimantHash}, 'ACTIVE', ${notes || null},
          ${now.toISOString()}, ${now.toISOString()}, ${expiresAt}
        )
      `;

      await sql`
        UPDATE canonical_issues
        SET status = 'BEING_BUILT', last_activity_at = ${now.toISOString()}
        WHERE id = ${canonicalIssueId}
      `;
    } catch (err) {
      console.warn('[Neon Claim] Write error:', err);
    }
  }

  return { claimId, expiresAt };
}

/**
 * Releases a work claim stewardship lease back to the community.
 */
export async function releaseWorkClaim(
  canonicalIssueId: string,
  claimantCapabilityToken: string
): Promise<{ success: boolean }> {
  initRepository();
  const claimantHash = await hashCapability(claimantCapabilityToken);
  const now = new Date().toISOString();

  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);
  if (!issue) throw new Error('Issue not found');

  if (!issue.activeClaim || issue.activeClaim.claimantCapabilityHash !== claimantHash) {
    throw new Error('Capability verification failed: You do not hold the active lease on this issue.');
  }

  issue.activeClaim.status = 'RELEASED';
  issue.activeClaim = undefined;
  if (issue.solutions.length === 0) {
    issue.status = 'OPEN';
  }
  issue.lastActivityAt = now;

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId,
    type: 'CLAIM_RELEASED',
    actorDescription: 'Anonymous Builder',
    details: 'Released stewardship lease back to community.',
    createdAt: now,
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE work_claims
        SET status = 'RELEASED', last_activity_at = ${now}
        WHERE canonical_issue_id = ${canonicalIssueId} AND claimant_capability_hash = ${claimantHash}
      `;

      await sql`
        UPDATE canonical_issues
        SET status = CASE WHEN (SELECT COUNT(*) FROM solution_reports WHERE canonical_issue_id = ${canonicalIssueId}) > 0 THEN 'BEING_BUILT' ELSE 'OPEN' END,
            last_activity_at = ${now}
        WHERE id = ${canonicalIssueId}
      `;
    } catch (err) {
      console.warn('[Neon Release Claim] Write error:', err);
    }
  }

  return { success: true };
}

/**
 * Section 8.5 strictly verified resolution transition.
 * Non-negotiable rule: Only a holder of a valid solution capability token can mark an issue SOLVED.
 */
export async function markIssueSolved(
  canonicalIssueId: string,
  solutionId: string,
  solutionCapabilityToken: string,
  verificationNotes: string
): Promise<{ success: boolean }> {
  initRepository();
  const tokenHash = await hashCapability(solutionCapabilityToken);
  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);

  if (!issue) throw new Error('Canonical issue not found');

  const solution = issue.solutions.find((s) => s.id === solutionId);
  if (!solution) throw new Error('Referenced solution report not found');

  if (solution.submitterCapabilityHash !== tokenHash) {
    throw new Error('Cryptographic capability verification failed: Only the solution submitter can mark this issue solved.');
  }

  const now = new Date().toISOString();
  issue.status = 'SOLVED';
  issue.lastActivityAt = now;
  solution.status = 'ACCEPTED';
  solution.stage = 'INDEPENDENTLY_VERIFIED';

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId,
    type: 'MARKED_SOLVED',
    actorDescription: 'Authorized Solution Submitter',
    details: `Verified resolution: ${verificationNotes}`,
    solutionReportId: solutionId,
    createdAt: now,
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE canonical_issues
        SET status = 'SOLVED', last_activity_at = ${now}
        WHERE id = ${canonicalIssueId}
      `;

      await sql`
        UPDATE solution_reports
        SET status = 'ACCEPTED', stage = 'INDEPENDENTLY_VERIFIED', updated_at = ${now}
        WHERE id = ${solutionId}
      `;

      await sql`
        INSERT INTO issue_events (
          id, canonical_issue_id, type, actor_description, details, solution_report_id, created_at
        ) VALUES (
          ${event.id}, ${canonicalIssueId}, 'MARKED_SOLVED', 'Authorized Solution Submitter',
          ${event.details}, ${solutionId}, ${now}
        )
      `;
    } catch (err) {
      console.warn('[Neon Verify] Write error:', err);
    }
  }

  return { success: true };
}

/**
 * Reopens an issue if solution fails or regression occurs.
 */
export async function reopenIssue(canonicalIssueId: string, reason: string): Promise<{ success: boolean }> {
  initRepository();
  const issue = inMemoryIssues.find((iss) => iss.id === canonicalIssueId);
  if (!issue) throw new Error('Issue not found');

  const now = new Date().toISOString();
  issue.status = 'REOPENED';
  issue.lastActivityAt = now;
  issue.quietFray = computeQuietFrayForIssue(issue);

  const event: IssueEvent = {
    id: `evt_${Date.now()}`,
    canonicalIssueId,
    type: 'REOPENED',
    actorDescription: 'Community Reviewer',
    details: `Reopened: ${reason}`,
    createdAt: now,
  };
  inMemoryEvents.unshift(event);

  saveStorage(STORAGE_KEY_ISSUES, inMemoryIssues);
  saveStorage(STORAGE_KEY_EVENTS, inMemoryEvents);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE canonical_issues
        SET status = 'REOPENED', last_activity_at = ${now}
        WHERE id = ${canonicalIssueId}
      `;

      await sql`
        INSERT INTO issue_events (
          id, canonical_issue_id, type, actor_description, details, created_at
        ) VALUES (
          ${event.id}, ${canonicalIssueId}, 'REOPENED', 'Community Reviewer',
          ${event.details}, ${now}
        )
      `;
    } catch (err) {
      console.warn('[Neon Reopen] Write error:', err);
    }
  }

  return { success: true };
}

/**
 * Subscribes an email hash to the MendSeed Dispatch.
 */
export async function subscribeNewsletter(
  email: string,
  notifyNewIssues = true,
  weeklyDigest = true
): Promise<{ success: boolean }> {
  initRepository();
  const emailHash = await hashCapability(email.toLowerCase().trim());
  const now = new Date().toISOString();

  if (!inMemorySubscribers.some((s) => s.emailHash === emailHash)) {
    inMemorySubscribers.push({
      id: `sub_${Date.now()}`,
      emailHash,
      confirmed: true,
      notifyNewIssues,
      weeklyDigest,
      subscribedAt: now,
    });
    saveStorage(STORAGE_KEY_SUBSCRIBERS, inMemorySubscribers);

    const sql = getDb();
    if (sql) {
      try {
        await sql`
          INSERT INTO newsletter_subscribers (id, email_hash, confirmed, notify_new_issues, weekly_digest, subscribed_at)
          VALUES (${`sub_${Date.now()}`}, ${emailHash}, TRUE, ${notifyNewIssues}, ${weeklyDigest}, ${now})
          ON CONFLICT (email_hash) DO NOTHING
        `;
      } catch (err) {
        console.warn('[Neon Newsletter] Write error:', err);
      }
    }
  }

  return { success: true };
}
