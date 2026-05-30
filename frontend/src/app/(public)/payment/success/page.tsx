'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faKey, faSpinner, faEnvelope, faArrowRight, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';

interface LicenseInfo {
  key: string;
  product: string;
  plan_name: string;
  expires_at: string;
  customer_name: string;
  customer_email: string;
}

export default function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setSessionId(new URLSearchParams(window.location.search).get('session_id'));
  }, []);

  useEffect(() => {
    if (sessionId === null) {
      return;
    }
    if (!sessionId) {
      setError('Invalid session.');
      setLoading(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await api.get(`/api/payments/session/${sessionId}`);
        setLicense(res.data.license);
        setLoading(false);
      } catch (err: any) {
        if (attempts < 5) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setError('License not generated yet. Please contact support.');
          setLoading(false);
        }
      }
    };

    poll();
  }, [sessionId, attempts]);

  if (loading) {
    return (
      <div className="section text-center py-32">
        <FontAwesomeIcon icon={faSpinner} className="w-10 h-10 text-brand-600 animate-spin mb-4" />
        <p className="text-gray-500">Confirming your payment and generating license…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section text-center py-32">
        <FontAwesomeIcon icon={faExclamationTriangle} className="w-10 h-10 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <a href="mailto:support@ezpos.my" className="btn-primary">
          Contact Support <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="section py-24 text-center">
      <div className="max-w-lg mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faCheckCircle} className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-8">
          Thank you, <strong>{license?.customer_name}</strong>. Your license has been generated.
        </p>

        <div className="card text-left mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faKey} className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">Your License Key</h2>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-lg font-bold text-center text-gray-900 tracking-widest mb-4 break-all">
            {license?.key}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Product:</span> <span className="font-medium capitalize">{license?.product}</span></div>
            <div><span className="text-gray-500">Plan:</span> <span className="font-medium">{license?.plan_name}</span></div>
            <div><span className="text-gray-500">Valid until:</span> <span className="font-medium">{license?.expires_at ? new Date(license.expires_at).toLocaleDateString() : '—'}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{license?.customer_email}</span></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3 text-left mb-8">
          <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mt-0.5 flex-shrink-0" />
          A copy of your license key has been sent to your email address.
        </div>

        <Link href="/" className="btn-primary">
          Back to Home <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
