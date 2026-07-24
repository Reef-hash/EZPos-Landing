import { supabase } from './supabase';
import { Request } from 'express';

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high';

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'login_bruteforce_suspected'
  | 'admin_probe'
  | 'entitlement_probe_blocked'
  | 'transfer_confirm_blocked'
  | 'webhook_signature_invalid'
  | 'suspicious_path_probe';

interface LogInput {
  type: SecurityEventType;
  severity: SecuritySeverity;
  req: Request;
  message: string;
  meta?: Record<string, unknown>;
}

function clientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

function isMissingRelationError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === '42P01' || /relation .* does not exist/i.test(error.message ?? '');
}

// Debounce identical (type, ip) events so a hammering attacker doesn't flood
// the table with thousands of near-identical rows — we only care that it's
// happening, not a row per millisecond.
const lastLogged = new Map<string, number>();
const DEBOUNCE_MS = 15_000;

export async function logSecurityEvent({ type, severity, req, message, meta }: LogInput): Promise<void> {
  const ip = clientIp(req);
  const key = `${type}:${ip}`;
  const now = Date.now();
  const last = lastLogged.get(key);
  if (last && now - last < DEBOUNCE_MS) return;
  lastLogged.set(key, now);

  const { error } = await supabase.from('security_events').insert({
    event_type: type,
    severity,
    ip,
    path: req.originalUrl,
    method: req.method,
    message,
    meta_json: meta ?? {},
  });

  if (error && !isMissingRelationError(error)) {
    console.warn('[security-log] failed to persist event', { type, code: error.code, message: error.message });
  }
}

// ─── Login brute-force tracking (in-memory sliding window, per process) ──────

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const FAILURE_THRESHOLD = 5;
const failuresByIp = new Map<string, number[]>();

export function recordLoginFailure(req: Request): { count: number; suspected: boolean } {
  const ip = clientIp(req);
  const now = Date.now();
  const existing = (failuresByIp.get(ip) ?? []).filter(ts => now - ts < FAILURE_WINDOW_MS);
  existing.push(now);
  failuresByIp.set(ip, existing);
  return { count: existing.length, suspected: existing.length >= FAILURE_THRESHOLD };
}

export function clearLoginFailures(req: Request): void {
  failuresByIp.delete(clientIp(req));
}

// ─── Message styling ──────────────────────────────────────────────────────
// Casual, log-book tone — readable at a glance in the admin panel, not a wall
// of formal security-vendor prose. Still carries the real data (ip/count/path).

export function bruteforceMessage(ip: string, count: number): string {
  return `${ip} hit the login ${count}x in 15 min — smells like bruteforce, but it's exhausted itself against the rate limit.`;
}

export function loginFailedMessage(ip: string, reason: 'bad_email' | 'bad_password'): string {
  return reason === 'bad_email'
    ? `${ip} tried logging in with an email that isn't the admin account.`
    : `${ip} got the admin password wrong.`;
}

export function adminProbeMessage(ip: string, path: string, reason: 'missing_token' | 'invalid_token'): string {
  return reason === 'missing_token'
    ? `${ip} poked ${path} with no token at all — looks like a scan, not a mistake.`
    : `${ip} showed up at ${path} with a bad/expired admin token.`;
}

export function entitlementProbeMessage(ip: string, id: string): string {
  return `${ip} tried to read entitlement ${id} with no license key and no admin session — blocked before it saw a thing.`;
}

export function transferConfirmBlockedMessage(ip: string, transferRequestId: string): string {
  return `${ip} tried to self-approve license transfer ${transferRequestId}, which needs admin sign-off — nice try, blocked.`;
}

export function webhookInvalidSignatureMessage(ip: string): string {
  return `${ip} sent something to the Stripe webhook with a signature that doesn't check out — dropped it.`;
}

export function suspiciousPathMessage(ip: string, path: string): string {
  return `${ip} went looking for ${path} — nothing there, 404'd and moved on.`;
}
