import { useState } from 'react';
import { Plus, Search, Calendar, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../contexts/ToastContext';
import { DOCTORS, THERAPY_CATEGORIES, THERAPY_STATUS } from '../types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { TherapySession } from '../types';

export default function HimsTherapy() {
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<TherapySession | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const [patientId, setPatientId] = useState('');
  const [therapyName, setTherapyName] = useState('');
  const [therapyCategory, setTherapyCategory] = useState<TherapySession['therapyCategory']>('Abhyanga & Massage');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [therapistName, setTherapistName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [duration, setDuration] = useState('60');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = !searchQuery || s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || s.therapyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesDate = !dateFilter || s.scheduledDate === dateFilter;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const resetForm = () => {
    setPatientId(''); setTherapyName(''); setTherapyCategory('Abhyanga & Massage');
    setDoctorName(DOCTORS[0]); setTherapistName(''); setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00'); setDuration('60'); setCost(''); setNotes('');
    setEditingSession(null);
  };

  const openForm = (session?: TherapySession) => {
    if (session) {
      setEditingSession(session);
      setPatientId(session.patientId); setTherapyName(session.therapyName);
      setTherapyCategory(session.therapyCategory); setDoctorName(session.doctorName);
      setTherapistName(session.therapistName); setScheduledDate(session.scheduledDate);
      setScheduledTime(session.scheduledTime); setDuration(String(session.duration));
      setCost(String(session.cost)); setNotes(session.notes || '');
    } else { resetForm(); }
    setShowForm(true);
  };

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !therapyName.trim()) { showToast('Please fill required fields', 'error'); return; }

    if (editingSession) {
      setSessions((prev) => prev.map((s) => s.id === editingSession.id ? {
        ...s, therapyName, therapyCategory, doctorName, therapistName, scheduledDate, scheduledTime,
        duration: parseInt(duration), cost: parseFloat(cost) || 0, notes,
      } : s));
      showToast('Session updated', 'success');
    } else {
      const newSession: TherapySession = {
        id: `ther_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        patientId, patientName: patient.name, therapyName, therapyCategory,
        doctorName, therapistName, scheduledDate, scheduledTime,
        duration: parseInt(duration) || 60, status: 'scheduled',
        cost: parseFloat(cost) || 0, notes, createdAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      showToast('Therapy session scheduled', 'success');
    }
    setShowForm(false); resetForm();
  };

  const updateStatus = (id: string, status: TherapySession['status']) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    showToast(`Session ${status}`, 'success');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Therapy Register' }]} />

        <PageHeader
          title="Therapy Register"
          subtitle={`${sessions.length} sessions`}
          actions={
            <Button size="sm" onClick={() => openForm()}>
              <Plus className="w-4 h-4" /> New Session
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 min-h-[48px]"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {['all', ...THERAPY_STATUS].map((s) => (
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

        {/* Sessions */}
        {filteredSessions.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No therapy sessions found"
            description="Schedule a therapy session to get started"
            action={
              <Button size="sm" onClick={() => openForm()}>
                <Plus className="w-4 h-4" /> New Session
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-surface-900 dark:text-white">{s.therapyName}</span>
                      <StatusBadge label={s.status} variant={getStatusVariant(s.status)} dot />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                        {s.therapyCategory}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openForm(s)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    {s.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => updateStatus(s.id, 'in-progress')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 font-medium transition-colors"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => updateStatus(s.id, 'cancelled')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {s.status === 'in-progress' && (
                      <button
                        onClick={() => updateStatus(s.id, 'completed')}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 font-medium transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm text-surface-500">
                  <p>{s.patientName} &middot; {s.doctorName} &middot; Therapist: {s.therapistName}</p>
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.scheduledDate}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.scheduledTime} &middot; {s.duration}min</span>
                    <span className="font-semibold text-surface-700 dark:text-surface-300">₹{s.cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {s.notes && <p className="text-xs text-surface-400 mt-2">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); resetForm(); }} title={editingSession ? 'Edit Session' : 'New Therapy Session'} maxWidth="max-w-lg">
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
            <Input label="Therapy Name *" value={therapyName} onChange={(e) => setTherapyName(e.target.value)} placeholder="e.g. Abhyanga, Shirodhara" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Category</label>
              <div className="flex flex-wrap gap-2">
                {THERAPY_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setTherapyCategory(cat)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg min-h-[36px] border transition-all ${
                      therapyCategory === cat
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Doctor" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}>
                {DOCTORS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Input label="Therapist" value={therapistName} onChange={(e) => setTherapistName(e.target.value)} placeholder="Therapist name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Date *" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              <Input label="Time *" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              <Input label="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} />
            </div>
            <Input label="Cost (₹)" type="number" value={cost} onChange={(e) => setCost(e.target.value)} min={0} placeholder="0" />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!patientId || !therapyName.trim()} className="flex-1">
                {editingSession ? 'Update' : 'Schedule'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
