import { useState, useEffect } from 'react';
import { Plus, Search, Bed, Stethoscope, AlertCircle, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Modal } from '../../../components/ui/Modal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients } from '../slices/himsPatientSlice';
import { useToast } from '../../../contexts/ToastContext';
import { DOCTORS, IPD_STATUS } from '../types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
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
    } else { resetForm(); }
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

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'discharged': return <XCircle className="w-4 h-4 text-surface-400" />;
      case 'referred': return <ArrowRightLeft className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'IPD' }]} />

        <PageHeader
          title="IPD Case Papers"
          subtitle={`${cases.length} admissions`}
          actions={
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="w-4 h-4" /> New Admission
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by name or IPD number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['all', ...IPD_STATUS].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg capitalize min-h-[36px] whitespace-nowrap border transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800 hover:bg-surface-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Cases */}
        {filteredCases.length === 0 ? (
          <EmptyState
            icon={Bed}
            title="No IPD cases found"
            description="Admit a patient to get started"
            action={
              <Button size="sm" onClick={() => openForm()}>
                <Plus className="w-4 h-4" /> New Admission
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredCases.map((c) => (
              <div
                key={c.id}
                className={`bg-white dark:bg-surface-900 rounded-xl border p-5 transition-all hover:shadow-sm ${
                  c.status === 'critical'
                    ? 'border-red-200 dark:border-red-800 ring-1 ring-red-100 dark:ring-red-900/50'
                    : 'border-surface-200/60 dark:border-surface-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-surface-900 dark:text-white truncate">{c.patientName}</span>
                      <StatusBadge label={c.status} variant={getStatusVariant(c.status)} dot />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      <span className="font-mono px-1.5 py-0.5 rounded bg-surface-50 dark:bg-surface-800">{c.ipdNumber}</span>
                      <span>&middot;</span>
                      <span>UHID: {c.uhid}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openForm(c)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    {c.status === 'active' && (
                      <>
                        <button
                          onClick={() => updateStatus(c.id, 'critical')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-medium transition-colors"
                        >
                          Critical
                        </button>
                        <button
                          onClick={() => updateStatus(c.id, 'discharged')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium transition-colors"
                        >
                          Discharge
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    <Stethoscope className="w-3 h-3 inline mr-1 text-surface-400" />
                    {c.doctorName}
                  </p>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    <strong>Chief Complaint:</strong> {c.chiefComplaint}
                  </p>
                  {c.diagnosis && (
                    <p className="text-sm text-surface-500">
                      <strong>Diagnosis:</strong> {c.diagnosis}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-400">
                  Admitted: {new Date(c.admissionDate).toLocaleDateString('en-IN')}
                  {c.dischargeDate && ` · Discharged: ${new Date(c.dischargeDate).toLocaleDateString('en-IN')}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); resetForm(); }} title={editingCase ? 'Edit Case Paper' : 'New IPD Admission'} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Patient *</label>
              {selectedPatient ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium">{selectedPatient.name}</span>
                  <span className="ml-2 text-xs text-surface-500">{selectedPatient.mrn}</span>
                </div>
              ) : (
                <Input label="" placeholder="Search patient..." value={patients.find((p) => p.id === patientId)?.name || ''} onChange={() => {}} />
              )}
              {!patientId && (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-800 rounded-lg">
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
