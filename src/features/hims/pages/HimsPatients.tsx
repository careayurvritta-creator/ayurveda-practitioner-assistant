import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { RegisterPatientModal } from '../components/RegisterPatientModal';
import { EditPatientModal } from '../components/EditPatientModal';
import type { HimsPatient } from '../types';

export default function HimsPatients() {
  const navigate = useNavigate();
  const { patients, deletePatient } = useHimsPatients();
  const [search, setSearch] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [editingPatient, setEditingPatient] = useState<HimsPatient | null>(null);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
            Patients
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({patients.length})
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowRegister(true)}>
            <UserPlus className="w-4 h-4" />
            Register
          </Button>
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
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <p className="text-lg mb-2">
                {patients.length === 0 ? 'No patients registered yet' : 'No matching patients'}
              </p>
              {patients.length === 0 && (
                <Button size="sm" onClick={() => setShowRegister(true)}>
                  Register First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 hover:shadow-sm transition-shadow"
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
                        onClick={() => {
                          if (confirm(`Delete ${patient.name}?`)) deletePatient(patient.id);
                        }}
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

      {showRegister && <RegisterPatientModal onClose={() => setShowRegister(false)} />}
      {editingPatient && (
        <EditPatientModal patient={editingPatient} onClose={() => setEditingPatient(null)} />
      )}
    </div>
  );
}
