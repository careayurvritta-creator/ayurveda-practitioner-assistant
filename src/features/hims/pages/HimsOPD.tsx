import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Loader, ChevronLeft, ChevronRight, Receipt, Pill, CalendarDays, Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchVisits, updateVisitStatus, deleteVisit } from '../slices/opdSlice';
import { fetchInvoices } from '../slices/billingSlice';
import { useToast } from '../../../contexts/ToastContext';
import { CreateVisitModal } from '../components/CreateVisitModal';
import { EditVisitModal } from '../components/EditVisitModal';
import { QuickInvoiceModal } from '../components/QuickInvoiceModal';
import { DispenseMedicineModal } from '../components/DispenseMedicineModal';
import { ConsultationFormModal } from '../components/ConsultationFormModal';
import { CalendarSyncButton } from '../components/CalendarSyncButton';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { VisitRecord } from '../db/VisitRepository';

type FilterType = 'all' | 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export default function HimsOPD() {
  const dispatch = useAppDispatch();
  const { visits, isLoading } = useAppSelector((state) => state.hims.opd);
  const { invoices } = useAppSelector((state) => state.hims.billing);
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitRecord | null>(null);
  const [billingVisit, setBillingVisit] = useState<VisitRecord | null>(null);
  const [dispenseVisit, setDispenseVisit] = useState<VisitRecord | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllVisits, setShowAllVisits] = useState(false);
  const [cancellingVisit, setCancellingVisit] = useState<VisitRecord | null>(null);
  const [statusChangeVisit, setStatusChangeVisit] = useState<{ visit: VisitRecord; newStatus: VisitRecord['status'] } | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<VisitRecord | null>(null);
  const [consultationVisit, setConsultationVisit] = useState<VisitRecord | null>(null);

  useEffect(() => {
    dispatch(fetchVisits());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const dateVisits = showAllVisits ? visits : visits.filter((v) => v.visitDate.startsWith(selectedDate));
  const filteredVisits = filter === 'all' ? dateVisits : dateVisits.filter((v) => v.status === filter);

  const stats = {
    total: dateVisits.length,
    waiting: dateVisits.filter((v) => v.status === 'waiting').length,
    inProgress: dateVisits.filter((v) => v.status === 'in-progress').length,
    completed: dateVisits.filter((v) => v.status === 'completed').length,
    cancelled: dateVisits.filter((v) => v.status === 'cancelled').length,
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleStatusChange = (visit: VisitRecord, newStatus: VisitRecord['status']) => {
    setStatusChangeVisit({ visit, newStatus });
  };

  const confirmStatusChange = () => {
    if (!statusChangeVisit) return;
    dispatch(updateVisitStatus({ id: statusChangeVisit.visit.id, status: statusChangeVisit.newStatus }));
    showToast(`Visit status updated to ${statusChangeVisit.newStatus}`, 'success');
    setStatusChangeVisit(null);
  };

  const handleCancel = () => {
    if (!cancellingVisit) return;
    dispatch(updateVisitStatus({ id: cancellingVisit.id, status: 'cancelled' }));
    showToast('Visit cancelled', 'success');
    setCancellingVisit(null);
  };

  const handleDeleteVisit = () => {
    if (!deletingVisit) return;
    dispatch(deleteVisit(deletingVisit.id));
    showToast('Visit deleted', 'success');
    setDeletingVisit(null);
  };

  const statusActions = (visit: VisitRecord) => {
    switch (visit.status) {
      case 'waiting':
        return (
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusChange(visit, 'in-progress')}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-medium transition-colors"
            >
              Start
            </button>
            <button
              onClick={() => setCancellingVisit(visit)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium transition-colors"
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
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium transition-colors"
            >
              Complete
            </button>
            <button
              onClick={() => setCancellingVisit(visit)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium transition-colors"
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
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'OPD' }]} />

        <PageHeader
          title="OPD"
          subtitle={`${filteredVisits.length} ${showAllVisits ? 'total' : 'today'}`}
          actions={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Visit
            </Button>
          }
        />

        {/* Date Picker Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[36px] min-h-[36px] flex items-center justify-center border border-surface-200 dark:border-surface-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[40px]"
            />
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[36px] min-h-[36px] flex items-center justify-center border border-surface-200 dark:border-surface-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isToday && !showAllVisits && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium min-h-[40px]"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAllVisits(!showAllVisits)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] border ${
              showAllVisits
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800 hover:bg-surface-50'
            }`}
          >
            {showAllVisits ? 'Showing All Time' : 'All Time'}
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
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
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] border ${
                filter === f.key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-800'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Visit List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-500">Loading visits...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={dateVisits.length === 0
              ? showAllVisits ? 'No visits recorded' : `No visits on ${selectedDate}`
              : 'No matching visits'
            }
            description={dateVisits.length === 0 ? 'Create a new visit to get started' : 'Try a different filter'}
            action={dateVisits.length === 0 ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create First Visit
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filteredVisits.map((visit, index) => (
              <div
                key={visit.id}
                className={`bg-white dark:bg-surface-900 rounded-xl border transition-all hover:shadow-sm ${
                  visit.status === 'in-progress'
                    ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50'
                    : 'border-surface-200/60 dark:border-surface-800'
                }`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-sm text-surface-900 dark:text-white">
                          {visit.patientName}
                        </span>
                        <StatusBadge label={visit.status} variant={getStatusVariant(visit.status)} dot />
                        {showAllVisits && (
                          <span className="text-xs text-surface-400">{formatTime(visit.visitDate)}</span>
                        )}
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {visit.doctorName} &middot; {visit.chiefComplaint}
                      </p>
                      {visit.diagnosis && (
                        <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                          <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          ₹{visit.consultationFee}
                        </span>
                        {visit.prescription.length > 0 && (
                          <span>{visit.prescription.length} medicine(s)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {statusActions(visit)}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setConsultationVisit(visit)}
                          className="text-xs px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 font-medium flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> Consult
                        </button>
                        <button
                          onClick={() => setEditingVisit(visit)}
                          className="text-xs px-2 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingVisit(visit)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Del
                        </button>
                      </div>
                      {visit.status === 'completed' && !invoices.some((inv) => inv.visitId === visit.id) && (
                        <button
                          onClick={() => setBillingVisit(visit)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Receipt className="w-3 h-3" /> Bill
                        </button>
                      )}
                      {invoices.some((inv) => inv.visitId === visit.id) && (
                        <StatusBadge label="Billed" variant="success" icon={Receipt} />
                      )}
                      {visit.status === 'completed' && (
                        <CalendarSyncButton visit={visit as any} />
                      )}
                      {visit.status === 'completed' && visit.prescription.length > 0 && (
                        <button
                          onClick={() => setDispenseVisit(visit)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Pill className="w-3 h-3" /> Dispense
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateVisitModal onClose={() => setShowCreate(false)} />}
      {editingVisit && <EditVisitModal visit={editingVisit} onClose={() => setEditingVisit(null)} />}
      {billingVisit && <QuickInvoiceModal visit={billingVisit as any} onClose={() => setBillingVisit(null)} />}
      {dispenseVisit && <DispenseMedicineModal visit={dispenseVisit as any} onClose={() => setDispenseVisit(null)} />}
      {consultationVisit && <ConsultationFormModal visit={consultationVisit as any} onClose={() => setConsultationVisit(null)} />}

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
      <ConfirmationDialog
        isOpen={!!deletingVisit}
        onClose={() => setDeletingVisit(null)}
        onConfirm={handleDeleteVisit}
        title="Delete Visit"
        message={`Are you sure you want to delete the visit for ${deletingVisit?.patientName}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
