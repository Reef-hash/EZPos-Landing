import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'EZPos vs CrossxPos — Full Feature Comparison',
  description:
    'Compare EZPos Desktop (retail POS) vs CrossxPos (restaurant POS). See side-by-side features, pricing, and which product suits your business.',
  alternates: { canonical: '/compare' },
  openGraph: {
    title: 'EZPos vs CrossxPos — Full Feature Comparison',
    description:
      'Compare EZPos Desktop and CrossxPos side by side to find the right POS for your business.',
    url: '/compare',
  },
};
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faXmark, faArrowRight,
  faDesktop, faMobileScreen,
} from '@fortawesome/free-solid-svg-icons';

const rows = [
  { feature: 'Platform', ezpos: 'Windows Desktop (.exe)', crossx: 'Web App (any browser)' },
  { feature: 'Best for', ezpos: 'Retail shops, minimarkets', crossx: 'Cafes, restaurants, F&B' },
  { feature: 'Offline support', ezpos: true, crossx: true },
  { feature: 'Barcode scanning', ezpos: true, crossx: false },
  { feature: 'Stock management', ezpos: true, crossx: false },
  { feature: 'Table management', ezpos: false, crossx: true },
  { feature: 'Kitchen display', ezpos: false, crossx: true },
  { feature: 'Multi-device operations', ezpos: false, crossx: true },
  { feature: 'Menu modifiers (add-ons)', ezpos: false, crossx: true },
  { feature: 'Shift management', ezpos: false, crossx: true },
  { feature: 'Role-based access', ezpos: false, crossx: true },
  { feature: 'ESC/POS receipt printing', ezpos: true, crossx: true },
  { feature: 'Sales reports & CSV export', ezpos: true, crossx: true },
  { feature: 'Works on tablets/phones', ezpos: false, crossx: true },
  { feature: 'Android/iOS APK', ezpos: false, crossx: 'Roadmap' },
  { feature: 'License system', ezpos: true, crossx: true },
  { feature: 'Starting price', ezpos: 'RM 599/yr', crossx: 'Coming soon' },
];

export default function ComparePage() {
  return (
    <div className="section">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">EZPos vs CrossxPos</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Not sure which product is right for you? Here&apos;s a full side-by-side comparison.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl shadow-md border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-semibold text-gray-700 w-1/2">Feature</th>
              <th className="text-center py-4 px-6 font-semibold w-1/4">
                <div className="flex flex-col items-center gap-1">
                  <FontAwesomeIcon icon={faDesktop} className="w-6 h-6 text-ezpos" />
                  <span className="text-ezpos">EZPos Desktop</span>
                </div>
              </th>
              <th className="text-center py-4 px-6 font-semibold w-1/4">
                <div className="flex flex-col items-center gap-1">
                  <FontAwesomeIcon icon={faMobileScreen} className="w-6 h-6 text-crossx" />
                  <span className="text-crossx">CrossxPos</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3.5 px-6 font-medium text-gray-700">{row.feature}</td>
                <td className="py-3.5 px-6 text-center">
                  {row.ezpos === true ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-500 mx-auto" />
                  ) : row.ezpos === false ? (
                    <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-gray-300 mx-auto" />
                  ) : (
                    <span className="text-gray-700">{row.ezpos}</span>
                  )}
                </td>
                <td className="py-3.5 px-6 text-center">
                  {row.crossx === true ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-500 mx-auto" />
                  ) : row.crossx === false ? (
                    <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-gray-300 mx-auto" />
                  ) : (
                    <span className="text-gray-700 text-xs">{row.crossx}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="card border-2 border-ezpos/30 text-center">
          <FontAwesomeIcon icon={faDesktop} className="w-10 h-10 text-ezpos mb-3" />
          <h2 className="font-bold text-xl text-gray-900 mb-2">Choose EZPos if you…</h2>
          <ul className="text-sm text-gray-600 space-y-1.5 text-left inline-block">
            {['Run a retail shop or minimarket', 'Need barcode scanning', 'Use a Windows PC at the counter', 'Want stock management'].map(i => (
              <li key={i} className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-ezpos" />{i}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Link href="/pricing?product=ezpos" className="btn-primary bg-ezpos hover:bg-ezpos-dark">
              Get EZPos <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="card border-2 border-crossx/30 text-center">
          <FontAwesomeIcon icon={faMobileScreen} className="w-10 h-10 text-crossx mb-3" />
          <h2 className="font-bold text-xl text-gray-900 mb-2">Choose CrossxPos if you…</h2>
          <ul className="text-sm text-gray-600 space-y-1.5 text-left inline-block">
            {['Run a cafe, restaurant, or F&B', 'Need table & kitchen management', 'Need multi-device staff + cashier flow', 'Need Android/iOS support'].map(i => (
              <li key={i} className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-crossx" />{i}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <span className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-semibold bg-gray-300 text-gray-700 cursor-not-allowed">
              CrossxPos Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
