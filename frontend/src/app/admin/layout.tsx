'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faKey, faTags, faChartLine,
  faBoxesStacked,
  faRightFromBracket, faShieldHalved, faWifi, faFlask, faBug,
  faBars, faXmark,
} from '@fortawesome/free-solid-svg-icons';

const navItems = [
  { href: '/admin/dashboard', icon: faGauge,        label: 'Dashboard' },
  { href: '/admin/licenses',  icon: faKey,           label: 'Licenses' },
  { href: '/admin/keys',      icon: faFlask,         label: 'Issue Keys' },
  { href: '/admin/pricing',   icon: faTags,          label: 'Pricing Plans' },
  { href: '/admin/addons',    icon: faBoxesStacked,  label: 'Add-ons' },
  { href: '/admin/sales',     icon: faChartLine,     label: 'Sales' },
  { href: '/admin/monitoring',icon: faWifi,          label: 'Monitoring' },
  { href: '/admin/security',  icon: faBug,           label: 'Security Watch' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    const token = localStorage.getItem('admin_token');
    if (!token) router.replace('/admin/login');
  }, [router, isLoginPage]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.removeItem('admin_token');
    router.replace('/admin/login');
  }

  if (isLoginPage) return <>{children}</>;

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const logoutButton = (
    <div className="px-3 py-4 border-t border-gray-800">
      <button
        onClick={logout}
        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-gray-400 hover:bg-red-900/40 hover:text-red-300 transition-colors text-sm font-medium"
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-lg">EZPos Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Management Portal</p>
        </div>
        {navLinks}
        {logoutButton}
      </aside>

      {/* Mobile drawer — only mounted while open, so closed links are never
          focusable or exposed to screen readers */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col md:hidden">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-brand-400" />
                  <span className="font-bold text-lg">EZPos Admin</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Management Portal</p>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close menu"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
            {navLinks}
            {logoutButton}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">EZPos Admin</span>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
