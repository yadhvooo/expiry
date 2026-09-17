import React from 'react';

export default function UrgencyBadge({ status, badge, daysRemaining }) {
  if (status === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        {badge || (daysRemaining === 0 ? 'Ending Today 🔥' : 'Best Before Tomorrow ⚡')}
      </span>
    );
  }

  if (status === 'APPROACHING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {badge || `${daysRemaining} Days Left`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      {badge || `${daysRemaining} Days Left`}
    </span>
  );
}
