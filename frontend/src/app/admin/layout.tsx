'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge, faKey, faTags, faChartLine,
  faBoxesStacked,
  faRightFromBracket, faShieldHalved, faWifi, faFlask, faBug,
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

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) router.replace('/admin/login');
  }, [router]);

  function logout() {
    localStorage.removeItem('admin_token');
    router.replace('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-lg">EZPos Admin</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Management Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
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
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-gray-400 hover:bg-red-900/40 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
