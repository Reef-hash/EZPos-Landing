import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EZPos — Smart POS Solutions for Your Business',
  description:
    'EZPos offers modern point-of-sale software for retail shops (EZPos Desktop) and restaurants (CrossxPos). Simple, reliable, and affordable.',
  keywords: 'POS, point of sale, retail POS, restaurant POS, EZPos, CrossxPos, Malaysia',
  openGraph: {
    title: 'EZPos — Smart POS Solutions',
    description: 'Desktop POS for retail. Web POS for restaurants.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
