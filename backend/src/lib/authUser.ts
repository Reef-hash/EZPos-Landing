import { supabase } from './supabase';

export type EnsureAuthUserResult =
  | { ok: true; created: boolean }
  | { ok: false; error: string };

// Supabase returns slightly different wording/status depending on the GoTrue
// version, so match on both rather than a single string.
function isAlreadyRegistered(error: { message?: string; status?: number; code?: string }): boolean {
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === 'email_exists' ||
    error.status === 422 ||
    msg.includes('already been registered') ||
    msg.includes('already registered')
  );
}

/**
 * Makes sure a Supabase Auth user exists for a customer's email.
 *
 * Why this exists: EZOffice activation sends an email OTP with
 * `shouldCreateUser: false` (so strangers can't self-register), which only
 * works for emails that already exist in Supabase Auth. Customers are created
 * in the `customers` table by admin key generation and by the Stripe webhook,
 * neither of which touched Auth — so those customers could never receive a code.
 *
 * Never throws: callers (notably the Stripe webhook) must not fail or retry a
 * payment over an auth-side problem. The result is returned so the caller can
 * surface it; failures are also logged.
 */
export async function ensureAuthUser(email: string): Promise<EnsureAuthUserResult> {
  const { error } = await supabase.auth.admin.createUser({ email, email_confirm: true });

  if (!error) return { ok: true, created: true };
  if (isAlreadyRegistered(error)) return { ok: true, created: false };

  console.error(`[authUser] Failed to ensure Supabase Auth user for ${email}: ${error.message}`);
  return { ok: false, error: error.message };
}
