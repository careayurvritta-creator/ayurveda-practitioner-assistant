import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Building2, ArrowLeft } from 'lucide-react';

export default function HimsPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-200 dark:bg-surface-700 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-surface-500 dark:text-surface-400" />
        </div>

        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
          Hospital Information Management System
        </h1>

        <p className="text-surface-500 dark:text-surface-400 mb-8">
          Comprehensive patient records, appointment scheduling, billing, and hospital operations — coming soon.
        </p>

        <Button
          variant="secondary"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
