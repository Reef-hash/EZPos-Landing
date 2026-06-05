import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCashRegister,
  faEnvelope,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <FontAwesomeIcon icon={faCashRegister} className="w-6 h-6 text-brand-400" />
              EZPos
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Modern, affordable point-of-sale software built for Malaysian businesses.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="EZPos on Facebook" className="hover:text-white transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="EZPos on Instagram" className="hover:text-white transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="https://wa.me/601234567890" target="_blank" rel="noreferrer" aria-label="Chat with EZPos on WhatsApp" className="hover:text-white transition-colors">
                <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/ezpos" className="hover:text-white transition-colors">EZPos Desktop</Link></li>
              <li><Link href="/products/crossxpos" className="hover:text-white transition-colors">CrossxPos Restaurant</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Products</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/license/verify" className="hover:text-white transition-colors">Verify License</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/portal/dashboard" className="hover:text-white transition-colors">Manage My License</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-brand-400" />
                <a href="mailto:support@ezpos.my" className="hover:text-white transition-colors">support@ezpos.my</a>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-brand-400" />
                <a href="tel:+601234567890" className="hover:text-white transition-colors">+60 12-345 6789</a>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4 text-green-400" />
                <a href="https://wa.me/601234567890" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp Us</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© {new Date().getFullYear()} EZPos. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Built for Malaysian businesses 🇲🇾</p>
        </div>
      </div>
    </footer>
  );
}
