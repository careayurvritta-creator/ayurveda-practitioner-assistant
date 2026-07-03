import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Trash2, Eye, Pencil, X, Users, Download, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, searchPatients, deletePatient } from '../slices/himsPatientSlice';
import { fetchVisits } from '../slices/opdSlice';
import { fetchInvoices } from '../slices/billingSlice';
import { useToast } from '../../../contexts/ToastContext';
import { PatientFormModal } from '../components/PatientFormModal';
import { exportPatients } from '../utils/export';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { PatientRecord } from '../db/PatientRepository';

const PAGE_SIZE = 20;

export default function HimsPatients() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { patients, isLoading } = useAppSelector((state) => state.hims.patients);
  const { visits } = useAppSelector((state) => state.hims.opd);
  const { invoices } = useAppSelector((state) => state.hims.billing);
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientRecord | null>(null);
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    dispatch(fetchPatients());
    dispatch(fetchVisits());
    dispatch(fetchInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      dispatch(searchPatients(debouncedSearch));
    } else if (debouncedSearch.length === 0) {
      dispatch(fetchPatients());
    }
  }, [debouncedSearch, dispatch]);

  const filteredPatients = patients.filter((p) => {
    if (debouncedSearch.length < 2) return true;
    const q = debouncedSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q) || p.phone.includes(q);
  });

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE);
  const paginatedPatients = filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasRelatedRecords = (patientId: string): boolean => {
    return visits.some((v) => v.patientId === patientId) || invoices.some((inv) => inv.patientId === patientId);
  };

  const handleDelete = () => {
    if (!deletingPatient) return;
    if (hasRelatedRecords(deletingPatient.id)) {
      showToast('Cannot delete patient with visit or billing history', 'error');
      setDeletingPatient(null);
      return;
    }
    dispatch(deletePatient(deletingPatient.id));
    showToast('Patient deleted successfully', 'success');
    setDeletingPatient(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Patients' }]} />

        <PageHeader
          title="Patients"
          subtitle={`${patients.length} registered patients`}
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => exportPatients(patients)}>
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button size="sm" onClick={() => setShowRegister(true)}>
                <UserPlus className="w-4 h-4" />
                Register Patient
              </Button>
            </>
          }
        />

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <X className="w-4 h-4 text-surface-400" />
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-surface-500">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={patients.length === 0 ? 'No patients registered yet' : 'No matching patients'}
            description={patients.length === 0 ? 'Register your first patient to get started' : 'Try a different search term'}
            action={patients.length === 0 ? (
              <Button size="sm" onClick={() => setShowRegister(true)}>
                <UserPlus className="w-4 h-4" /> Register First Patient
              </Button>
            ) : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Patient
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      MRN
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 hidden lg:table-cell">
                      Contact
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 hidden lg:table-cell">
                      Prakriti
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 hidden xl:table-cell">
                      Last Visit
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {paginatedPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/hims/patients/${patient.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{patient.name}</p>
                            <p className="text-xs text-surface-500">{patient.age}y &middot; {patient.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          {patient.mrn}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-surface-600 dark:text-surface-400">{patient.phone}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {patient.prakriti ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium">
                            {patient.prakriti}
                          </span>
                        ) : (
                          <span className="text-xs text-surface-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-surface-500">{formatDate(patient.lastVisit)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingPatient(patient)}
                            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Edit patient"
                          >
                            <Pencil className="w-4 h-4 text-surface-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/hims/patients/${patient.id}`)}
                            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-surface-500" />
                          </button>
                          <button
                            onClick={() => setDeletingPatient(patient)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete patient"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {paginatedPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-surface-900 dark:text-white truncate">
                            {patient.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            {patient.mrn}
                          </span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {patient.age}y &middot; {patient.gender} &middot; {patient.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingPatient(patient)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4 text-surface-500" />
                      </button>
                      <button
                        onClick={() => navigate(`/hims/patients/${patient.id}`)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 text-surface-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-surface-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredPatients.length)} of {filteredPatients.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-surface-500 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showRegister && <PatientFormModal onClose={() => setShowRegister(false)} />}
      {editingPatient && (
        <PatientFormModal patient={editingPatient as any} onClose={() => setEditingPatient(null)} />
      )}
      <ConfirmationDialog
        isOpen={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={handleDelete}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deletingPatient?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
