import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ label, error, helperText, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
        {label}
      </label>
      <textarea
        className={`w-full px-4 py-3 rounded-lg border bg-white text-surface-900 placeholder-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[80px] resize-y dark:bg-surface-800 dark:text-white dark:border-surface-600 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-surface-300 dark:border-surface-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="text-sm text-surface-500">{helperText}</p>}
    </div>
  );
}
