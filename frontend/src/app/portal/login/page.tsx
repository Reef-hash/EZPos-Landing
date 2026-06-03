'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faSpinner, faEnvelope, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/portal/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="w-13 h-13 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3 w-14 h-14">
            <FontAwesomeIcon icon={faShieldHalved} className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">Customer Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your licenses</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCircleCheck} className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong className="text-gray-700">{email}</strong>.
              Click the link to sign in — no password needed.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-5 text-sm text-brand-600 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading
                ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                : 'Send Magic Link'
              }
            </button>
            <p className="text-center text-xs text-gray-400">
              Use the email you registered during purchase.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
