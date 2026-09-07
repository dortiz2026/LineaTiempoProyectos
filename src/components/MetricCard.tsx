import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-100',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
}: MetricCardProps) {
  const styles = colorMap[color];

  return (
    <div
      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border ${styles.border} shadow-xs flex items-center justify-between gap-2.5 transition-all hover:shadow-sm`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate mb-0.5">
          {title}
        </p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div
        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.bg} ${styles.text}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
    </div>
  );
}
