import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Receipt, Pill } from 'lucide-react';

const tabs = [
  { path: '/hims/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/hims/patients', label: 'Patients', icon: Users },
  { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
  { path: '/hims/billing', label: 'Billing', icon: Receipt },
  { path: '/hims/pharmacy', label: 'Pharmacy', icon: Pill },
];

export function HimsBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-t border-surface-200/60 dark:border-surface-800/60 md:hidden">
      <div className="flex items-center justify-around h-[64px] pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all min-w-[48px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
