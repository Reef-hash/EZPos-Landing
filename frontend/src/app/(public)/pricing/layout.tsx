import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans — EZPos & CrossxPos',
  description:
    'Simple, transparent pricing for EZPos Desktop and CrossxPos. EZPos Desktop from RM599 lifetime. No hidden fees. Pay once and own your license.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing & Plans — EZPos & CrossxPos',
    description:
      'EZPos Desktop from RM599 lifetime. Simple, transparent pricing with no hidden fees. Accepts card, FPX, and QR payments.',
    url: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
