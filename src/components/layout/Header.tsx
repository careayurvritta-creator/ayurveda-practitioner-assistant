import { Menu, Plus, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
  onNewChat: () => void;
}

export function Header({ onMenuToggle, onNewChat }: HeaderProps) {
  const { currentUser, userEmail, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-700 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Back to Home"
          >
            <Home className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="font-semibold text-surface-900 dark:text-white hidden sm:block">
              AyurGPT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="New Chat"
          >
            <Plus className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>

          {currentUser && (
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
          )}
        </div>
      </div>
    </header>
  );
}
