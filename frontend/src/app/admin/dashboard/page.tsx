'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faCheckCircle, faMoneyBill, faChartLine,
  faDesktop, faMobileScreen, faTags, faSpinner,
  faArrowTrendUp,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/sales'),
    ]).then(([statsRes, salesRes]) => {
      setStats(statsRes.data);
      setSales(salesRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // Build monthly chart data from sales
  const monthlyData = (() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      const month = new Date(s.paid_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      map[month] = (map[month] ?? 0) + s.amount_myr;
    });
    return Object.entries(map).map(([month, revenue]) => ({ month, revenue })).slice(-6);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { icon: faKey, label: 'Total Licenses', value: stats?.totalLicenses ?? 0, color: 'text-brand-600', bg: 'bg-brand-50' },
    { icon: faCheckCircle, label: 'Active Licenses', value: stats?.activeLicenses ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: faMoneyBill, label: 'Total Revenue', value: `RM ${(stats?.totalRevenue ?? 0).toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: faArrowTrendUp, label: 'This Month', value: `RM ${(stats?.monthlyRevenue ?? 0).toFixed(2)}`, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: faChartLine, label: 'Total Sales', value: stats?.totalSales ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: faDesktop, label: 'EZPos Licenses', value: stats?.ezposLicenses ?? 0, color: 'text-ezpos', bg: 'bg-ezpos-light' },
    { icon: faMobileScreen, label: 'CrossxPos Licenses', value: stats?.crossxposLicenses ?? 0, color: 'text-crossx', bg: 'bg-crossx-light' },
    { icon: faTags, label: 'Active Plans', value: stats?.activePricingPlans ?? 0, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <FontAwesomeIcon icon={card.icon} className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-gray-500 text-xs font-medium mb-1">{card.label}</p>
            <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-brand-600" />
          Monthly Revenue (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `RM${v}`} />
            <Tooltip formatter={(v: number) => [`RM ${v.toFixed(2)}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
