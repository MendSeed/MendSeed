// ============================================================================
// MENDSEED AI SERVERLESS API GATEWAY PROXY
// Secure same-origin bridge for MendSeed AI FastAPI inference service.
// Credentials (MENDSEED_AI_SECRET_KEY) remain strictly server-side.
// ============================================================================

declare const process: any;

const AI_BASE_URL = (process.env.MENDSEED_AI_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const AI_SECRET_KEY = process.env.MENDSEED_AI_SECRET_KEY || 'mendseed_production_key_default_123';
const REQUEST_TIMEOUT_MS = 12000;

export default async function handler(req: any, res: any) {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query?.action || (req.body && req.body.action) || 'health').toString().toLowerCase();

  const headers: Record<string, string> = {
    'X-MendSeed-Key': AI_SECRET_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'MendSeed-Platform-Bridge/0.1.0',
  };

  try {
    // 1. Health & Liveness
    if (action === 'health' || (req.method === 'GET' && !req.query?.action)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const upstream = await fetch(`${AI_BASE_URL}/health`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (upstream.ok) {
          const data = await upstream.json();
          return res.status(200).json({
            status: 'CONNECTED',
            upstream: data,
            endpoint: AI_BASE_URL,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        return res.status(200).json({
          status: 'STANDBY',
          message: 'AI enrichment service offline; core platform running autonomously',
          upstreamError: err.message,
          endpoint: AI_BASE_URL,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST for AI operations.' });
    }

    const body = req.body || {};

    let targetEndpoint = '';
    let payload = body;

    switch (action) {
      case 'analyze':
      case 'analyze-report':
        targetEndpoint = '/v1/analyze';
        payload = {
          text: body.text || '',
          metadata: body.metadata || {},
        };
        break;

      case 'compare':
      case 'compare-issues':
        targetEndpoint = '/v1/compare';
        payload = {
          report_a: body.report_a || '',
          report_b: body.report_b || '',
        };
        break;

      case 'community-summary':
      case 'summarize':
        targetEndpoint = '/v1/community-summary';
        payload = {
          reports: Array.isArray(body.reports) ? body.reports : [body.reports || ''],
          category: body.category || undefined,
        };
        break;

      case 'builder-brief':
      case 'developer-brief':
        targetEndpoint = '/v1/builder-brief';
        payload = {
          title: body.title || 'Civic Problem',
          reports: Array.isArray(body.reports) ? body.reports : [body.reports || ''],
        };
        break;

      case 'propose-merge':
      case 'merge-proposal':
        targetEndpoint = '/v1/propose-merge';
        payload = {
          text: body.text || '',
          candidates: Array.isArray(body.candidates) ? body.candidates : [],
        };
        break;

      case 'quietfray-evaluate':
        targetEndpoint = '/v1/quietfray/evaluate';
        payload = {
          events: body.events || [],
          current_t: Number(body.current_t) || 0,
        };
        break;

      case 'quietfray-streaming-update':
        targetEndpoint = '/v1/quietfray/streaming-update';
        payload = {
          current_state: body.current_state || {},
          event_time_days: Number(body.event_time_days) || 0,
          event_mark: Number(body.event_mark) || 0.8,
          is_report: body.is_report !== false,
        };
        break;

      default:
        return res.status(400).json({
          error: `Unknown AI action: '${action}'. Valid actions: analyze, compare, community-summary, builder-brief, propose-merge, quietfray-evaluate, quietfray-streaming-update, health.`,
        });
    }

    // Call FastAPI upstream with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const upstreamResponse = await fetch(`${AI_BASE_URL}${targetEndpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const upstreamData = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      console.warn(`[AI Proxy] Upstream returned status ${upstreamResponse.status}:`, upstreamData);
      return res.status(upstreamResponse.status).json({
        success: false,
        aiProcessingState: 'FAILED',
        error: upstreamData.detail || 'Upstream AI model returned an error',
        upstreamStatus: upstreamResponse.status,
      });
    }

    return res.status(200).json({
      success: true,
      aiProcessingState: 'COMPLETED',
      data: upstreamData,
      isFallback: upstreamResponse.headers.get('x-inference-fallback') === 'true',
    });
  } catch (err: any) {
    console.error(`[AI Proxy Error] Action '${action}':`, err);

    // Resilient failure mode: AI failures NEVER destroy reports or block platform operations
    return res.status(200).json({
      success: false,
      aiProcessingState: 'OFFLINE_FALLBACK',
      message: 'AI service unreachable or timed out; platform fallback engaged.',
      error: err.message,
      human_review_required: true,
    });
  }
}
