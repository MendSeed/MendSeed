// ============================================================================
// GEMINI PROCESSING, VECTOR EMBEDDINGS & QUOTA CONTROLLER
// Aligned with Section 13 & 18 of Master Product Brief
// ============================================================================

export interface QuotaState {
  dailyRequestsUsed: number;
  dailyRequestsLimit: number;
  rollingRpmUsed: number;
  rollingRpmLimit: number;
  isCircuitOpen: boolean;
  lastFailureTime?: number;
  consecutiveErrors: number;
}

const STORAGE_KEY_QUOTA = 'mendseed_gemini_quota_v1';

export class GeminiQuotaManager {
  private state: QuotaState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): QuotaState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUOTA);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      dailyRequestsUsed: 0,
      dailyRequestsLimit: 1500,
      rollingRpmUsed: 0,
      rollingRpmLimit: 15,
      isCircuitOpen: false,
      consecutiveErrors: 0,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY_QUOTA, JSON.stringify(this.state));
    } catch {}
  }

  public canExecute(): { allowed: boolean; reason?: string } {
    if (this.state.isCircuitOpen) {
      const now = Date.now();
      if (this.state.lastFailureTime && now - this.state.lastFailureTime > 5 * 60 * 1000) {
        this.state.isCircuitOpen = false;
        this.state.consecutiveErrors = 0;
        this.saveState();
        return { allowed: true };
      }
      return { allowed: false, reason: 'Circuit breaker is OPEN due to provider rate-limiting.' };
    }

    if (this.state.dailyRequestsUsed >= this.state.dailyRequestsLimit) {
      return { allowed: false, reason: 'Daily free-tier request quota limit reached.' };
    }

    return { allowed: true };
  }

  public recordSuccess(): void {
    this.state.dailyRequestsUsed += 1;
    this.state.consecutiveErrors = 0;
    this.state.isCircuitOpen = false;
    this.saveState();
  }

  public recordFailure(isRateLimit = false): void {
    this.state.consecutiveErrors += 1;
    this.state.lastFailureTime = Date.now();
    if (isRateLimit || this.state.consecutiveErrors >= 3) {
      this.state.isCircuitOpen = true;
    }
    this.saveState();
  }

  public getStatus(): QuotaState {
    return { ...this.state };
  }
}

export const quotaManager = new GeminiQuotaManager();

/**
 * Generates a 768-dimensional normalized embedding vector for pgvector.
 * Uses Gemini API text-embedding-004 when key is configured, or
 * deterministic semantic vector projection.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (apiKey && quotaManager.canExecute().allowed) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.embedding?.values && data.embedding.values.length === 768) {
          quotaManager.recordSuccess();
          return data.embedding.values;
        }
      } else {
        quotaManager.recordFailure(resp.status === 429);
      }
    } catch {
      quotaManager.recordFailure();
    }
  }

  // Deterministic 768-dimensional semantic hashing vector
  return generateDeterministicEmbedding(text);
}

/**
 * Computes a deterministic 768-dimensional normalized unit vector from input text tokens.
 */
export function generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    vec[0] = 1;
    return vec;
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let h1 = 0x811c9dc5;
    let h2 = 0x27d4eb2f;

    for (let c = 0; c < word.length; c++) {
      const charCode = word.charCodeAt(c);
      h1 ^= charCode;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (charCode << 5) | (charCode >>> 27);
      h2 = Math.imul(h2, 0x5bd1e995);
    }

    const idx1 = Math.abs(h1) % dimensions;
    const idx2 = Math.abs(h2) % dimensions;
    const sign1 = (h1 & 1) === 0 ? 1 : -1;
    const sign2 = (h2 & 1) === 0 ? 1 : -1;

    // Word importance weighting (longer words generally carry more semantic signal)
    const weight = Math.log(word.length + 1);
    vec[idx1] += sign1 * weight;
    vec[idx2] += sign2 * (weight * 0.7);
  }

  // L2 Normalize to unit hypersphere
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] /= norm;
    }
  } else {
    vec[0] = 1;
  }

  return vec;
}
