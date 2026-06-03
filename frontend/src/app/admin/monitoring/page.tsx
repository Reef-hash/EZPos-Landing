'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faChartLine, faCircleCheck, faCircleXmark,
  faWifi, faListCheck, faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { V1MonitoringStats } from '@/types';
import toast from 'react-hot-toast';

interface StatCard {
  label: string;
  total: number;
  allow: number;
  deny: number;
  successRate: number;
}

function StatBlock({ label, total, allow, deny, successRate }: StatCard) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-3xl font-extrabold text-gray-900">{successRate}<span className="text-lg text-gray-400">%</span></p>
          <p className="text-xs text-gray-400 mt-0.5">Success rate</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${successRate >= 90 ? 'bg-green-50' : successRate >= 70 ? 'bg-amber-50' : 'bg-red-50'}`}>
          <FontAwesomeIcon icon={faWifi} className={`w-5 h-5 ${successRate >= 90 ? 'text-green-500' : successRate >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
        </div>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-600">
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
          {allow} allow
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <FontAwesomeIcon icon={faCircleXmark} className="w-3 h-3" />
          {deny} deny
        </span>
        <span className="text-gray-400">{total} total</span>
      </div>

      {/* Simple visual bar */}
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${successRate >= 90 ? 'bg-green-400' : successRate >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${successRate}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminMonitoringPage() {
  const [stats, setStats] = useState<V1MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/v1/monitoring/stats')
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load monitoring stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-brand-600" />
          Monitoring
        </h1>
        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Live</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatBlock label="Today" {...(stats?.today ?? { total: 0, allow: 0, deny: 0, successRate: 0 })} />
        <StatBlock label="Last 7 days" {...(stats?.last7days ?? { total: 0, allow: 0, deny: 0, successRate: 0 })} />
        <StatBlock label="Last 30 days" {...(stats?.last30days ?? { total: 0, allow: 0, deny: 0, successRate: 0 })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top Reason Codes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faListCheck} className="w-4 h-4 text-brand-600" />
            Top Reason Codes (30 days)
          </h2>
          {(stats?.topReasonCodes ?? []).length === 0 && (
            <p className="text-sm text-gray-400">No data.</p>
          )}
          <div className="space-y-2">
            {(stats?.topReasonCodes ?? []).map(r => {
              const total30 = stats?.last30days.total ?? 1;
              const pct = total30 > 0 ? Math.round((r.count / total30) * 100) : 0;
              const isAllow = r.code === 'valid';
              return (
                <div key={r.code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-gray-700">{r.code}</span>
                    <span className={`text-xs font-medium ${isAllow ? 'text-green-600' : 'text-red-500'}`}>{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isAllow ? 'bg-green-400' : 'bg-red-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Denials */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowTrendDown} className="w-4 h-4 text-red-500" />
            Recent Denials
          </h2>
          {(stats?.recentDenials ?? []).length === 0 && (
            <p className="text-sm text-gray-400">No recent denials.</p>
          )}
          <div className="space-y-1.5">
            {(stats?.recentDenials ?? []).map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50">
                <span className="font-mono text-xs text-red-700">{d.reason_code}</span>
                <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
