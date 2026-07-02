import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Select({ label, error, helperText, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
        {label}
      </label>
      <div className="relative">
        <select
          className={`w-full px-4 py-3 rounded-lg border bg-white text-surface-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[44px] appearance-none pr-10 dark:bg-surface-800 dark:text-white dark:border-surface-600 ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-surface-300 dark:border-surface-600'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="text-sm text-surface-500">{helperText}</p>}
    </div>
  );
}
