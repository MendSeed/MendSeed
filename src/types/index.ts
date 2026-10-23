// ============================================================================
// MENDSEED CORE DOMAIN TYPES
// Aligned with Section 3 & 4 of Master Product Brief
// ============================================================================

export type Category =
  | 'SOFTWARE_APPS'
  | 'DEV_TOOLS'
  | 'EDUCATION'
  | 'ACCESSIBILITY'
  | 'TRANSPORTATION'
  | 'PUBLIC_INFRASTRUCTURE'
  | 'PUBLIC_SERVICES'
  | 'ENVIRONMENT'
  | 'WORKFLOWS_PRODUCTIVITY'
  | 'EVERYDAY_LIFE'
  | 'WORK_ORGANIZATIONS'
  | 'OTHER';

export const CATEGORY_LABELS: Record<Category, string> = {
  SOFTWARE_APPS: 'Software & Apps',
  DEV_TOOLS: 'Developer Tools',
  EDUCATION: 'Education',
  ACCESSIBILITY: 'Accessibility',
  TRANSPORTATION: 'Transportation',
  PUBLIC_INFRASTRUCTURE: 'Public Infrastructure',
  PUBLIC_SERVICES: 'Public Services',
  ENVIRONMENT: 'Environment',
  WORKFLOWS_PRODUCTIVITY: 'Workflows & Productivity',
  EVERYDAY_LIFE: 'Everyday Life',
  WORK_ORGANIZATIONS: 'Work & Organizations',
  OTHER: 'Other',
};

export type IssueStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'BEING_BUILT'
  | 'SOLVED'
  | 'REOPENED';

export type ReportStatus =
  | 'RECEIVED'
  | 'MODERATION_PENDING'
  | 'APPROVED'
  | 'MATCH_PENDING'
  | 'PUBLISHED'
  | 'HELD_FOR_REVIEW'
  | 'REJECTED'
  | 'MERGED';

export type SolutionStage =
  | 'CONCEPT'
  | 'PROTOTYPE'
  | 'AVAILABLE'
  | 'INDEPENDENTLY_VERIFIED';

export interface ObservedFriction {
  id: string;
  issueId: string;
  statement: string;
  supportingReportIds: string[];
  source: 'DIRECT_REPORT' | 'AI_EXTRACTED' | 'HUMAN_REVIEWED';
  confidence: number;
  createdAt: string;
}

export interface ProblemReport {
  id: string;
  canonicalIssueId?: string;
  title: string;
  description: string;
  category: Category;
  status: ReportStatus;
  moderationReason?: string;
  reporterCapabilityHash: string; // SHA-256 capability reference for edit/withdraw
  createdAt: string;
  updatedAt: string;
  confidenceProxy?: number; // 0..1
  diversityProxy?: number;   // 0..1
}

export interface WorkClaim {
  id: string;
  canonicalIssueId: string;
  claimantCapabilityHash: string; // Protected anonymous actor capability
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string; // Default lease: 7 days
  notes?: string;
}

export interface SolutionReport {
  id: string;
  canonicalIssueId: string;
  submitterCapabilityHash: string; // Anonymous capability needed to mark issue solved
  title: string;
  summary: string;
  aspectsAddressed: string[];
  usageInstructions: string;
  limitations?: string;
  stage: SolutionStage;
  projectName?: string;
  githubUrl?: string;
  demoUrl?: string;
  docsUrl?: string;
  verificationEvidence?: string;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'WITHDRAWN';
  createdAt: string;
  updatedAt: string;
}

export interface IssueEvent {
  id: string;
  canonicalIssueId: string;
  type:
    | 'PUBLISHED'
    | 'REPORT_ASSOCIATED'
    | 'CLAIM_CREATED'
    | 'CLAIM_RENEWED'
    | 'CLAIM_RELEASED'
    | 'CLAIM_EXPIRED'
    | 'SOLUTION_SUBMITTED'
    | 'SOLUTION_REVIEWED'
    | 'MARKED_SOLVED'
    | 'REOPENED';
  actorDescription: string; // e.g. "Anonymous Builder", "Community Report"
  details: string;
  solutionReportId?: string;
  createdAt: string;
}

