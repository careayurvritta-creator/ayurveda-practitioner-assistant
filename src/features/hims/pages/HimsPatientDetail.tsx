import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Droplets, AlertTriangle, Pencil, Receipt, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { PatientFormModal } from '../components/PatientFormModal';

const STATUS_STYLES: Record<string, string> = {
  'waiting': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'cancelled': 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
};

export default function HimsPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPatient } = useHimsPatients();
  const { getVisitsByPatient } = useOpd();
  const { getInvoicesByPatient } = useBilling();
  const [showEdit, setShowEdit] = useState(false);

  const patient = getPatient(id || '');
  const visits = id ? getVisitsByPatient(id) : [];
  const invoices = id ? getInvoicesByPatient(id) : [];

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-surface-300" />
          <p className="text-lg text-surface-500 mb-4">Patient not found</p>
          <Button variant="secondary" onClick={() => navigate('/hims/patients')}>
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/hims/patients')}
            className="flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Patients</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Patient Header */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                {patient.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                {patient.mrn}
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-surface-500 uppercase tracking-wide">Age / Gender</span>
              <p className="font-medium text-surface-900 dark:text-white">
                {patient.age} years · {patient.gender}
              </p>
            </div>
            {patient.bloodGroup && (
              <div className="flex items-start gap-1">
                <Droplets className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Blood Group</span>
                  <p className="font-medium text-surface-900 dark:text-white">{patient.bloodGroup}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-1">
              <Phone className="w-4 h-4 text-surface-400 mt-0.5" />
              <div>
                <span className="text-xs text-surface-500 uppercase tracking-wide">Phone</span>
                <p className="font-medium text-surface-900 dark:text-white">{patient.phone}</p>
              </div>
            </div>
            {patient.email && (
              <div className="flex items-start gap-1">
                <Mail className="w-4 h-4 text-surface-400 mt-0.5" />
                <div>
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Email</span>
                  <p className="font-medium text-surface-900 dark:text-white">{patient.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ayurvedic Info */}
          {(patient.prakriti || patient.vikriti) && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {patient.prakriti && (
                <div>
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Prakriti</span>
                  <p className="font-medium text-surface-900 dark:text-white">{patient.prakriti}</p>
                </div>
              )}
              {patient.vikriti && (
                <div>
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Vikriti</span>
                  <p className="font-medium text-surface-900 dark:text-white">{patient.vikriti}</p>
                </div>
              )}
            </div>
          )}

          {/* Allergies */}
          {patient.allergies && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <span className="text-xs text-surface-500 uppercase tracking-wide">Allergies</span>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    {patient.allergies}
                  </p>
                </div>
              </div>
            </div>
          )}

          {patient.address && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 text-sm">
              <span className="text-xs text-surface-500 uppercase tracking-wide">Address</span>
              <p className="text-surface-900 dark:text-white">{patient.address}</p>
            </div>
          )}

          {patient.emergencyContact && (
            <div className="mt-3 text-sm">
              <span className="text-xs text-surface-500 uppercase tracking-wide">Emergency Contact</span>
              <p className="text-surface-900 dark:text-white">{patient.emergencyContact}</p>
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-sm font-medium text-surface-900 dark:text-white">
              Visit History ({visits.length})
            </h2>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {visits.length === 0 ? (
              <div className="px-4 py-8 text-center text-surface-500 text-sm">
                No visits recorded
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                      {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {invoices.some((inv) => inv.visitId === visit.id) && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Receipt className="w-3 h-3" />
                          Billed
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[visit.status] || STATUS_STYLES['waiting']}`}
                      >
                        {visit.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-surface-500">
                    {visit.doctorName} · {visit.chiefComplaint}
                  </div>
                  {visit.diagnosis && (
                    <div className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                      Diagnosis: {visit.diagnosis}
                    </div>
                  )}
                  {visit.prescription.length > 0 && (
                    <div className="mt-2 text-xs text-surface-500">
                      Rx: {visit.prescription.map((p) => p.medicine).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {showEdit && <PatientFormModal patient={patient} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
