import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope } from 'lucide-react';

const tabs = [
  { path: '/hims/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/hims/patients', label: 'Patients', icon: Users },
  { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
];

export function HimsBottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-t border-surface-200 dark:border-surface-700 md:hidden">
      <div className="flex items-center justify-around h-[64px] pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors min-w-[48px] ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-surface-400 hover:text-surface-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
