'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faRightFromBracket, faGauge, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import supabase from '@/lib/supabase';

const navItems = [
  { href: '/portal/dashboard', icon: faGauge,  label: 'My Licenses' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const publicPaths = ['/portal/login', '/portal/callback', '/portal/reset-password'];
      if (!session && !publicPaths.includes(pathname)) {
        router.replace('/portal/login');
      }
    });
  }, [pathname, router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/portal/login');
  }

  if (pathname === '/portal/login' || pathname === '/portal/callback' || pathname === '/portal/reset-password') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-brand-600" />
          <span className="font-bold text-gray-900">My EZPos Account</span>
        </div>
        <nav className="flex items-center gap-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith(item.href) ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            Sign Out
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
