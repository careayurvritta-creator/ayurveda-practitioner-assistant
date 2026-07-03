import { useState } from 'react';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Modal } from '../../../components/ui/Modal';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../contexts/ToastContext';
import { DOCTORS, TREATMENT_TYPES, TREATMENT_PLAN_STATUS } from '../types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { TreatmentPlan } from '../types';

export default function HimsTreatmentPlan() {
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { showToast } = useToast();
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentType, setTreatmentType] = useState<TreatmentPlan['treatmentType']>('Shamana');
  const [dietRecommendations, setDietRecommendations] = useState('');
  const [lifestyleAdvice, setLifestyleAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const filteredPlans = plans.filter((p) => {
    const matchesSearch = !searchQuery || p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setPatientId(''); setDoctorName(DOCTORS[0]); setDiagnosis('');
    setTreatmentType('Shamana'); setDietRecommendations('');
    setLifestyleAdvice(''); setFollowUpDate(''); setNotes('');
    setEditingPlan(null);
  };

  const openForm = (plan?: TreatmentPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPatientId(plan.patientId); setDoctorName(plan.doctorName);
      setDiagnosis(plan.diagnosis); setTreatmentType(plan.treatmentType);
      setDietRecommendations(plan.dietRecommendations); setLifestyleAdvice(plan.lifestyleAdvice);
      setFollowUpDate(plan.followUpDate || ''); setNotes(plan.notes);
    } else { resetForm(); }
    setShowForm(true);
  };

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !diagnosis.trim()) { showToast('Please fill required fields', 'error'); return; }

    if (editingPlan) {
      setPlans((prev) => prev.map((p) => p.id === editingPlan.id ? {
        ...p, doctorName, diagnosis, treatmentType, dietRecommendations, lifestyleAdvice,
        followUpDate: followUpDate || undefined, notes,
      } : p));
      showToast('Treatment plan updated', 'success');
    } else {
      const newPlan: TreatmentPlan = {
        id: `tp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        patientId, patientName: patient.name, doctorName, diagnosis, treatmentType,
        therapySessions: [], medications: [], dietRecommendations, lifestyleAdvice,
        followUpDate: followUpDate || undefined, status: 'planned', notes,
        createdAt: new Date().toISOString(),
      };
      setPlans((prev) => [newPlan, ...prev]);
      showToast('Treatment plan created', 'success');
    }
    setShowForm(false); resetForm();
  };

  const updateStatus = (id: string, status: TreatmentPlan['status']) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    showToast(`Plan ${status}`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Treatment Plans' }]} />

        <PageHeader
          title="Treatment Plans"
          subtitle={`${plans.length} plans`}
          actions={
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="w-4 h-4" /> New Plan
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by patient or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['all', ...TREATMENT_PLAN_STATUS].map((s) => (
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

        {/* Plans */}
        {filteredPlans.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No treatment plans found"
            description="Create a treatment plan to get started"
            action={
              <Button size="sm" onClick={() => openForm()}>
                <Plus className="w-4 h-4" /> New Plan
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredPlans.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-surface-900 dark:text-white">{p.patientName}</span>
                      <StatusBadge label={p.status} variant={getStatusVariant(p.status)} dot />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium">
                        {p.treatmentType}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openForm(p)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    {p.status === 'planned' && (
                      <button
                        onClick={() => updateStatus(p.id, 'active')}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    {p.status === 'active' && (
                      <>
                        <button
                          onClick={() => updateStatus(p.id, 'completed')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-medium transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(p.id, 'on-hold')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-medium transition-colors"
                        >
                          Hold
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-surface-500">{p.doctorName} &middot; {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                  <p className="text-surface-700 dark:text-surface-300"><strong>Diagnosis:</strong> {p.diagnosis}</p>
                  {p.dietRecommendations && <p className="text-surface-500"><strong>Diet:</strong> {p.dietRecommendations}</p>}
                  {p.lifestyleAdvice && <p className="text-surface-500"><strong>Lifestyle:</strong> {p.lifestyleAdvice}</p>}
                </div>
                {p.followUpDate && (
                  <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-400">
                    Follow-up: {new Date(p.followUpDate).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); resetForm(); }} title={editingPlan ? 'Edit Treatment Plan' : 'New Treatment Plan'} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Patient *</label>
              {patientId ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium">{patients.find((p) => p.id === patientId)?.name}</span>
                  <button onClick={() => setPatientId('')} className="ml-2 text-sm text-surface-500">Change</button>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-800 rounded-lg">
                  {patients.slice(0, 8).map((p) => (
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
            <Textarea label="Diagnosis *" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Diagnosis..." />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Treatment Type</label>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_TYPES.map((t) => (
                  <button key={t} onClick={() => setTreatmentType(t)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg min-h-[36px] border transition-all ${
                      treatmentType === t
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Diet Recommendations (Ahara)" value={dietRecommendations} onChange={(e) => setDietRecommendations(e.target.value)} rows={2} placeholder="Dietary guidelines..." />
            <Textarea label="Lifestyle Advice (Vihara)" value={lifestyleAdvice} onChange={(e) => setLifestyleAdvice(e.target.value)} rows={2} placeholder="Lifestyle modifications..." />
            <Input label="Follow-up Date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!patientId || !diagnosis.trim()} className="flex-1">
                {editingPlan ? 'Update' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
