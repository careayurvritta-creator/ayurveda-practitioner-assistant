import type { LucideIcon } from 'lucide-react';

interface HimsStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  trendUp?: boolean;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-200 dark:ring-red-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    icon: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
};

export function HimsStatsCard({ label, value, icon: Icon, trend, color = 'emerald' }: HimsStatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-2">
            {label}
          </p>
          <p className={`text-2xl font-bold tracking-tight ${c.value}`}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 truncate">{trend}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}
