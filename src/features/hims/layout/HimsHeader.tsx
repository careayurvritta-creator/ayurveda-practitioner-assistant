import { Menu, PanelLeftClose, PanelLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface HimsHeaderProps {
  onMenuToggle: () => void;
  onCollapseToggle: () => void;
  collapsed: boolean;
}

export function HimsHeader({ onMenuToggle, onCollapseToggle, collapsed }: HimsHeaderProps) {
  const { userEmail, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-700 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-[56px] px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>

          <button
            onClick={onCollapseToggle}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            )}
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 min-w-[44px] min-h-[44px] justify-center"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
            </div>
            <span className="font-semibold text-surface-900 dark:text-white hidden sm:block">
              HIMS
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-600 dark:text-surface-400 hidden sm:block truncate max-w-[120px]">
            {userEmail}
          </span>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-surface-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
