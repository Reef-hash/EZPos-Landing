import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download EZPos Desktop — Free Windows POS Installer',
  description:
    'Download the latest EZPos Desktop installer for Windows. Free to download — license key required to activate. Supports Windows 7, 10, and 11 (64-bit).',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Download EZPos Desktop — Free Windows POS Installer',
    description:
      'Download the free EZPos Desktop installer for Windows. License key required to activate. Supports Windows 7, 10, and 11.',
    url: '/download',
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
