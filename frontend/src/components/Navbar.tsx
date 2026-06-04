'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faCashRegister, faRightToBracket, faUserPlus, faGauge } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const navLinks = [
  { href: '/#products', label: 'Products' },
  { href: '/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
          <FontAwesomeIcon icon={faCashRegister} className="text-brand-600 w-6 h-6" />
          <span>EZPos</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-600 hover:text-brand-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          {loggedIn ? (
            <Link
              href="/portal/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <FontAwesomeIcon icon={faGauge} className="w-4 h-4" />
              My Account
            </Link>
          ) : (
            <>
              <Link
                href="/portal/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/portal/login?tab=signup"
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-2 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                Sign Up
              </Link>
            </>
          )}
          <Link href="/pricing" className="btn-primary text-sm py-2 px-4 ml-1">
            Get License
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-brand-600"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={open ? faXmark : faBars} className="w-5 h-5" />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-gray-700 hover:text-brand-600 font-medium py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {loggedIn ? (
              <Link
                href="/portal/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-brand-700 font-medium py-2"
              >
                <FontAwesomeIcon icon={faGauge} className="w-4 h-4" />
                My Account
              </Link>
            ) : (
              <>
                <Link
                  href="/portal/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-brand-600 font-medium py-2"
                >
                  <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  href="/portal/login?tab=signup"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-brand-600 font-medium py-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}
            <Link href="/pricing" onClick={() => setOpen(false)} className="btn-primary w-full justify-center">
              Get License
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
