import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 mb-4">
      <Link
        to="/hims/dashboard"
        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-w-[24px] min-h-[24px] flex items-center justify-center"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-surface-300 dark:text-surface-600" />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-surface-900 dark:text-white font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
