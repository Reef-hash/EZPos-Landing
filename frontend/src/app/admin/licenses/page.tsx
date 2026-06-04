'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSpinner, faSearch, faDesktop, faMobileScreen,
  faChevronRight, faPause, faPlay, faCircleCheck, faCircleXmark,
  faClock, faLaptop, faFlask, faUser, faWrench,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { V1License, EntitlementStatus, KeyType } from '@/types';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<EntitlementStatus, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700' },
  expired:   { label: 'Expired',   cls: 'bg-red-100 text-red-600' },
  revoked:   { label: 'Revoked',   cls: 'bg-red-100 text-red-700' },
  pending:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-500' },
};

function KeyTypePip({ type }: { type: KeyType }) {
  if (type === 'production' || !type) return null;
  const map = {
    manual:   { icon: faUser,   cls: 'bg-blue-100 text-blue-700',     label: 'Manual' },
    demo:     { icon: faFlask,  cls: 'bg-amber-100 text-amber-700',   label: 'Demo' },
    internal: { icon: faWrench, cls: 'bg-purple-100 text-purple-700', label: 'Internal' },
  };
  const m = map[type];
  return (
    <span className={`ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${m.cls}`}>
      <FontAwesomeIcon icon={m.icon} className="w-2.5 h-2.5" />
      {m.label}
    </span>
  );
}

type TypeFilter = 'all' | 'production' | 'manual' | 'demo' | 'internal';

export default function AdminLicensesPage() {
  const [licenses, setLicenses]     = useState<V1License[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('production');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/admin/v1/licenses')
      .then(r => setLicenses(r.data))
      .catch(() => toast.error('Failed to load licenses'))
      .finally(() => setLoading(false));
  }, []);

  async function suspendEntitlement(lic: V1License) {
    if (!confirm(`Suspend entitlement for ${lic.license_key}?`)) return;
    setActionLoading(lic.entitlement_id);
    try {
      await api.post(`/api/admin/v1/entitlements/${lic.entitlement_id}/suspend`);
      setLicenses(prev => prev.map(l =>
        l.entitlement_id === lic.entitlement_id ? { ...l, entitlement_status: 'suspended' } : l
      ));
      toast.success('Entitlement suspended');
    } catch {
      toast.error('Failed to suspend');
    } finally {
      setActionLoading(null);
    }
  }

  async function reinstateEntitlement(lic: V1License) {
    setActionLoading(lic.entitlement_id);
    try {
      await api.post(`/api/admin/v1/entitlements/${lic.entitlement_id}/reinstate`);
      setLicenses(prev => prev.map(l =>
        l.entitlement_id === lic.entitlement_id ? { ...l, entitlement_status: 'active' } : l
      ));
      toast.success('Entitlement reinstated');
    } catch {
      toast.error('Failed to reinstate');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = licenses.filter(l => {
    const matchType = typeFilter === 'all' || (l.key_type ?? 'production') === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || l.license_key?.toLowerCase().includes(q)
      || l.customer_name?.toLowerCase().includes(q)
      || l.customer_email?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const counts: Record<TypeFilter, number> = {
    all: licenses.length,
    production: licenses.filter(l => !l.key_type || l.key_type === 'production').length,
    manual: licenses.filter(l => l.key_type === 'manual').length,
    demo: licenses.filter(l => l.key_type === 'demo').length,
    internal: licenses.filter(l => l.key_type === 'internal').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-brand-600" />
          Licenses
        </h1>
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search licensesâ€¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1.5 mb-4">
        {(['all', 'production', 'manual', 'demo', 'internal'] as TypeFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t === 'demo'     && <FontAwesomeIcon icon={faFlask}  className="w-3 h-3" />}
            {t === 'manual'   && <FontAwesomeIcon icon={faUser}   className="w-3 h-3" />}
            {t === 'internal' && <FontAwesomeIcon icon={faWrench} className="w-3 h-3" />}
            <span className="capitalize">{t}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${typeFilter === t ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
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
                {['License Key', 'Customer', 'Product / Plan', 'Expires', 'Devices', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(lic => {
                const badge = STATUS_BADGE[lic.entitlement_status] ?? STATUS_BADGE.pending;
                const isLoading = actionLoading === lic.entitlement_id;
                const canSuspend = lic.entitlement_status === 'active';
                const canReinstate = lic.entitlement_status === 'suspended';
                const isLifetime = lic.product === 'ezpos' && lic.key_type !== 'demo' && lic.key_type !== 'internal';

                return (
                  <tr key={lic.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center flex-wrap gap-y-1">
                        <span className="font-mono text-xs text-gray-700">{lic.license_key}</span>
                        <KeyTypePip type={lic.key_type ?? 'production'} />
                        {lic.credential_status !== 'active' && (
                          <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                            {lic.credential_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{lic.customer_name}</div>
                      <div className="text-gray-400 text-xs">{lic.customer_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${lic.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
                        <FontAwesomeIcon icon={lic.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                        {lic.product}
                      </span>
                      <div className="text-gray-500 text-xs mt-0.5">{lic.plan_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-1 text-xs ${!isLifetime && new Date(lic.expires_at) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {isLifetime ? 'Lifetime' : new Date(lic.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FontAwesomeIcon icon={faLaptop} className="w-3 h-3 text-gray-400" />
                        {lic.active_activations} active
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                        <FontAwesomeIcon icon={badge.label === 'Active' ? faCircleCheck : faCircleXmark} className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {canSuspend && (
                          <button
                            onClick={() => suspendEntitlement(lic)}
                            disabled={isLoading}
                            title="Suspend"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40"
                          >
                            <FontAwesomeIcon icon={isLoading ? faSpinner : faPause} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {canReinstate && (
                          <button
                            onClick={() => reinstateEntitlement(lic)}
                            disabled={isLoading}
                            title="Reinstate"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                          >
                            <FontAwesomeIcon icon={isLoading ? faSpinner : faPlay} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <Link
                          href={`/admin/licenses/${encodeURIComponent(lic.license_key)}`}
                          title="View details"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No licenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
