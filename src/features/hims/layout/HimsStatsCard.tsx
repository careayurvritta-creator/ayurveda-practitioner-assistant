import type { LucideIcon } from 'lucide-react';

interface HimsStatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'red';
}

const colorMap = {
  emerald: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  amber: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
};

export function HimsStatsCard({ label, value, icon: Icon, trend, color = 'emerald' }: HimsStatsCardProps) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-surface-900 dark:text-white">{value}</div>
      {trend && (
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{trend}</p>
      )}
    </div>
  );
}
