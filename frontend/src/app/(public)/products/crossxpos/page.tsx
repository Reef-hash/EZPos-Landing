import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faCheckCircle, faArrowRight,
  faTableCells, faUtensils, faKitchenSet, faUsers,
  faChartColumn, faToggleOn, faPrint, faClockRotateLeft,
  faWifi, faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

export const metadata: Metadata = {
  title: 'CrossxPos — Web-Based Restaurant POS for Cafes & F&B',
  description:
    'CrossxPos is a modern web-based restaurant POS for cafes, restaurants, and F&B businesses. Table management, kitchen display, multi-device operations. Works offline.',
  alternates: { canonical: '/products/crossxpos' },
  openGraph: {
    title: 'CrossxPos — Web-Based Restaurant POS',
    description:
      'CrossxPos is a web-based restaurant POS with table management, kitchen display, and offline support. Works on any device.',
    url: '/products/crossxpos',
  },
};

const features = [
  { icon: faTableCells, title: 'Table Management', desc: 'Visual table map with real-time status — occupied, empty, or reserved.' },
  { icon: faKitchenSet, title: 'Kitchen Display System', desc: 'Live order queue for kitchen staff. No paper tickets needed.' },
  { icon: faUtensils, title: 'Order & KOT Flow', desc: 'Take orders, send to kitchen, manage active orders all in one screen.' },
  { icon: faUsers, title: 'Multi-Device Operations', desc: 'Use staff tablets, cashier terminals, and front counter screens together.' },
  { icon: faToggleOn, title: 'Menu Modifiers', desc: 'Support for toppings, add-ons, sizes, and customizations.' },
  { icon: faChartColumn, title: 'Reports & Export', desc: 'Date range reports, hourly charts, and CSV export for analysis.' },
  { icon: faClockRotateLeft, title: 'Shift Management', desc: 'Open/close shifts, manage cash drawer, and track variance.' },
  { icon: faPrint, title: 'ESC/POS Printing', desc: 'Receipt and kitchen ticket printing via thermal printer.' },
  { icon: faWifi, title: 'Offline-First', desc: 'Built on IndexedDB — all data stored on device. Works without WiFi.' },
  { icon: faShieldHalved, title: 'Role-Based Access', desc: 'Admin, Cashier, Waiter, Kitchen — each role sees only what they need.' },
];

export default function CrossxPosProductPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-crossx-dark to-crossx py-24">
        <div className="section text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6">
            <FontAwesomeIcon icon={faMobileScreen} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">CrossxPos</h1>
          <p className="text-purple-100 text-xl max-w-xl mx-auto mb-8">
            The modern restaurant POS that runs on any device — tablet, phone, or PC.
            Built for cafes, restaurants, and F&amp;B chains.
          </p>
          <p className="inline-block mb-8 text-sm font-semibold text-amber-900 bg-amber-100 border border-amber-200 rounded-xl px-4 py-2">
            Under Development — licensing and purchasing are not available yet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <span className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold bg-gray-300 text-gray-700 cursor-not-allowed">
              Coming Soon
            </span>
            <Link href="/compare" className="btn-outline border-white text-white hover:bg-white/10">
              Compare Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Full-Featured Restaurant POS</h2>
          <p className="text-gray-500 text-lg">Everything your F&B business needs, in one system.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {features.map(f => (
            <div key={f.title} className="card hover:shadow-lg transition-shadow text-center">
              <div className="w-12 h-12 bg-crossx-light rounded-xl flex items-center justify-center mb-3 mx-auto">
                <FontAwesomeIcon icon={f.icon} className="w-6 h-6 text-crossx" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans teaser */}
      <section className="bg-crossx-light">
        <div className="section text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Affordable for Every F&B Business</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Pricing will be announced when CrossxPos launches.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left mb-8">
            {[
              { name: 'Standard', price: 'RM 499/yr', features: ['3 staff', '10 tables', '50 menu items', 'KOT & cashier', 'Kitchen display'] },
              { name: 'Pro', price: 'RM 699/yr', features: ['15 staff', 'Unlimited tables', 'Unlimited menu', 'All Standard features', 'Shift management', 'Multi-device operations'], popular: true },
            ].map(plan => (
              <div key={plan.name} className={`card relative ${plan.popular ? 'border-2 border-crossx ring-2 ring-crossx/20' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-crossx text-white text-xs">Most Popular</span>
                )}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                <p className="text-crossx font-extrabold text-2xl mb-3">{plan.price}</p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-crossx" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <span className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold bg-gray-300 text-gray-700 cursor-not-allowed">
            Pricing Coming Soon
          </span>
        </div>
      </section>
    </>
  );
}
