'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxesStacked, faSpinner, faPlus, faPencil, faTrash, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { AddonItem } from '@/types';
import toast from 'react-hot-toast';

const emptyAddon: Partial<AddonItem> = {
  product: 'all',
  name: '',
  description: '',
  image_url: '',
  price_myr: 0,
  is_active: true,
  sort_order: 0,
};

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<AddonItem> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/admin/addons')
      .then(r => setAddons(r.data))
      .catch(() => toast.error('Failed to load add-ons'))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setEditing({ ...emptyAddon });
    setIsNew(true);
  }

  function openEdit(addon: AddonItem) {
    setEditing({ ...addon });
    setIsNew(false);
  }

  async function saveAddon(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) {
        const res = await api.post('/api/admin/addons', editing);
        setAddons(prev => [...prev, res.data]);
        toast.success('Add-on created');
      } else {
        const res = await api.put(`/api/admin/addons/${editing.id}`, editing);
        setAddons(prev => prev.map(a => a.id === editing.id ? res.data : a));
        toast.success('Add-on updated');
      }
      setEditing(null);
    } catch {
      toast.error('Failed to save add-on');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddon(id: string) {
    if (!confirm('Delete this add-on?')) return;
    try {
      await api.delete(`/api/admin/addons/${id}`);
      setAddons(prev => prev.filter(a => a.id !== id));
      toast.success('Add-on deleted');
    } catch {
      toast.error('Failed to delete add-on');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faBoxesStacked} className="w-6 h-6 text-brand-600" />
          Add-ons
        </h1>
        <button onClick={openNew} className="btn-primary">
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> New Add-on
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
                {['Image', 'Name', 'Scope', 'Price', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {addons.map(addon => (
                <tr key={addon.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {addon.image_url ? (
                      <img src={addon.image_url} alt={addon.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200" />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{addon.name}</div>
                    <div className="text-gray-500 text-xs">{addon.description}</div>
                  </td>
                  <td className="py-3 px-4 uppercase text-xs text-gray-500">{addon.product}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">RM {addon.price_myr}</td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${addon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {addon.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(addon)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors">
                        <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAddon(addon.id)}
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

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">{isNew ? 'New Add-on' : 'Edit Add-on'}</h2>
            <form onSubmit={saveAddon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select value={editing.product ?? 'all'}
                    onChange={e => setEditing(p => ({ ...p!, product: e.target.value as AddonItem['product'] }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="all">All products</option>
                    <option value="ezpos">EZPos Desktop</option>
                    <option value="crossxpos">CrossxPos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (MYR)</label>
                  <input type="number" required min={1} step={0.01} value={editing.price_myr ?? ''}
                    onChange={e => setEditing(p => ({ ...p!, price_myr: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" value={editing.image_url ?? ''}
                  onChange={e => setEditing(p => ({ ...p!, image_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_active ?? true}
                    onChange={e => setEditing(p => ({ ...p!, is_active: e.target.checked }))}
                    className="rounded" />
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)}
                  className="flex-1 btn-outline border-gray-300 text-gray-600 hover:bg-gray-50 justify-center">
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center">
                  {saving ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" /> : 'Save Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
