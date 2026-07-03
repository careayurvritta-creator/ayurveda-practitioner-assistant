import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Trash2, Eye, Pencil, X, Users, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients, searchPatients, deletePatient } from '../slices/himsPatientSlice';
import { fetchVisits } from '../slices/opdSlice';
import { fetchInvoices } from '../slices/billingSlice';
import { useToast } from '../../../contexts/ToastContext';
import { PatientFormModal } from '../components/PatientFormModal';
import { exportPatients } from '../utils/export';
import type { PatientRecord } from '../db/PatientRepository';

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    dispatch(fetchPatients());
    dispatch(fetchVisits());
    dispatch(fetchInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
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
    return (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  const hasRelatedRecords = (patientId: string): boolean => {
    const hasVisits = visits.some((v) => v.patientId === patientId);
    const hasInvoices = invoices.some((inv) => inv.patientId === patientId);
    return hasVisits || hasInvoices;
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
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Patients
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({patients.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => exportPatients(patients)}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowRegister(true)}>
              <UserPlus className="w-4 h-4" />
              Register
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by name, MRN, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700"
              >
                <X className="w-4 h-4 text-surface-400" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-surface-500">
              <p>Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-surface-300" />
              <p className="text-lg mb-2">
                {patients.length === 0 ? 'No patients registered yet' : 'No matching patients'}
              </p>
              <p className="text-sm mb-4">
                {patients.length === 0
                  ? 'Register your first patient to get started'
                  : 'Try a different search term'}
              </p>
              {patients.length === 0 && (
                <Button size="sm" onClick={() => setShowRegister(true)}>
                  <UserPlus className="w-4 h-4" />
                  Register First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 hover:shadow-sm transition-all hover:border-l-2 hover:border-l-emerald-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-surface-900 dark:text-white">
                          {patient.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                          {patient.mrn}
                        </span>
                      </div>
                      <div className="text-sm text-surface-500 dark:text-surface-400">
                        {patient.age}y · {patient.gender} · {patient.phone}
                        {patient.prakriti && ` · ${patient.prakriti}`}
                      </div>
                      {patient.lastVisit && (
                        <div className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                          Last visit: {formatDate(patient.lastVisit)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingPatient(patient)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Edit patient"
                      >
                        <Pencil className="w-4 h-4 text-surface-500" />
                      </button>
                      <button
                        onClick={() => navigate(`/hims/patients/${patient.id}`)}
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-surface-500" />
                      </button>
                      <button
                        onClick={() => setDeletingPatient(patient)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Delete patient"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
