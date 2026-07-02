import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Receipt,
  Pill,
  ArrowLeft,
  X,
} from 'lucide-react';

interface HimsSidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/hims/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/hims/patients', label: 'Patients', icon: Users },
  { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
  { path: '/hims/billing', label: 'Billing', icon: Receipt },
  { path: '/hims/pharmacy', label: 'Pharmacy', icon: Pill },
];

export function HimsSidebar({ isOpen, collapsed, onClose, onNavigate }: HimsSidebarProps) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[56px] left-0 bottom-0 z-40 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col transition-all duration-200 ease-out ${
          collapsed ? 'w-[64px]' : 'w-[240px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-3 md:hidden border-b border-surface-100 dark:border-surface-800">
          {!collapsed && (
            <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
              Navigation
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Back to AyurGPT */}
        <div className="p-2 border-t border-surface-100 dark:border-surface-800">
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors min-h-[44px] ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Back to Home' : undefined}
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Back to Home</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
