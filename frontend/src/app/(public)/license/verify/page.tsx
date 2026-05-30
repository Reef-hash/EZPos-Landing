'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSearch, faCheckCircle, faXmarkCircle, faCalendarDays,
  faUser, faBoxOpen, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';

interface VerifyResult {
  valid: boolean;
  product: string;
  plan: string;
  expiresAt: string;
  customerName: string;
  expired: boolean;
  error?: string;
}

export default function LicenseVerifyPage() {
  const [key, setKey] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get(`/api/licenses/verify/${encodeURIComponent(key.trim())}`);
      setResult(res.data);
    } catch (err: any) {
      setResult({ valid: false, product: '', plan: '', expiresAt: '', customerName: '', expired: false, error: 'License key not found.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section py-20 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faKey} className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verify License Key</h1>
        <p className="text-gray-500">Enter your EZPos or CrossxPos license key to check its status.</p>
      </div>

      <form onSubmit={handleVerify} className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">License Key</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="e.g. EZP-PRO-A1B2-C3D4-E5F6G7H8"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading
              ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
              : <><FontAwesomeIcon icon={faSearch} className="w-4 h-4" /> Verify</>
            }
          </button>
        </div>
      </form>

      {result && (
        <div className={`card border-2 ${result.valid ? 'border-green-400' : 'border-red-400'}`}>
          <div className="flex items-center gap-3 mb-5">
            <FontAwesomeIcon
              icon={result.valid ? faCheckCircle : faXmarkCircle}
              className={`w-8 h-8 ${result.valid ? 'text-green-500' : 'text-red-400'}`}
            />
            <div>
              <h2 className={`font-bold text-lg ${result.valid ? 'text-green-700' : 'text-red-600'}`}>
                {result.valid ? 'Valid License' : result.expired ? 'Expired License' : 'Invalid License'}
              </h2>
              {result.error && <p className="text-red-500 text-sm">{result.error}</p>}
            </div>
          </div>

          {result.valid && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxOpen} className="w-4 h-4 text-brand-500" />
                <span className="text-gray-500">Product:</span>
                <span className="font-medium capitalize">{result.product}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-brand-500" />
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">{result.plan}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-brand-500" />
                <span className="text-gray-500">Registered to:</span>
                <span className="font-medium">{result.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-brand-500" />
                <span className="text-gray-500">Expires:</span>
                <span className="font-medium">{new Date(result.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
