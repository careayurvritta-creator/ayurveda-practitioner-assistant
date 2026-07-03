import { Menu, PanelLeftClose, PanelLeft, LogOut, Calendar, CalendarCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useGoogleCalendar } from '../../../contexts/GoogleCalendarContext';

interface HimsHeaderProps {
  onMenuToggle: () => void;
  onCollapseToggle: () => void;
  collapsed: boolean;
}

export function HimsHeader({ onMenuToggle, onCollapseToggle, collapsed }: HimsHeaderProps) {
  const { userEmail, signOut } = useAuth();
  const navigate = useNavigate();
  const { isConnected, connect, disconnect } = useGoogleCalendar();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200/60 dark:border-surface-800/60 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-[60px] px-4">
        {/* Left section */}
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
              <PanelLeft className="w-5 h-5 text-surface-500" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-surface-500" />
            )}
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 min-w-[44px] min-h-[44px] justify-center"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-bold text-surface-900 dark:text-white leading-tight">
                AyurScribe
              </span>
              <span className="text-[10px] text-surface-400 dark:text-surface-500 leading-tight">
                HIMS
              </span>
            </div>
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={isConnected ? disconnect : connect}
            className={`p-2 rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800'
                : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400'
            }`}
            title={isConnected ? 'Google Calendar connected' : 'Connect Google Calendar'}
          >
            {isConnected ? <CalendarCheck className="w-[18px] h-[18px]" /> : <Calendar className="w-[18px] h-[18px]" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-surface-200 dark:border-surface-700">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
              {userEmail?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-surface-600 dark:text-surface-400 max-w-[100px] truncate">
              {userEmail}
            </span>
          </div>

          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Sign out"
          >
            <LogOut className="w-[18px] h-[18px] text-surface-400 hover:text-surface-600 dark:hover:text-surface-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
