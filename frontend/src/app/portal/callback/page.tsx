'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Handles both:
// 1. Email confirmation after Sign Up (type=signup in URL)
// 2. Magic link sign-in (legacy, if ever used)
export default function PortalCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        router.replace('/portal/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-sm text-gray-500">Confirming your account…</p>
      </div>
    </div>
  );
}

