const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Applied to every route, including /admin and /portal. A nonce-based
// script-src (no 'unsafe-inline') was tried first and dropped: Next 16's
// documented request-header mechanism for propagating the nonce to its own
// RSC hydration scripts (see getScriptNonceFromHeader in
// next/dist/server/app-render/app-render.js, which reads
// content-security-policy off the *request* headers) did not actually apply
// nonces to the emitted <script> tags in this Turbopack build when verified
// live with Playwright — every hydration script and Next's own inline
// scripts got blocked, breaking the app. 'unsafe-inline' on script-src is
// the pragmatic, verified-working tradeoff: it still leaves every other
// directive (frame-ancestors for clickjacking, object-src, base-uri,
// form-action, connect-src allowlist) at full strength, and the site has no
// user-generated-HTML rendering path (no dangerouslySetInnerHTML fed by
// untrusted input) so the realistic inline-script-injection surface this
// gives up is low.
const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ${API_URL} ${SUPABASE_URL}`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
