import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDesktop, faCheckCircle, faArrowRight, faBarcode,
  faBoxesStacked, faReceipt, faChartBar, faBolt,
  faDatabase, faShieldHalved, faDownload,
} from '@fortawesome/free-solid-svg-icons';

const features = [
  { icon: faBarcode, title: 'Barcode Scanning', desc: 'Scan products instantly with any USB barcode scanner. Fast checkout every time.' },
  { icon: faBoxesStacked, title: 'Stock Management', desc: 'Track inventory levels, low stock alerts, and reorder management built-in.' },
  { icon: faReceipt, title: 'ESC/POS Printing', desc: 'Direct receipt printing to thermal printers. No setup headaches.' },
  { icon: faChartBar, title: 'Sales Reports', desc: 'Daily and monthly sales summaries. Export to CSV for your accountant.' },
  { icon: faBolt, title: 'Fast & Lightweight', desc: 'Instant startup. Runs smoothly on older Windows machines.' },
  { icon: faDatabase, title: 'SQLite Local DB', desc: 'All data stored locally — no cloud dependency, no monthly fees.' },
  { icon: faShieldHalved, title: 'Fully Offline', desc: 'Works without internet. Never lose sales due to connectivity issues.' },
  { icon: faDownload, title: 'Easy Install', desc: 'Simple installer. Setup done in under 5 minutes.' },
];

export default function EZPosProductPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-ezpos-dark to-ezpos py-24">
        <div className="section text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6">
            <FontAwesomeIcon icon={faDesktop} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">EZPos Desktop</h1>
          <p className="text-blue-100 text-xl max-w-xl mx-auto mb-8">
            The reliable Windows POS system for retail shops, minimarkets, and convenience stores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing?product=ezpos" className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-gray-900">
              Get License <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Link>
            <Link href="/compare" className="btn-outline border-white text-white hover:bg-white/10">
              Compare Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Everything You Need</h2>
          <p className="text-gray-500 text-lg">A complete retail POS solution right out of the box.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-ezpos-light rounded-xl flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={f.icon} className="w-6 h-6 text-ezpos" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans teaser */}
      <section className="bg-ezpos-light">
        <div className="section text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 mb-8 text-lg">
            From RM599/year — no hidden fees, no monthly subscriptions.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left mb-8">
            {[
              { name: 'Standard', price: 'RM 599/yr', features: ['1 PC', 'Barcode scanning', 'Sales & stock', 'Receipt printing'] },
              { name: 'Business', price: 'RM 1400/yr', features: ['Up to 3 PCs', 'All Standard features', 'Accounting integration (soon)', 'Cloud backup (soon)', 'Priority support'], popular: true },
            ].map(plan => (
              <div key={plan.name} className={`card relative ${plan.popular ? 'border-2 border-ezpos ring-2 ring-ezpos/20' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-ezpos text-white text-xs">Most Popular</span>
                )}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                <p className="text-ezpos font-extrabold text-2xl mb-3">{plan.price}</p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-ezpos" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href="/pricing?product=ezpos" className="btn-primary">
            View Full Pricing <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
