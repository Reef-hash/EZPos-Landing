'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faSpinner, faEnvelope, faLock,
  faUserPlus, faRightToBracket, faEye, faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Tab = 'login' | 'signup';

export default function PortalLoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/portal/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'signup') setTab('signup');
    const redirect = params.get('redirect');
    if (redirect) setRedirectTo(redirect);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = redirectTo;
    } catch (err: any) {
      toast.error(err.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal/callback`,
        },
      });
      if (error) throw error;
      setSignupSent(true);
    } catch (err: any) {
      toast.error(err.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FontAwesomeIcon icon={faShieldHalved} className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">Customer Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your licenses anytime</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          {(['login', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSignupSent(false); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FontAwesomeIcon
                icon={t === 'login' ? faRightToBracket : faUserPlus}
                className="mr-1.5 w-3.5 h-3.5"
              />
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Sign Up — sent confirmation */}
        {tab === 'signup' && signupSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faEnvelope} className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-sm text-gray-500">
              We sent a confirmation link to <strong className="text-gray-700">{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setSignupSent(false); setTab('login'); }}
              className="mt-5 text-sm text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {/* Email */}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {tab === 'signup' && <span className="text-gray-400 font-normal">(min. 8 characters)</span>}
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) { toast.error('Enter your email first.'); return; }
                    setLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/portal/reset-password`,
                    });
                    setLoading(false);
                    if (error) toast.error(error.message);
                    else toast.success('Password reset link sent to your email.');
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                : <FontAwesomeIcon icon={tab === 'login' ? faRightToBracket : faUserPlus} className="w-4 h-4" />
              }
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
