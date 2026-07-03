import type { LucideIcon } from 'lucide-react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'blue';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/30',
  danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/30',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/30',
  neutral: 'bg-surface-50 text-surface-600 ring-surface-500/20 dark:bg-surface-500/10 dark:text-surface-400 dark:ring-surface-400/30',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-400/30',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/30',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ label, variant = 'neutral', icon: Icon, dot = false, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ring-1 ring-inset rounded-full ${variantStyles[variant]} ${sizeClasses}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'info' ? 'bg-blue-500' :
          variant === 'purple' ? 'bg-purple-500' :
          'bg-surface-400'
        }`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'active':
    case 'scheduled':
    case 'in-progress':
      return 'success';
    case 'waiting':
    case 'pending':
    case 'planned':
      return 'warning';
    case 'cancelled':
    case 'discharged':
    case 'on-hold':
      return 'neutral';
    case 'critical':
    case 'referred':
      return 'danger';
    default:
      return 'neutral';
  }
}
