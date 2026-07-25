'use client';

import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner, faBug, faSkullCrossbones, faTriangleExclamation,
  faCircleInfo, faCircleExclamation, faGlobe, faArrowsRotate,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import { SecurityEvent, SecuritySummary, SecuritySeverity } from '@/types';
import toast from 'react-hot-toast';

const SEVERITY_STYLE: Record<SecuritySeverity, { badge: string; dot: string; bar: string }> = {
  high:   { badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    bar: 'bg-red-400' },
  medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-400' },
  low:    { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',  bar: 'bg-blue-400' },
  info:   { badge: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400',  bar: 'bg-gray-300' },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SummaryCard({ label, counts }: { label: string; counts: { total: number; high: number; medium: number; low: number; info: number } }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 mb-3">{counts.total}<span className="text-lg text-gray-400 ml-1">events</span></p>
      <div className="flex gap-3 text-xs flex-wrap">
        <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500" />{counts.high} high</span>
        <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500" />{counts.medium} med</span>
        <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500" />{counts.low} low</span>
        <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400" />{counts.info} info</span>
      </div>
    </div>
  );
}

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SecuritySeverity | 'all'>('all');

  const load = useCallback(async () => {
    try {
      const [eventsRes, summaryRes] = await Promise.all([
        api.get('/api/admin/v1/security/events', { params: { limit: 100 } }),
        api.get('/api/admin/v1/security/summary'),
      ]);
      setEvents(eventsRes.data);
      setSummary(summaryRes.data);
    } catch {
      toast.error('Failed to load security events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = filter === 'all' ? events : events.filter(e => e.severity === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faBug} className="w-6 h-6 text-brand-600" />
            Security Watch
          </h1>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Live — refreshes every 15s</span>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Every blocked probe, failed login, and weird poke against the API lands here — this is what a pentest or a real attacker looks like from the server&apos;s side.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Last 24 hours" counts={summary?.last24h ?? { total: 0, high: 0, medium: 0, low: 0, info: 0 }} />
        <SummaryCard label="Last 7 days" counts={summary?.last7days ?? { total: 0, high: 0, medium: 0, low: 0, info: 0 }} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5" />
            Noisiest IPs (24h)
          </p>
          {(summary?.topIps ?? []).length === 0 && <p className="text-sm text-gray-400">Quiet out there.</p>}
          <div className="space-y-1.5">
            {(summary?.topIps ?? []).map(ip => (
              <div key={ip.ip} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-700">{ip.ip}</span>
                <span className="text-gray-400">{ip.count} events</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-3">
        {(['all', 'high', 'medium', 'low', 'info'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize ${
              filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Event feed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="w-6 h-6 text-gray-300" />
            Nothing to see here. Either nobody&apos;s poking around, or your pentest hasn&apos;t started yet.
          </div>
        )}
        {filtered.map(ev => {
          const style = SEVERITY_STYLE[ev.severity];
          const icon = ev.severity === 'high' ? faSkullCrossbones : ev.severity === 'medium' ? faTriangleExclamation : faCircleExclamation;
          return (
            <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${style.badge}`}>
                    {ev.severity}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400">{ev.event_type}</span>
                  {ev.path && <span className="font-mono text-[11px] text-gray-300 truncate">{ev.method} {ev.path}</span>}
                </div>
                <p className="text-sm text-gray-800 leading-snug">{ev.message}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <FontAwesomeIcon icon={icon} className={`w-3.5 h-3.5 ${ev.severity === 'high' ? 'text-red-400' : ev.severity === 'medium' ? 'text-amber-400' : 'text-gray-300'}`} />
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(ev.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
