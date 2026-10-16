// ============================================================================
// CAPABILITY-BASED ANONYMOUS AUTHORIZATION
// Aligned with Section 6 of Master Product Brief
// ============================================================================

/**
 * Computes a SHA-256 hash of a string using Web Crypto API.
 * The server/database stores only the hash; the raw capability token
 * is kept strictly client-side in browser storage or displayed as a recovery code.
 */
export async function hashCapability(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a cryptographically secure opaque capability token with prefix.
 * e.g., "mcap_sol_9f8a...".
 */
export function generateCapability(type: 'voter' | 'claim' | 'solution' | 'report'): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `mcap_${type}_${hex}`;
}

const STORAGE_KEY_CAPABILITIES = 'mendseed_capabilities_v1';
const STORAGE_KEY_VOTER = 'mendseed_voter_token_v1';

export interface StoredCapability {
  token: string;
  hash: string;
  type: 'claim' | 'solution' | 'report';
  resourceId: string; // issueId, solutionReportId, or reportId
  createdAt: string;
  label?: string;
}

/**
 * Retrieves the local voter capability token, generating one if not present.
 */
export async function getOrCreateVoterToken(): Promise<{ token: string; hash: string }> {
  let token = localStorage.getItem(STORAGE_KEY_VOTER);
  if (!token) {
    token = generateCapability('voter');
    localStorage.setItem(STORAGE_KEY_VOTER, token);
  }
  const hash = await hashCapability(token);
  return { token, hash };
}

/**
 * Stores a capability in local browser storage.
 */
export async function storeCapability(
  type: 'claim' | 'solution' | 'report',
  resourceId: string,
  token: string,
  label?: string
): Promise<StoredCapability> {
  const hash = await hashCapability(token);
  const existing = listStoredCapabilities();
  const entry: StoredCapability = {
    token,
    hash,
    type,
    resourceId,
    createdAt: new Date().toISOString(),
    label,
  };
  const filtered = existing.filter((c) => !(c.type === type && c.resourceId === resourceId));
  filtered.push(entry);
  localStorage.setItem(STORAGE_KEY_CAPABILITIES, JSON.stringify(filtered));
  return entry;
}

/**
 * Lists all capabilities possessed by this client browser.
 */
export function listStoredCapabilities(): StoredCapability[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAPABILITIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Gets a specific stored capability by type and resourceId.
 */
export function getCapability(type: 'claim' | 'solution' | 'report', resourceId: string): StoredCapability | undefined {
  const all = listStoredCapabilities();
  return all.find((c) => c.type === type && c.resourceId === resourceId);
}

/**
 * Removes a capability (e.g., when releasing a claim or discarding a solution).
 */
export function removeCapability(type: 'claim' | 'solution' | 'report', resourceId: string): void {
  const all = listStoredCapabilities();
  const filtered = all.filter((c) => !(c.type === type && c.resourceId === resourceId));
  localStorage.setItem(STORAGE_KEY_CAPABILITIES, JSON.stringify(filtered));
}
