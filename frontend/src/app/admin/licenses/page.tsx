'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSpinner, faToggleOn, faToggleOff,
  faTrash, faSearch, faDesktop, faMobileScreen,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { License } from '@/types';
import toast from 'react-hot-toast';

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/admin/licenses')
      .then(r => setLicenses(r.data))
      .catch(() => toast.error('Failed to load licenses'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(lic: License) {
    try {
      const res = await api.patch(`/api/admin/licenses/${lic.id}`, { is_active: !lic.is_active });
      setLicenses(prev => prev.map(l => l.id === lic.id ? res.data : l));
      toast.success(`License ${res.data.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to update license');
    }
  }

  async function deleteLicense(id: string) {
    if (!confirm('Delete this license? This cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/licenses/${id}`);
      setLicenses(prev => prev.filter(l => l.id !== id));
      toast.success('License deleted');
    } catch {
      toast.error('Failed to delete license');
    }
  }

  const filtered = licenses.filter(l =>
    l.key.toLowerCase().includes(search.toLowerCase()) ||
    l.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    l.customer_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-brand-600" />
          License Keys
        </h1>
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['License Key', 'Customer', 'Product', 'Plan', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(lic => {
                const expired = new Date(lic.expires_at) < new Date();
                return (
                  <tr key={lic.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{lic.key}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{lic.customer_name}</div>
                      <div className="text-gray-500 text-xs">{lic.customer_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${lic.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
                        <FontAwesomeIcon icon={lic.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                        {lic.product}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{lic.plan_name}</td>
                    <td className="py-3 px-4">
                      <span className={expired ? 'text-red-500' : 'text-gray-700'}>
                        {new Date(lic.expires_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${lic.is_active && !expired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {lic.is_active && !expired ? 'Active' : expired ? 'Expired' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(lic)} title={lic.is_active ? 'Deactivate' : 'Activate'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${lic.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                          <FontAwesomeIcon icon={lic.is_active ? faToggleOn : faToggleOff} className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteLicense(lic.id)} title="Delete"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No licenses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
