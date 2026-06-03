'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faSpinner, faDesktop, faMobileScreen, faUser,
  faKey, faBan, faCircleCheck, faCircleXmark, faClock, faLaptop,
  faPause, faPlay, faShieldHalved, faListCheck, faWifi, faHistory,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { V1LicenseDetail, V1Activation, EntitlementStatus } from '@/types';
import toast from 'react-hot-toast';

const ENT_BADGE: Record<EntitlementStatus, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700' },
  expired:   { label: 'Expired',   cls: 'bg-red-100 text-red-600' },
  revoked:   { label: 'Revoked',   cls: 'bg-red-100 text-red-700' },
  pending:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-500' },
};

const DECISION_BADGE: Record<string, string> = {
  allow:             'bg-green-100 text-green-700',
  allow_temporarily: 'bg-amber-100 text-amber-700',
  deny:              'bg-red-100 text-red-600',
};

type Tab = 'activations' | 'validation' | 'audit';

export default function LicenseDetailPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<V1LicenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('activations');
  const [revoking, setRevoking] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);

  const licenseKey = decodeURIComponent(key);

  useEffect(() => {
    api.get(`/api/admin/v1/licenses/${encodeURIComponent(licenseKey)}`)
      .then(r => setDetail(r.data))
      .catch(() => { toast.error('License not found'); router.push('/admin/licenses'); })
      .finally(() => setLoading(false));
  }, [licenseKey, router]);

  async function revokeActivation(act: V1Activation) {
    if (!confirm(`Revoke device ${act.device_id}?`)) return;
    setRevoking(act.id);
    try {
      await api.post(`/api/admin/v1/activations/${act.id}/revoke`);
      setDetail(prev => prev ? {
        ...prev,
        activations: prev.activations.map(a => a.id === act.id ? { ...a, status: 'released' } : a),
      } : prev);
      toast.success('Activation revoked');
    } catch {
      toast.error('Failed to revoke');
    } finally {
      setRevoking(null);
    }
  }

  async function toggleEntitlement() {
    if (!detail) return;
    const isSuspended = detail.entitlement.status === 'suspended';
    const action = isSuspended ? 'reinstate' : 'suspend';
    if (!isSuspended && !confirm(`Suspend entitlement for ${licenseKey}?`)) return;

    setSuspending(true);
    try {
      await api.post(`/api/admin/v1/entitlements/${detail.entitlement.id}/${action}`);
      setDetail(prev => prev ? {
        ...prev,
        entitlement: { ...prev.entitlement, status: isSuspended ? 'active' : 'suspended' },
      } : prev);
      toast.success(isSuspended ? 'Entitlement reinstated' : 'Entitlement suspended');
    } catch {
      toast.error('Action failed');
    } finally {
      setSuspending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!detail) return null;

  const { entitlement } = detail;
  const entBadge = ENT_BADGE[entitlement.status] ?? ENT_BADGE.pending;
  const isSuspended = entitlement.status === 'suspended';
  const canToggle = entitlement.status === 'active' || isSuspended;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/licenses" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
          Licenses
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-sm text-gray-700">{licenseKey}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* License credential */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-700">License Key</span>
          </div>
          <p className="font-mono text-xs text-gray-600 break-all mb-2">{detail.license_key}</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${detail.credential_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              Credential: {detail.credential_status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Issued {new Date(detail.issued_at).toLocaleDateString()}</p>
        </div>

        {/* Entitlement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-700">Entitlement</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${entBadge.cls}`}>
              <FontAwesomeIcon icon={isSuspended ? faCircleXmark : faCircleCheck} className="w-3 h-3" />
              {entBadge.label}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${entitlement.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
              <FontAwesomeIcon icon={entitlement.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
              {entitlement.product}
            </span>
          </div>
          <p className="text-xs text-gray-600 font-medium">{entitlement.plan_name}</p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${new Date(entitlement.expires_at) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            Expires {new Date(entitlement.expires_at).toLocaleDateString()}
          </div>
          {canToggle && (
            <button
              onClick={toggleEntitlement}
              disabled={suspending}
              className={`mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${isSuspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              <FontAwesomeIcon icon={suspending ? faSpinner : isSuspended ? faPlay : faPause} className={`w-3 h-3 ${suspending ? 'animate-spin' : ''}`} />
              {isSuspended ? 'Reinstate' : 'Suspend'}
            </button>
          )}
        </div>

        {/* Customer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-700">Customer</span>
          </div>
          <p className="font-medium text-gray-900 text-sm">{entitlement.customer.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{entitlement.customer.email}</p>
          {entitlement.customer.phone && (
            <p className="text-xs text-gray-400 mt-0.5">{entitlement.customer.phone}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { id: 'activations', label: 'Activations', icon: faLaptop, count: detail.activations.length },
            { id: 'validation',  label: 'Validation Events', icon: faWifi, count: detail.validation_events.length },
            { id: 'audit',       label: 'Audit Trail', icon: faHistory, count: detail.audit_events.length },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <FontAwesomeIcon icon={t.icon} className="w-3.5 h-3.5" />
              {t.label}
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4">

          {/* Activations tab */}
          {tab === 'activations' && (
            <div className="space-y-2">
              {detail.activations.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No activations recorded.</p>
              )}
              {detail.activations.map(act => (
                <div key={act.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faLaptop} className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-mono text-xs text-gray-700">{act.device_id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        First: {act.first_activated_at ? new Date(act.first_activated_at).toLocaleString() : '—'}
                        {act.last_validated_at && (
                          <> · Last seen: {new Date(act.last_validated_at).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${act.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {act.status}
                    </span>
                    {act.status === 'active' && (
                      <button
                        onClick={() => revokeActivation(act)}
                        disabled={revoking === act.id}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors disabled:opacity-40"
                      >
                        <FontAwesomeIcon icon={revoking === act.id ? faSpinner : faBan} className={`w-3 h-3 ${revoking === act.id ? 'animate-spin' : ''}`} />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Validation Events tab */}
          {tab === 'validation' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Decision', 'Status', 'Reason Code', 'IP', 'Time'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.validation_events.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No events recorded.</td></tr>
                  )}
                  {detail.validation_events.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${DECISION_BADGE[ev.decision] ?? 'bg-gray-100 text-gray-500'}`}>
                          {ev.decision}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{ev.status}</td>
                      <td className="py-2 px-3 font-mono text-gray-600">{ev.reason_code}</td>
                      <td className="py-2 px-3 text-gray-400">{ev.request_ip ?? '—'}</td>
                      <td className="py-2 px-3 text-gray-400">{new Date(ev.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Trail tab */}
          {tab === 'audit' && (
            <div className="space-y-2">
              {detail.audit_events.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No audit events recorded.</p>
              )}
              {detail.audit_events.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100">
                  <FontAwesomeIcon icon={faListCheck} className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-gray-700">{ev.action}</span>
                      <span className="text-xs text-gray-400">by {ev.actor_type}:{ev.actor_id}</span>
                    </div>
                    {Object.keys(ev.payload_json).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                        {JSON.stringify(ev.payload_json)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(ev.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
