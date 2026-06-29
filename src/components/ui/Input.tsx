import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-lg border bg-white text-surface-900 placeholder-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[48px] dark:bg-surface-800 dark:text-white dark:border-surface-600 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-surface-300 dark:border-surface-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="text-sm text-surface-500">{helperText}</p>}
    </div>
  );
}
