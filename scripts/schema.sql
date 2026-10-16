-- ============================================================================
-- MENDSEED POSTGRESQL SCHEMA MIGRATION (V1)
-- Aligned with Section 14, 15 of Master Product Brief
-- Target: Neon PostgreSQL (serverless) / Standard PostgreSQL 15+
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Canonical Issues
CREATE TABLE IF NOT EXISTS canonical_issues (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    support_count INTEGER NOT NULL DEFAULT 0,
    downvote_count INTEGER NOT NULL DEFAULT 0,
    report_count INTEGER NOT NULL DEFAULT 0,
    summary_version INTEGER NOT NULL DEFAULT 1,
    resolution_report_id TEXT,
    resolution_evidence TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_category ON canonical_issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON canonical_issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_published ON canonical_issues(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_activity ON canonical_issues(last_activity_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_issues_fts ON canonical_issues USING gin(to_tsvector('english', title || ' ' || problem_statement || ' ' || description));

-- 2. Problem Reports
CREATE TABLE IF NOT EXISTS problem_reports (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT REFERENCES canonical_issues(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    moderation_reason TEXT,
    reporter_capability_hash TEXT NOT NULL,
    confidence_proxy REAL DEFAULT 0.9,
    diversity_proxy REAL DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_canonical ON problem_reports(canonical_issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_capability ON problem_reports(reporter_capability_hash);

-- 3. Observed Frictions & Provenance
CREATE TABLE IF NOT EXISTS observed_frictions (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT NOT NULL REFERENCES canonical_issues(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    supporting_report_ids TEXT[] NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'DIRECT_REPORT',
    confidence REAL NOT NULL DEFAULT 0.9,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frictions_canonical ON observed_frictions(canonical_issue_id);

-- 4. Anonymous Support Votes
CREATE TABLE IF NOT EXISTS support_votes (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT NOT NULL REFERENCES canonical_issues(id) ON DELETE CASCADE,
    voter_capability_hash TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'UP',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_voter_issue UNIQUE (canonical_issue_id, voter_capability_hash)
);

CREATE INDEX IF NOT EXISTS idx_votes_issue ON support_votes(canonical_issue_id);

-- 5. Time-Limited Work Claims (Stewardship Leases)
CREATE TABLE IF NOT EXISTS work_claims (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT NOT NULL REFERENCES canonical_issues(id) ON DELETE CASCADE,
    claimant_capability_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_issue_status ON work_claims(canonical_issue_id, status);

-- 6. Structured Solution Reports
CREATE TABLE IF NOT EXISTS solution_reports (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT NOT NULL REFERENCES canonical_issues(id) ON DELETE CASCADE,
    submitter_capability_hash TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    aspects_addressed TEXT[] NOT NULL DEFAULT '{}',
    usage_instructions TEXT NOT NULL,
    limitations TEXT,
    stage TEXT NOT NULL DEFAULT 'PROTOTYPE',
    project_name TEXT,
    github_url TEXT,
    demo_url TEXT,
    docs_url TEXT,
    verification_evidence TEXT,
    status TEXT NOT NULL DEFAULT 'PROPOSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solutions_issue ON solution_reports(canonical_issue_id);

-- 7. Public Audit Event Stream
CREATE TABLE IF NOT EXISTS issue_events (
    id TEXT PRIMARY KEY,
    canonical_issue_id TEXT NOT NULL REFERENCES canonical_issues(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    actor_description TEXT NOT NULL,
    details TEXT NOT NULL,
    solution_report_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_issue ON issue_events(canonical_issue_id, created_at DESC);

-- 8. Newsletter Subscribers (Isolated from problems/reports)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email_hash TEXT UNIQUE NOT NULL,
    confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    notify_new_issues BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Durable Transactional Job Outbox
CREATE TABLE IF NOT EXISTS job_outbox (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    locked_until TIMESTAMPTZ,
    locked_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_queue ON job_outbox(status, locked_until) WHERE status = 'PENDING';
