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

// Supabase magic link redirects here with access_token in URL hash.
// We let the Supabase JS client pick it up and then redirect to dashboard.
export default function PortalCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/portal/dashboard');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="mt-3 text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}
