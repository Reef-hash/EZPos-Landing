'use client';

/**
 * Reusable skeleton loading components.
 * Use these to replace spinners for a more polished loading experience.
 *
 * Usage:
 *   <Skeleton.Card />
 *   <Skeleton.Text lines={3} />
 *   <Skeleton.StatCard />
 *   <Skeleton.Table rows={5} cols={4} />
 */

function Card() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="skeleton w-10 h-10 rounded-xl mb-4" />
      <div className="skeleton h-4 w-3/4 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-5/6" />
    </div>
  );
}

function StatCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="skeleton w-10 h-10 rounded-xl mb-3" />
      <div className="skeleton h-3 w-1/2 mb-2" />
      <div className="skeleton h-6 w-2/3" />
    </div>
  );
}

function Text({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

function PricingCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="skeleton h-4 w-1/3 mb-2" />
      <div className="skeleton h-3 w-2/3 mb-4" />
      <div className="skeleton h-8 w-1/2 mb-6" />
      <div className="space-y-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-full" />
        ))}
      </div>
      <div className="skeleton h-11 w-full rounded-xl" />
    </div>
  );
}

function Table({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton h-4 flex-1" />
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function Chart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="skeleton h-4 w-1/4 mb-6" />
      <div className="flex items-end gap-3 h-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton flex-1 rounded-t-lg"
            style={{ height: `${40 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function DownloadCard() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton w-16 h-16 rounded-2xl" />
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-12 w-48 rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default { Card, StatCard, Text, PricingCard, Table, Chart, DownloadCard };
