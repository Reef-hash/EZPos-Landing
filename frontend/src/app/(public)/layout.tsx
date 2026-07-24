import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Script from 'next/script';

const SITE_URL = 'https://ezpos.my';

// application/ld+json script elements are not JS-executable, so they are
// exempt from CSP script-src blocking in every modern browser — no nonce
// needed here even though /admin and /portal (which don't render this
// layout) require one for Next's own hydration scripts.
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EZPos',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+60-12-345-6789',
      contactType: 'customer support',
      availableLanguage: ['English', 'Malay'],
    },
  ],
  email: 'support@ezpos.my',
  sameAs: [
    'https://www.facebook.com/ezposmy',
    'https://www.instagram.com/ezposmy',
  ],
};

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EZPos Desktop',
  operatingSystem: 'Windows',
  applicationCategory: 'BusinessApplication',
  description:
    'EZPos Desktop is a Windows POS application for retail shops featuring barcode scanning, stock management, receipt printing, and offline operation.',
  offers: {
    '@type': 'Offer',
    price: '599',
    priceCurrency: 'MYR',
    url: `${SITE_URL}/pricing`,
  },
  publisher: {
    '@type': 'Organization',
    name: 'EZPos',
    url: SITE_URL,
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1" id="main-content">{children}</main>
      <Footer />
      <Script
        id="json-ld-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        strategy="afterInteractive"
      />
      <Script
        id="json-ld-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        strategy="afterInteractive"
      />
    </div>
  );
}
