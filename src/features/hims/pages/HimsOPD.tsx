import { useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Loader, Calendar, ChevronLeft, ChevronRight, Receipt, Pill, CalendarDays } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { useToast } from '../../../contexts/ToastContext';
import { CreateVisitModal } from '../components/CreateVisitModal';
import { QuickInvoiceModal } from '../components/QuickInvoiceModal';
import { DispenseMedicineModal } from '../components/DispenseMedicineModal';
import { CalendarSyncButton } from '../components/CalendarSyncButton';
import type { OpdVisit } from '../types';

type FilterType = 'all' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';

const STATUS_STYLES: Record<string, string> = {
  'waiting': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'cancelled': 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
};

export default function HimsOPD() {
  const { visits, updateVisitStatus, cancelVisit, getVisitStats } = useOpd();
  const { invoices } = useBilling();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [billingVisit, setBillingVisit] = useState<OpdVisit | null>(null);
  const [dispenseVisit, setDispenseVisit] = useState<OpdVisit | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [cancellingVisit, setCancellingVisit] = useState<OpdVisit | null>(null);
  const [statusChangeVisit, setStatusChangeVisit] = useState<{ visit: OpdVisit; newStatus: OpdVisit['status'] } | null>(null);

  const dateVisits = showAllVisits
    ? visits
    : visits.filter((v) => v.visitDate.startsWith(selectedDate));

  const filteredVisits = filter === 'all' ? dateVisits : dateVisits.filter((v) => v.status === filter);

  const stats = getVisitStats(showAllVisits ? undefined : selectedDate);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDateLong = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'in-progress': return <Loader className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-surface-400" />;
      default: return null;
    }
  };

  const handleStatusChange = (visit: OpdVisit, newStatus: OpdVisit['status']) => {
    setStatusChangeVisit({ visit, newStatus });
  };

  const confirmStatusChange = () => {
    if (!statusChangeVisit) return;
    updateVisitStatus(statusChangeVisit.visit.id, statusChangeVisit.newStatus);
    showToast(`Visit status updated to ${statusChangeVisit.newStatus}`, 'success');
    setStatusChangeVisit(null);
  };

  const handleCancel = () => {
    if (!cancellingVisit) return;
    cancelVisit(cancellingVisit.id);
    showToast('Visit cancelled', 'success');
    setCancellingVisit(null);
  };

  const statusActions = (visit: OpdVisit) => {
    switch (visit.status) {
      case 'waiting':
        return (
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusChange(visit, 'in-progress')}
              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 min-h-[28px]"
            >
              Start
            </button>
            <button
              onClick={() => setCancellingVisit(visit)}
              className="text-xs px-2 py-1 rounded bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 min-h-[28px]"
            >
              Cancel
            </button>
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusChange(visit, 'completed')}
              className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 min-h-[28px]"
            >
              Complete
            </button>
            <button
              onClick={() => setCancellingVisit(visit)}
              className="text-xs px-2 py-1 rounded bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 min-h-[28px]"
            >
              Cancel
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            OPD
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({filteredVisits.length} {showAllVisits ? 'total' : 'today'})
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
          {/* Date Picker */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[40px]"
              />
              <button
                onClick={() => navigateDate(1)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isToday && !showAllVisits && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 text-sm rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium min-h-[40px]"
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAllVisits(!showAllVisits)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                showAllVisits
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              {showAllVisits ? 'All Time' : 'Select Date'}
            </button>
          </div>

          {/* Date Header */}
          {showAllVisits && (
            <div className="text-sm text-surface-500 mb-3">
              {formatDateLong(selectedDate)}
            </div>
          )}

          {/* Status Filters with Counts */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {([
              { key: 'all' as FilterType, label: 'All', count: stats.total },
              { key: 'waiting' as FilterType, label: 'Waiting', count: stats.waiting },
              { key: 'in-progress' as FilterType, label: 'In Progress', count: stats.inProgress },
              { key: 'completed' as FilterType, label: 'Completed', count: stats.completed },
              { key: 'cancelled' as FilterType, label: 'Cancelled', count: stats.cancelled },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[40px] ${
                  filter === f.key
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Visit List */}
          {filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-lg mb-2">
                {dateVisits.length === 0
                  ? showAllVisits
                    ? 'No visits recorded'
                    : `No visits on ${formatDateLong(selectedDate)}`
                  : 'No matching visits'}
              </p>
              <p className="text-sm mb-4">
                {dateVisits.length === 0
                  ? 'Create a new visit to get started'
                  : 'Try a different filter'}
              </p>
              {dateVisits.length === 0 && (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" />
                  Create First Visit
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVisits.map((visit, index) => (
                <div
                  key={visit.id}
                  className={`bg-white dark:bg-surface-800 rounded-lg border p-4 transition-all ${
                    visit.status === 'in-progress'
                      ? 'border-blue-300 dark:border-blue-700 border-l-2 border-l-blue-500'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(visit.status)}
                        <span className="font-medium text-surface-900 dark:text-white">
                          {visit.patientName}
                        </span>
                        <span className="text-xs text-surface-400">
                          #{index + 1}
                        </span>
                        {showAllVisits && (
                          <span className="text-xs text-surface-400">
                            {formatTime(visit.visitDate)}
                          </span>
                        )}
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
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[visit.status] || ''}`}>
                        {visit.status}
                      </span>
                      {statusActions(visit)}
                      {visit.status === 'completed' && !invoices.some((inv) => inv.visitId === visit.id) && (
                        <button
                          onClick={() => setBillingVisit(visit)}
                          className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1 min-h-[28px]"
                        >
                          <Receipt className="w-3 h-3" />
                          Bill
                        </button>
                      )}
                      {invoices.some((inv) => inv.visitId === visit.id) && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Receipt className="w-3 h-3" />
                          Billed
                        </span>
                      )}
                      {visit.status === 'completed' && (
                        <CalendarSyncButton visit={visit} />
                      )}
                      {visit.status === 'completed' && visit.prescription.length > 0 && (
                        <button
                          onClick={() => setDispenseVisit(visit)}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1 min-h-[28px]"
                        >
                          <Pill className="w-3 h-3" />
                          Dispense
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateVisitModal onClose={() => setShowCreate(false)} />}
      {billingVisit && (
        <QuickInvoiceModal visit={billingVisit} onClose={() => setBillingVisit(null)} />
      )}
      {dispenseVisit && (
        <DispenseMedicineModal visit={dispenseVisit} onClose={() => setDispenseVisit(null)} />
      )}

      <ConfirmationDialog
        isOpen={!!cancellingVisit}
        onClose={() => setCancellingVisit(null)}
        onConfirm={handleCancel}
        title="Cancel Visit"
        message={`Are you sure you want to cancel the visit for ${cancellingVisit?.patientName}?`}
        confirmLabel="Cancel Visit"
        destructive
      />

      <ConfirmationDialog
        isOpen={!!statusChangeVisit}
        onClose={() => setStatusChangeVisit(null)}
        onConfirm={confirmStatusChange}
        title="Update Visit Status"
        message={`Change status of ${statusChangeVisit?.visit.patientName} to ${statusChangeVisit?.newStatus}?`}
        confirmLabel="Update"
      />
    </div>
  );
}
