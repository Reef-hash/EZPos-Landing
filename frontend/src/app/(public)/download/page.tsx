'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faDesktop, faSpinner, faShieldHalved,
  faCheckCircle, faArrowRight, faCalendar, faTag,
  faExclamationTriangle, faKey,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';

interface DownloadInfo {
  version: string | null;
  name: string | null;
  publishedDate: string | null;
  releaseNotes: string | null;
  downloadUrl: string | null;
  checksum: { algorithm: string; value: string } | null;
  stale?: boolean;
}

const INSTALL_STEPS = [
  'Download the installer below',
  'Run EZPos-Setup-vX.X.X.exe',
  'Follow the installation wizard',
  'Launch EZPos and enter your license key',
];

const SYSTEM_REQ = [
  'Windows 7 or later (64-bit)',
  '.NET 6.0 Runtime (bundled in installer)',
  '2 GB RAM minimum',
  '200 MB free disk space',
];

export default function DownloadPage() {
  const [info, setInfo]     = useState<DownloadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    api.get('/api/downloads/ezpos')
      .then(r => setInfo(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const publishedDate = info?.publishedDate
    ? new Date(info.publishedDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-ezpos-dark to-ezpos py-20">
        <div className="section text-center text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6">
            <FontAwesomeIcon icon={faDesktop} className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Download EZPos</h1>
          <p className="text-blue-100 text-lg max-w-lg mx-auto">
            Free to download. License key required to activate.
          </p>
        </div>
      </section>

      {/* Download card */}
      <section className="section max-w-2xl mx-auto -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-ezpos animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-amber-400" />
              <p className="text-sm">Could not fetch latest version. Please try again later.</p>
            </div>
          )}

          {!loading && info && (
            <>
              {/* Version info bar */}
              <div className="bg-ezpos-light px-6 py-4 flex flex-wrap items-center gap-4 border-b border-ezpos/10">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ezpos">
                  <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5" />
                  {info.name ?? info.version ?? 'Latest'}
                </span>
                {publishedDate && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                    Released {publishedDate}
                  </span>
                )}
                {info.stale && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Version info may be outdated
                  </span>
                )}
              </div>

              {/* Main download button */}
              <div className="p-8 text-center">
                {info.downloadUrl ? (
                  <a
                    href={info.downloadUrl}
                    className="inline-flex items-center gap-3 bg-ezpos hover:bg-ezpos-dark text-white font-bold text-lg px-10 py-4 rounded-2xl transition-colors shadow-lg shadow-ezpos/30"
                  >
                    <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                    Download Installer
                    {info.version && <span className="text-blue-200 text-sm font-normal">v{info.version}</span>}
                  </a>
                ) : (
                  <p className="text-gray-400 text-sm">Download link not available yet. Please contact support.</p>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  Windows 7 / 10 / 11 · 64-bit · Free download
                </p>

                {info.checksum && (
                  <details className="mt-4 text-left max-w-md mx-auto">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 flex items-center gap-1">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                      Verify checksum ({info.checksum.algorithm.toUpperCase()})
                    </summary>
                    <p className="mt-2 font-mono text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-all text-gray-600 select-all">
                      {info.checksum.value}
                    </p>
                  </details>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* How to install */}
      <section className="section max-w-2xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-8">
          {/* Steps */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-ezpos" />
              How to Install
            </h2>
            <ol className="space-y-3">
              {INSTALL_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-ezpos-light text-ezpos font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* System req */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faDesktop} className="w-5 h-5 text-ezpos" />
              System Requirements
            </h2>
            <ul className="space-y-2">
              {SYSTEM_REQ.map(r => (
                <li key={r} className="flex items-start gap-2 text-sm text-gray-600">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* License CTA */}
      <section className="bg-ezpos-light">
        <div className="section text-center py-14 max-w-lg mx-auto">
          <FontAwesomeIcon icon={faKey} className="w-10 h-10 text-ezpos mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Already have a license?</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Download above and enter your license key when the app launches.
          </p>
          <Link href="/pricing?product=ezpos" className="btn-primary bg-ezpos hover:bg-ezpos-dark">
            Get a License <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
