'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTags, faSpinner, faPlus, faPencil, faTrash,
  faCheckCircle, faXmark, faStar, faDesktop, faMobileScreen,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { PricingPlan } from '@/types';
import toast from 'react-hot-toast';

const emptyPlan: Partial<PricingPlan> = {
  product: 'ezpos',
  product_label: 'EZPos Desktop',
  name: '',
  description: '',
  price_myr: 0,
  duration_days: 365,
  features: [],
  is_active: true,
  is_popular: false,
  sort_order: 0,
};

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PricingPlan> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    api.get('/api/admin/pricing')
      .then(r => setPlans(r.data))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing({ ...emptyPlan, product: 'ezpos', product_label: 'EZPos Desktop' });
    setFeaturesText('');
    setIsNew(true);
  }

  function openEdit(plan: PricingPlan) {
    setEditing({ ...plan });
    setFeaturesText(plan.features.join('\n'));
    setIsNew(false);
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const productLabel = editing.product === 'crossxpos' ? 'CrossxPos' : 'EZPos Desktop';
    const payload = {
      ...editing,
      product_label: productLabel,
      features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
    };
    try {
      if (isNew) {
        const res = await api.post('/api/admin/pricing', payload);
        setPlans(prev => [...prev, res.data]);
        toast.success('Plan created');
      } else {
        const res = await api.put(`/api/admin/pricing/${editing.id}`, payload);
        setPlans(prev => prev.map(p => p.id === editing.id ? res.data : p));
        toast.success('Plan updated');
      }
      setEditing(null);
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return;
    try {
      await api.delete(`/api/admin/pricing/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faTags} className="w-6 h-6 text-brand-600" />
          Pricing Plans
        </h1>
        <button onClick={openNew} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> New Plan
        </button>
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
                {['Product', 'Plan', 'Price', 'Duration', 'Popular', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map(plan => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${plan.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
                      <FontAwesomeIcon icon={plan.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                      {plan.product_label}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{plan.name}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">RM {plan.price_myr}</td>
                  <td className="py-3 px-4 text-gray-600">{plan.duration_days >= 36000 ? 'Lifetime' : `${plan.duration_days}d`}</td>
                  <td className="py-3 px-4">
                    {plan.is_popular
                      ? <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-yellow-400" />
                      : <FontAwesomeIcon icon={faXmark} className="w-4 h-4 text-gray-300" />}
                  </td>
                  <td className="py-3 px-4">
                    {plan.is_active
                      ? <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-500" />
                      : <FontAwesomeIcon icon={faXmark} className="w-4 h-4 text-red-400" />}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(plan)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors">
                        <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePlan(plan.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {isNew ? 'New Pricing Plan' : 'Edit Plan'}
            </h2>
            <form onSubmit={savePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select value={editing.product} onChange={e => setEditing(p => ({
                    ...p!,
                    product: e.target.value as any,
                    product_label: e.target.value === 'crossxpos' ? 'CrossxPos' : 'EZPos Desktop',
                  }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="ezpos">EZPos Desktop</option>
                    <option value="crossxpos">CrossxPos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Core Product</label>
                  <input type="text" disabled value={editing.product === 'crossxpos' ? 'CrossxPos' : 'EZPos Desktop'}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-100 text-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input type="text" required value={editing.name ?? ''}
                  onChange={e => setEditing(p => ({ ...p!, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={editing.description ?? ''}
                  onChange={e => setEditing(p => ({ ...p!, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (MYR)</label>
                  <input type="number" required min={1} step={0.01} value={editing.price_myr ?? ''}
                    onChange={e => setEditing(p => ({ ...p!, price_myr: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input type="number" required min={1} value={editing.duration_days ?? ''}
                    onChange={e => setEditing(p => ({ ...p!, duration_days: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea rows={5} value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active ?? true}
                    onChange={e => setEditing(p => ({ ...p!, is_active: e.target.checked }))}
                    className="rounded" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_popular ?? false}
                    onChange={e => setEditing(p => ({ ...p!, is_popular: e.target.checked }))}
                    className="rounded" />
                  Mark as Popular
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 btn-outline border-gray-300 text-gray-600 hover:bg-gray-50 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center">
                  {saving ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