export interface SupportVote {
  id: string;
  canonicalIssueId: string;
  voterCapabilityHash: string;
  direction: 'UP' | 'DOWN';
  createdAt: string;
}

export interface QuietFrayFeatures {
  issueId: string;
  modelVersion: string;
  score: number;
  upvotes: number;
  downvotes: number;
  reportCount: number;
  unresolvedDays: number;
  reopenCount: number;
  fastIntensity: number;
  slowIntensity: number;
  burstSimilarity: number;
  categoryPrior: number;
  calculatedAt: string;
  signals: {
    temporalEvidence: number;
    reportMarks: number;
    voteDirection: number;
    survivalPersistence: number;
    reopenSignal: number;
    categoryPriorScore: number;
  };
}

export interface CanonicalIssue {
  id: string;
  slug: string;
  title: string;
  problemStatement: string; // Short public synthesis
  description: string;      // Detailed context
  category: Category;
  status: IssueStatus;
  supportCount: number;     // Net upvotes
  downvoteCount: number;
  reportCount: number;      // Associated reports
  publishedAt: string;
  lastActivityAt: string;
  summaryVersion: number;
  observedFrictions: ObservedFriction[];
  acceptanceCriteria?: string[]; // Defined criteria for what constitutes a valid fix
  activeClaim?: WorkClaim;
  claimedSolver?: {
    userId: string;
    username: string;
    name: string;
    avatarUrl?: string;
    claimedAt: string;
    notes?: string;
  };
  solutions: SolutionReport[];
  resolutionReportId?: string;
  resolutionEvidence?: string;
  closedBy?: {
    userId: string;
    username: string;
    closedAt: string;
    solutionId: string;
  };
  discussions?: DiscussionComment[];
  reporterUserId?: string; // Optional if submitted by authenticated user
  quietFray?: QuietFrayFeatures;
}

export interface NewsletterSubscriber {
  id: string;
  emailHash: string; // Privacy: store hash or encrypted in public/client models
  confirmed: boolean;
  notifyNewIssues: boolean;
  weeklyDigest: boolean;
  subscribedAt: string;
}

// ============================================================================
// SOLVER ACCOUNTS, DISCUSSION THREADS & GAMIFICATION TYPES
// Aligned with Community Scoping Hub Vision (GitHub + Kaggle + Devpost)
// ============================================================================

export interface UserProfile {
  id: string;
  username: string; // unique, e.g. "johndoe", clean profile URL /johndoe
  name: string;
  email: string;
  avatarUrl: string;
  isPublicProfile: boolean;
  bio?: string;
  githubUsername?: string;
  githubUrl?: string;
  skills: string[];
  preferredTech: string[];
  streakDays: number;
  points: number;
  verifiedSolutionsCount: number;
  problemsLoggedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionComment {
  id: string;
  canonicalIssueId: string;
  parentId?: string; // For nested replies / threading
  author: {
    userId?: string;
    username: string;
    name: string;
    avatarUrl?: string;
    isGuest: boolean;
    isSolver: boolean;
    isMaintainer: boolean;
  };
  content: string;
  reactions: Record<string, number>; // e.g. { '👍': 4, '🚀': 2, '❤️': 1 }
  solutionId?: string; // Optional reference to a linked solution proposal
  createdAt: string;
}

export type PointReason =
  | 'PROBLEM_SCOPED'
  | 'EVIDENCE_ADDED'
  | 'SOLUTION_ACCEPTED'
  | 'VERIFICATION_CONDUCTED'
  | 'STREAK_BONUS';

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  reason: PointReason;
  description: string;
  relatedId?: string; // e.g. issueId or solutionId
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  score: number;
  verifiedSolutions: number;
  problemsScoped: number;
  streakDays: number;
  trend: 'up' | 'down' | 'same';
}

