'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faSpinner, faDesktop, faMobileScreen, faSearch,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { Sale } from '@/types';
import toast from 'react-hot-toast';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/admin/sales')
      .then(r => setSales(r.data))
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter(s =>
    s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_email.toLowerCase().includes(search.toLowerCase()) ||
    s.plan_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((sum, s) => sum + s.amount_myr, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-brand-600" />
          Sales History
        </h1>
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sales…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs font-medium mb-1">Total Sales</p>
          <p className="text-2xl font-extrabold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs font-medium mb-1">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600">RM {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs font-medium mb-1">Avg. Sale Value</p>
          <p className="text-2xl font-extrabold text-gray-900">
            RM {filtered.length > 0 ? (totalRevenue / filtered.length).toFixed(2) : '0.00'}
          </p>
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
                {['Date', 'Customer', 'Product', 'Plan', 'Amount'].map(h => (
                  <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {new Date(sale.paid_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{sale.customer_name}</div>
                    <div className="text-gray-500 text-xs">{sale.customer_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge text-xs ${sale.product === 'ezpos' ? 'bg-ezpos-light text-ezpos' : 'bg-crossx-light text-crossx'}`}>
                      <FontAwesomeIcon icon={sale.product === 'ezpos' ? faDesktop : faMobileScreen} className="w-3 h-3" />
                      {sale.product === 'ezpos' ? 'EZPos' : 'CrossxPos'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{sale.plan_name}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">RM {sale.amount_myr.toFixed(2)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No sales found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
