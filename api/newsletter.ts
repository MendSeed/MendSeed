import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';

declare const process: any;

function getDb() {
  const url = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }
  return neon(url);
}

// Simple SHA-256 for Node environment
async function hashEmail(email: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, notifyNewIssues = true, weeklyDigest = true } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailHash = await hashEmail(cleanEmail);
    const now = new Date().toISOString();

    // 1. Record subscription in Neon PostgreSQL
    const sql = getDb();
    await sql`
      INSERT INTO newsletter_subscribers (
        id, email_hash, confirmed, notify_new_issues, weekly_digest, subscribed_at
      ) VALUES (
        ${`sub_${Date.now()}`}, ${emailHash}, TRUE, ${notifyNewIssues}, ${weeklyDigest}, ${now}
      )
      ON CONFLICT (email_hash) DO UPDATE
      SET notify_new_issues = ${notifyNewIssues}, weekly_digest = ${weeklyDigest}
    `;

    // 2. Send Welcome Email via Resend if API key is present
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let resendMessage = 'Subscription saved. Resend API key not configured.';

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'MendSeed <onboarding@resend.dev>';

        const emailResult = await resend.emails.send({
          from: fromAddress,
          to: cleanEmail,
          subject: 'Confirmed: MendSeed Dispatch Subscription',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080907; color: #F7F8F4; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
              <div style="margin-bottom: 24px; border-bottom: 1px solid #22281F; padding-bottom: 20px;">
                <h1 style="color: #D2F827; font-size: 24px; margin: 0 0 6px 0; letter-spacing: -0.5px;">MENDSEED DISPATCH</h1>
                <p style="color: #9CA396; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Evidence-Driven Public Problem Discovery</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #E9EAE4;">
                You are confirmed for the <strong>MendSeed Dispatch</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #9CA396;">
                Every week, we consolidate real-world friction reported by users, highlight high-signal problems identified by the <strong>QuietFray v0.1</strong> point-process engine, and share open-source solutions currently being built.
              </p>

              <div style="background-color: #11140F; border: 1px solid #22281F; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #9CA396; text-transform: uppercase;">Your Preferences:</p>
                <p style="margin: 0; font-size: 14px; color: #F7F8F4;">
                  • Immediate alerts for new canonical issues: <strong>${notifyNewIssues ? 'Enabled' : 'Disabled'}</strong><br/>
                  • Weekly curated friction summary: <strong>${weeklyDigest ? 'Enabled' : 'Disabled'}</strong>
                </p>
              </div>

              <p style="font-size: 14px; color: #9CA396; margin-bottom: 30px;">
                Privacy guarantee: Your email is never sold, tracked, or cross-referenced with problem reports.
              </p>

              <div style="text-align: center;">
                <a href="https://mendseed.vercel.app" style="background-color: #D2F827; color: #080907; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Explore Active Problems &rarr;
                </a>
              </div>

              <div style="margin-top: 40px; pt: 20px; border-top: 1px solid #22281F; font-size: 11px; color: #585E53; text-align: center;">
                MendSeed Platform • Privacy-first open-source problem observatory
              </div>
            </div>
          `,
        });

        if (emailResult.data) {
          emailSent = true;
          resendMessage = 'Welcome email dispatched successfully via Resend.';
        }
      } catch (emailErr: any) {
        console.warn('[Resend] Email delivery warning:', emailErr);
        resendMessage = `Saved, but email delivery encountered: ${emailErr.message}`;
      }
    }

    return res.status(200).json({
      success: true,
      emailSent,
      message: resendMessage,
      subscriberHash: emailHash,
    });
  } catch (err: any) {
    console.error('[Newsletter API Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
