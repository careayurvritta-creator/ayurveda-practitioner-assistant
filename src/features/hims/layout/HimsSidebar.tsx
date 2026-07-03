import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Bed,
  Calendar,
  ClipboardList,
  Receipt,
  Pill,
  ArrowLeft,
  X,
  Heart,
  Activity,
} from 'lucide-react';

interface HimsSidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { path: '/hims/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Clinical',
    items: [
      { path: '/hims/patients', label: 'Patients', icon: Users },
      { path: '/hims/appointments', label: 'Appointments', icon: Calendar },
      { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
      { path: '/hims/ipd', label: 'IPD', icon: Bed },
    ],
  },
  {
    title: 'Therapy',
    items: [
      { path: '/hims/therapy', label: 'Therapy Register', icon: Calendar },
      { path: '/hims/treatment', label: 'Treatment Plans', icon: ClipboardList },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/hims/billing', label: 'Billing', icon: Receipt },
      { path: '/hims/pharmacy', label: 'Pharmacy', icon: Pill },
    ],
  },
];

export function HimsSidebar({ isOpen, collapsed, onClose, onNavigate }: HimsSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[60px] left-0 bottom-0 z-40 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Mobile close */}
        <div className="flex items-center justify-between p-3 md:hidden border-b border-surface-100 dark:border-surface-800">
          {!collapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Navigation
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? 'mt-4' : ''}>
              {!collapsed && (
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    {group.title}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 min-h-[40px] ${
                        collapsed ? 'justify-center px-2' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-white'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                      {!collapsed && (
                        <span className="text-sm truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Health indicator */}
        <div className={`p-2 border-t border-surface-100 dark:border-surface-800 ${collapsed ? 'px-2' : 'px-3'}`}>
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {!collapsed && (
              <span className="text-[11px] text-surface-400 dark:text-surface-500">System Online</span>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className={`p-2 border-t border-surface-100 dark:border-surface-800`}>
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center gap-3 rounded-lg text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800/50 hover:text-surface-700 dark:hover:text-surface-300 transition-colors min-h-[40px] ${
              collapsed ? 'justify-center px-2' : 'px-3'
            }`}
            title={collapsed ? 'Back to Home' : undefined}
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-sm">Back to Home</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
