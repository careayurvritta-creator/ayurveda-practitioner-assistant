import { useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useOpd } from '../contexts/OpdContext';
import { CreateVisitModal } from '../components/CreateVisitModal';

export default function HimsOPD() {
  const { visits, updateVisitStatus } = useOpd();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in-progress' | 'completed'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.visitDate.startsWith(todayStr));
  const filteredVisits = filter === 'all' ? todayVisits : todayVisits.filter((v) => v.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'in-progress': return <Loader className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-surface-400" />;
      default: return null;
    }
  };

  const statusActions = (visit: typeof todayVisits[0]) => {
    switch (visit.status) {
      case 'waiting':
        return (
          <button
            onClick={() => updateVisitStatus(visit.id, 'in-progress')}
            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Start
          </button>
        );
      case 'in-progress':
        return (
          <button
            onClick={() => updateVisitStatus(visit.id, 'completed')}
            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
          >
            Complete
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
            OPD
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({todayVisits.length} today)
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Visit
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(['all', 'waiting', 'in-progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] ${
                  filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Visit List */}
          {filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <p className="text-lg mb-2">
                {todayVisits.length === 0 ? 'No visits today' : 'No matching visits'}
              </p>
              {todayVisits.length === 0 && (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  Create First Visit
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(visit.status)}
                        <span className="font-medium text-surface-900 dark:text-white">
                          {visit.patientName}
                        </span>
                      </div>
                      <div className="text-sm text-surface-500 dark:text-surface-400 mb-1">
                        {visit.doctorName} · {visit.chiefComplaint}
                      </div>
                      {visit.diagnosis && (
                        <div className="text-sm text-surface-600 dark:text-surface-300">
                          <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                        </div>
                      )}
                      {visit.prescription.length > 0 && (
                        <div className="mt-2 text-xs text-surface-500">
                          {visit.prescription.length} medicine(s) prescribed
                        </div>
                      )}
                      <div className="text-xs text-surface-400 mt-1">
                        Fee: ₹{visit.consultationFee}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          visit.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : visit.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : visit.status === 'waiting'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                        }`}
                      >
                        {visit.status}
                      </span>
                      {statusActions(visit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateVisitModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
