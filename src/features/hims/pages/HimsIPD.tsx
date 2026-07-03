import { useState, useEffect } from 'react';
import { Plus, Search, Bed, User, Stethoscope } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Modal } from '../../../components/ui/Modal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients } from '../slices/himsPatientSlice';
import { useToast } from '../../../contexts/ToastContext';
import { DOCTORS, IPD_STATUS } from '../types';
import type { IpdCasePaper } from '../types';

export default function HimsIPD() {
  const dispatch = useAppDispatch();
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { showToast } = useToast();
  const [cases, setCases] = useState<IpdCasePaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<IpdCasePaper | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [pastHistory, setPastHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [vitals, setVitals] = useState({ bp: '', pulse: '', temperature: '', weight: '', height: '', respRate: '', spo2: '' });

  useEffect(() => { dispatch(fetchPatients()); }, [dispatch]);

  const filteredCases = cases.filter((c) => {
    const matchesSearch = !searchQuery || c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || c.ipdNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setPatientId(''); setDoctorName(DOCTORS[0]); setChiefComplaint('');
    setDiagnosis(''); setPastHistory(''); setAllergies('');
    setTreatmentPlan(''); setVitals({ bp: '', pulse: '', temperature: '', weight: '', height: '', respRate: '', spo2: '' });
    setEditingCase(null);
  };

  const openForm = (casePaper?: IpdCasePaper) => {
    if (casePaper) {
      setEditingCase(casePaper);
      setPatientId(casePaper.patientId);
      setDoctorName(casePaper.doctorName);
      setChiefComplaint(casePaper.chiefComplaint);
      setDiagnosis(casePaper.diagnosis);
      setPastHistory(casePaper.pastHistory);
      setAllergies(casePaper.allergies);
      setTreatmentPlan(casePaper.treatmentPlan);
      setVitals(casePaper.vitals);
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !chiefComplaint.trim()) { showToast('Please fill required fields', 'error'); return; }

    if (editingCase) {
      setCases((prev) => prev.map((c) => c.id === editingCase.id ? {
        ...c, doctorName, chiefComplaint, diagnosis, pastHistory, allergies, treatmentPlan, vitals,
      } : c));
      showToast('Case paper updated', 'success');
    } else {
      const newCase: IpdCasePaper = {
        id: `ipd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        patientId, patientName: patient.name, uhid: patient.mrn,
        ipdNumber: `IPD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(cases.length + 1).padStart(3, '0')}`,
        doctorName, admissionDate: new Date().toISOString(), chiefComplaint, diagnosis,
        pastHistory, allergies, vitals, treatmentPlan, status: 'active', createdAt: new Date().toISOString(),
      };
      setCases((prev) => [newCase, ...prev]);
      showToast('Patient admitted successfully', 'success');
    }
    setShowForm(false); resetForm();
  };

  const updateStatus = (id: string, status: IpdCasePaper['status']) => {
    setCases((prev) => prev.map((c) => c.id === id ? { ...c, status, dischargeDate: status === 'discharged' ? new Date().toISOString() : c.dischargeDate } : c));
    showToast(`Case ${status}`, 'success');
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">IPD Case Papers</h1>
          <p className="text-sm text-surface-500">{cases.length} admissions</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2"><Plus className="w-4 h-4" /> New Admission</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search by name or IPD number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]" />
        </div>
        <div className="flex gap-1">
          {['all', ...IPD_STATUS].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize min-h-[40px] ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <Bed className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-500">No IPD cases found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => (
            <div key={c.id} className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-surface-900 dark:text-white">{c.patientName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{c.ipdNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      c.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                      c.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      c.status === 'discharged' ? 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400' :
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-sm text-surface-500 mt-1">
                    <Stethoscope className="w-3 h-3 inline mr-1" />{c.doctorName} · UHID: {c.uhid}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" onClick={() => openForm(c)} className="text-xs px-2 py-1">Edit</Button>
                  {c.status === 'active' && (
                    <>
                      <button onClick={() => updateStatus(c.id, 'critical')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Critical</button>
                      <button onClick={() => updateStatus(c.id, 'discharged')} className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Discharge</button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300"><strong>Chief Complaint:</strong> {c.chiefComplaint}</p>
              {c.diagnosis && <p className="text-sm text-surface-500 mt-1"><strong>Diagnosis:</strong> {c.diagnosis}</p>}
              <p className="text-xs text-surface-400 mt-2">Admitted: {new Date(c.admissionDate).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Admission Form Modal */}
      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); resetForm(); }} title={editingCase ? 'Edit Case Paper' : 'New IPD Admission'} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Patient *</label>
              {selectedPatient ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium">{selectedPatient.name}</span>
                  <span className="ml-2 text-xs text-surface-500">{selectedPatient.mrn}</span>
                </div>
              ) : (
                <Input label="" placeholder="Search patient..." value={patients.find((p) => p.id === patientId)?.name || ''}
                  onChange={() => {}} />
              )}
              {!patientId && (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
                  {patients.slice(0, 5).map((p) => (
                    <button key={p.id} onClick={() => setPatientId(p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 text-sm border-b border-surface-100 dark:border-surface-800 last:border-0">
                      <span className="font-medium">{p.name}</span> <span className="text-surface-500">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select label="Doctor *" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}>
              {DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>

            <Textarea label="Chief Complaint *" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={2} placeholder="Reason for admission..." />
            <Textarea label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Provisional diagnosis..." />
            <Textarea label="Past History" value={pastHistory} onChange={(e) => setPastHistory(e.target.value)} rows={2} placeholder="Previous illnesses..." />
            <Input label="Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Known allergies" />
            <Textarea label="Treatment Plan" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} rows={3} placeholder="Treatment approach..." />

            <div className="grid grid-cols-4 gap-2">
              {([
                ['bp', 'BP', '120/80'], ['pulse', 'Pulse', '72'], ['temperature', 'Temp °F', '98.6'], ['weight', 'Weight kg', '70'],
              ] as const).map(([k, l, p]) => (
                <Input key={k} label={l} value={vitals[k]} onChange={(e) => setVitals((v) => ({ ...v, [k]: e.target.value }))} placeholder={p} />
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!patientId || !chiefComplaint.trim()} className="flex-1">
                {editingCase ? 'Update' : 'Admit Patient'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
