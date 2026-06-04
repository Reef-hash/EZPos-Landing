'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSpinner, faPlus, faDesktop, faMobileScreen,
  faClock, faCircleCheck, faCircleXmark, faFlask, faWrench,
  faUser, faCopy, faCheck, faSearch, faLaptop,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { V1License, KeyType } from '@/types';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  code: string;
  name: string;
  product_id: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  plans: Plan[];
}

const KEY_TYPE_META: Record<Exclude<KeyType, 'production'>, { label: string; cls: string; icon: typeof faFlask; desc: string }> = {
  manual:   { label: 'Manual',   cls: 'bg-blue-100 text-blue-700',   icon: faUser,   desc: 'Issued to a paying customer without going through Stripe checkout' },
  demo:     { label: 'Demo',     cls: 'bg-amber-100 text-amber-700', icon: faFlask,  desc: '30-day trial key for prospects — does not count as a sale' },
  internal: { label: 'Internal', cls: 'bg-purple-100 text-purple-700', icon: faWrench, desc: 'Dev/testing key — invisible to customers, safe to delete' },
};

function KeyTypeBadge({ type }: { type: KeyType }) {
  if (type === 'production') {
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Production</span>;
  }
  const m = KEY_TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${m.cls}`}>
      <FontAwesomeIcon icon={m.icon} className="w-2.5 h-2.5" />
      {m.label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} title="Copy key" className="ml-1.5 text-gray-400 hover:text-brand-600 transition-colors">
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3 h-3" />
    </button>
  );
}

export default function AdminKeysPage() {
  const [keys, setKeys]           = useState<V1License[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Exclude<KeyType, 'production'>>('all');
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [form, setForm] = useState({
    product: 'ezpos' as 'ezpos' | 'crossxpos',
    plan_id: '',
    customer_name: '',
    customer_email: '',
    key_type: 'manual' as Exclude<KeyType, 'production'>,
    note: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/v1/keys'),
      api.get('/api/admin/v1/plans'),
    ])
      .then(([keysRes, plansRes]) => {
        setKeys(keysRes.data);
        setProducts(plansRes.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const plansForProduct = products
    .find(p => p.code === form.product)
    ?.plans ?? [];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.plan_id) { toast.error('Select a plan'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/api/admin/v1/keys/generate', form);
      toast.success(`Key generated: ${res.data.license_key}`);
      // Refresh list
      const updated = await api.get('/api/admin/v1/keys');
      setKeys(updated.data);
      setShowForm(false);
      setForm({ product: 'ezpos', plan_id: '', customer_name: '', customer_email: '', key_type: 'manual', note: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to generate key');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = keys.filter(k => {
    const matchType = typeFilter === 'all' || k.key_type === typeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || k.license_key?.toLowerCase().includes(q)
      || k.customer_name?.toLowerCase().includes(q)
      || k.customer_email?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="w-6 h-6 text-brand-600" />
            Issue Keys
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate manual, demo, or internal license keys</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Generate Key
        </button>
      </div>

      {/* Key type explanation cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(KEY_TYPE_META) as [Exclude<KeyType, 'production'>, typeof KEY_TYPE_META['manual']][]).map(([type, meta]) => (
          <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.cls}`}>
              <FontAwesomeIcon icon={meta.icon} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 text-brand-600" />
            New Key
          </h2>
          <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-4">
            {/* Key type */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Key Type</label>
              <div className="flex gap-2">
                {(Object.keys(KEY_TYPE_META) as Exclude<KeyType, 'production'>[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, key_type: t }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      form.key_type === t
                        ? `${KEY_TYPE_META[t].cls} border-current`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={KEY_TYPE_META[t].icon} className="w-3 h-3" />
                    {KEY_TYPE_META[t].label}
                    {t === 'demo' && <span className="text-[10px] opacity-70 ml-0.5">(30d)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
              <select
                value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value as 'ezpos' | 'crossxpos', plan_id: '' }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ezpos">EZPos Desktop</option>
                <option value="crossxpos">CrossxPos</option>
              </select>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={form.plan_id}
                onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select plan…</option>
                {plansForProduct.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Customer name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                placeholder={form.key_type === 'internal' ? 'Dev Testing' : 'Ahmad bin Ali'}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Customer email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                required
                value={form.customer_email}
                onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                placeholder={form.key_type === 'internal' ? 'dev@ezpos.my' : 'customer@email.com'}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Note */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Note <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Client at Jalan Tuanku Abdul Halim, agreed via WhatsApp"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={submitting ? faSpinner : faKey} className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
                {submitting ? 'Generating…' : 'Generate Key'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex gap-1.5">
          {(['all', 'manual', 'demo', 'internal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'All' : KEY_TYPE_META[t].label}
            </button>
          ))}
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FontAwesomeIcon icon={faKey} className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">No keys found. Generate one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Key', 'Type', 'Customer', 'Product / Plan', 'Expires', 'Devices', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(k => {
                const isLifetime = k.product === 'ezpos' && k.key_type !== 'demo' && k.key_type !== 'internal';
                return (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-mono text-xs text-gray-700">{k.license_key}</span>
                        <CopyButton value={k.license_key} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <KeyTypeBadge type={k.key_type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 text-xs">{k.customer_name ?? '—'}</div>
                      <div className="text-gray-400 text-xs">{k.customer_email ?? '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${k.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
                        <FontAwesomeIcon icon={k.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                        {k.product}
                      </span>
                      <div className="text-gray-400 text-xs mt-0.5">{k.plan_name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-1 text-xs ${!isLifetime && new Date(k.expires_at) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                        {isLifetime ? 'Lifetime' : new Date(k.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FontAwesomeIcon icon={faLaptop} className="w-3 h-3 text-gray-400" />
                        {k.active_activations} active
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        k.entitlement_status === 'active' ? 'bg-green-100 text-green-700' :
                        k.entitlement_status === 'expired' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        <FontAwesomeIcon icon={k.entitlement_status === 'active' ? faCircleCheck : faCircleXmark} className="w-3 h-3" />
                        {k.entitlement_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
