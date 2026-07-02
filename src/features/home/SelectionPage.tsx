import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { MessageSquareText, Building2 } from 'lucide-react';

export default function SelectionPage() {
  const navigate = useNavigate();
  const { userEmail, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">
            AyurScribe
          </h1>
          <p className="text-surface-500 dark:text-surface-400">
            Clinical Platform for Ayurveda Practitioners
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* AyurGPT Card */}
          <button
            onClick={() => navigate('/ayurgpt/chat')}
            className="group bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700 p-6 text-left hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 min-h-[48px]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <MessageSquareText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              AyurGPT
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              AI-powered clinical chat and personalized treatment protocol generation
            </p>
            <div className="flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium">
              Launch
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* HIMS Card */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700 p-6 text-left opacity-75">
            <div className="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-700 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-surface-500 dark:text-surface-400" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
              HIMS
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Hospital Information Management System for patient records and operations
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
              Coming Soon
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500 dark:text-surface-400 truncate max-w-[200px]">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
