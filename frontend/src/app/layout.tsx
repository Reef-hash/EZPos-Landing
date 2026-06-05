import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import Script from 'next/script';

config.autoAddCss = false;

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://ezpos.my';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EZPos — Smart POS Software for Malaysian Businesses',
    template: '%s | EZPos',
  },
  description:
    'EZPos offers modern point-of-sale software for Malaysian businesses — EZPos Desktop for retail shops and CrossxPos for restaurants. Simple, offline-ready, and affordable.',
  keywords: 'POS, point of sale, retail POS, restaurant POS, EZPos, CrossxPos, Malaysia, kasir, sistem POS',
  openGraph: {
    title: 'EZPos — Smart POS Software for Malaysian Businesses',
    description:
      'EZPos Desktop for retail shops. CrossxPos for restaurants. Offline-ready, affordable POS solutions built for Malaysia.',
    type: 'website',
    url: SITE_URL,
    siteName: 'EZPos',
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EZPos — Smart POS Software for Malaysian Businesses',
    description:
      'EZPos Desktop for retail shops. CrossxPos for restaurants. Offline-ready, affordable POS solutions built for Malaysia.',
    site: '@ezposmy',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
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
      </body>
    </html>
  );
}
