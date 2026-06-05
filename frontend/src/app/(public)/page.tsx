import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDesktop, faMobileScreen, faCheckCircle, faArrowRight,
  faShieldHalved, faGaugeHigh, faHeadset, faChartLine,
  faBarcode, faUtensils, faUsers, faStore,
  faQuoteLeft, faStar, faCircleQuestion,
  faChevronDown, faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export const metadata: Metadata = {
  title: 'EZPos — Smart POS Software for Malaysian Businesses',
  description:
    'EZPos offers modern point-of-sale software for Malaysian businesses. EZPos Desktop for retail shops and CrossxPos for restaurants. Simple, offline-ready, and affordable.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'EZPos — Smart POS Software for Malaysian Businesses',
    description:
      'EZPos Desktop for retail shops. CrossxPos for restaurants. Offline-ready, affordable POS solutions built for Malaysia.',
    url: '/',
  },
};

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-700 to-crossx-dark overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="section relative z-10 text-center text-white py-28 md:py-36">
          <span className="badge bg-white/20 text-white mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5" />
            Trusted by Malaysian businesses
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Smart POS Software<br />
            <span className="text-yellow-300">Built for Your Business</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Whether you run a retail shop or a restaurant — we have the right POS for you.
            Simple, fast, offline-ready, and affordable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-base py-3.5 px-8">
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              Get Your License
            </Link>
            <Link href="/compare" className="btn-outline border-white text-white hover:bg-white/10 text-base py-3.5 px-8">
              Compare Products
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="section">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Our Products</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Two purpose-built POS systems — one for retail, one for restaurants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* EZPos Card */}
          <div className="card border-2 border-ezpos/20 hover:border-ezpos transition-colors group relative flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-ezpos-light rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faDesktop} className="w-6 h-6 text-ezpos" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">EZPos Desktop</h3>
                <span className="badge bg-ezpos-light text-ezpos text-xs">Retail POS</span>
              </div>
            </div>
            <p className="text-gray-600 mb-5 leading-relaxed">
              A powerful Windows desktop POS for retail shops. Handle sales, stock, barcodes,
              and receipts — all offline with no internet required.
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {['Barcode scanning', 'Stock management', 'Sales reports', 'ESC/POS receipt printing', 'Offline — no internet needed'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-ezpos flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mt-auto">
              <Link href="/products/ezpos" className="inline-flex items-center gap-2 text-ezpos font-semibold hover:gap-3 transition-all">
                Learn more <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Link>
              <Link href="/download" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-ezpos hover:bg-ezpos-dark px-4 py-2 rounded-xl transition-colors">
                <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                Download
              </Link>
            </div>
          </div>

          {/* CrossxPos Card */}
          <div className="card border-2 border-crossx/20 hover:border-crossx transition-colors group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-crossx-light rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faMobileScreen} className="w-6 h-6 text-crossx" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">CrossxPos</h3>
                <span className="badge bg-crossx-light text-crossx text-xs">Restaurant POS</span>
                <span className="badge bg-amber-50 text-amber-700 text-xs ml-2 border border-amber-200">Under Development</span>
              </div>
            </div>
            <p className="text-gray-600 mb-5 leading-relaxed">
              A modern web-based restaurant POS that works on any device — tablet, phone, or PC.
              Kitchen display, table management, and multi-device operations.
            </p>
            <ul className="space-y-2 mb-6">
              {['Table & order management', 'Kitchen display system', 'Multi-device operations', 'Menu modifiers & add-ons', 'Offline-first (works without WiFi)'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-crossx flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/products/crossxpos" className="inline-flex items-center gap-2 text-crossx font-semibold hover:gap-3 transition-all">
              Learn more <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY EZPOS ── */}
      <section className="bg-gray-50">
        <div className="section">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Why Choose EZPos?</h2>
            <p className="text-gray-500 text-lg">Built with simplicity and reliability in mind.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: faGaugeHigh, title: 'Fast & Lightweight', desc: 'Instant startup, smooth operations even on older hardware.', color: 'text-brand-600' },
              { icon: faShieldHalved, title: 'Offline-First', desc: 'Works without internet. Your data stays safe on your device.', color: 'text-green-600' },
              { icon: faChartLine, title: 'Built-in Reports', desc: 'Daily, monthly reports & CSV exports at your fingertips.', color: 'text-orange-500' },
              { icon: faHeadset, title: 'Local Support', desc: 'Malaysian support team. Reach us via WhatsApp or email.', color: 'text-purple-600' },
            ].map(item => (
              <div key={item.title} className="card text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <FontAwesomeIcon icon={item.icon} className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK COMPARISON ── */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Which One is For You?</h2>
          <p className="text-gray-500 text-lg">Quick side-by-side overview</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-ezpos-light rounded-2xl p-8 text-center">
            <FontAwesomeIcon icon={faStore} className="w-10 h-10 text-ezpos mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">EZPos Desktop</h3>
            <p className="text-gray-600 text-sm mb-4">Best for retail shops, minimarkets, and convenience stores.</p>
            <ul className="text-sm text-gray-700 space-y-1 text-left inline-block">
              {['Windows desktop app', 'Barcode scanner support', 'SQLite local database', 'Receipt printer (ESC/POS)'].map(i => (
                <li key={i} className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-ezpos" />{i}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-crossx-light rounded-2xl p-8 text-center">
            <FontAwesomeIcon icon={faUtensils} className="w-10 h-10 text-crossx mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">CrossxPos</h3>
            <p className="text-gray-600 text-sm mb-4">Best for cafes, restaurants, and F&B businesses.</p>
            <ul className="text-sm text-gray-700 space-y-1 text-left inline-block">
              {['Web app — any browser', 'Table & kitchen management', 'Works on tablets & phones', 'Android/iOS ready'].map(i => (
                <li key={i} className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-crossx" />{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/compare" className="btn-outline">
            See Full Comparison <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-brand-900">
        <div className="section text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3">What Our Customers Say</h2>
            <p className="text-blue-200">Real feedback from real businesses</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ahmad Firdaus', biz: 'Kedai Runcit Ahmad, KL', text: 'EZPos sangat mudah guna. Setup dalam 10 minit je. Barcode scanning laju dan receipt printer berfungsi perfectly.', stars: 5 },
              { name: 'Siti Nabilah', biz: 'Cafe Nabilah, Penang', text: 'CrossxPos membantu kami urus meja dan pesanan dengan lebih teratur. Staff pun cepat belajar guna sistem ni.', stars: 5 },
              { name: 'Ravi Kumar', biz: 'Ravi Minimarket, JB', text: 'Price berbaloi untuk features yang ada. Stock management and laporan jualan sangat helpful untuk bisnes saya.', stars: 5 },
            ].map(t => (
              <div key={t.name} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <FontAwesomeIcon icon={faQuoteLeft} className="w-5 h-5 text-yellow-300 mb-3" />
                <p className="text-blue-100 text-sm leading-relaxed mb-4">{t.text}</p>
                <div className="flex mb-2">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faStar} className="w-3.5 h-3.5 text-yellow-300" />
                  ))}
                </div>
                <p className="font-semibold text-white text-sm">{t.name}</p>
                <p className="text-blue-300 text-xs">{t.biz}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: 'What is the difference between EZPos and CrossxPos?', a: 'EZPos is a Windows desktop POS for retail shops (barcode scanning, stock, receipts). CrossxPos is a web-based POS for restaurants (table management, kitchen display, orders, and multi-device operations).' },
            { q: 'Do I need internet to use the software?', a: 'Both products work fully offline. EZPos stores data locally in SQLite. CrossxPos uses IndexedDB in your browser. Internet is only needed for license activation.' },
            { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, FPX online banking, and QR payments via Stripe — all common Malaysian payment methods.' },
            { q: 'Can I use CrossxPos on my Android tablet?', a: 'Yes! CrossxPos is a Progressive Web App (PWA) that works on any modern browser. Android APK packaging is on our roadmap.' },
            { q: 'What happens after my license expires?', a: 'The software continues to work but you will not receive further updates. You can renew at any time from our pricing page.' },
          ].map(faq => (
            <details key={faq.q} className="card group cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-gray-900 list-none">
                <span className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faCircleQuestion} className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {faq.q}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed pl-7">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA / CONTACT ── */}
      <section id="contact" className="bg-gradient-to-r from-brand-600 to-crossx">
        <div className="section text-center text-white py-24">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Upgrade Your Business?</h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
            Get your license today and start using a smarter POS system within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing" className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-base py-3.5 px-8">
              View Pricing <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/601234567890"
              target="_blank"
              rel="noreferrer"
              className="btn-outline border-white text-white hover:bg-white/10 text-base py-3.5 px-8"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
