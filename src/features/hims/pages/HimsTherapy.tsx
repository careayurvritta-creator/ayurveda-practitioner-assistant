import { useState } from 'react';
import { Plus, Search, Calendar, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { useAppSelector } from '../../../store/hooks';
import { useToast } from '../../../contexts/ToastContext';
import { DOCTORS, THERAPY_CATEGORIES, THERAPY_STATUS } from '../types';
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

  // Form state
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">Therapy Register</h1>
          <p className="text-sm text-surface-500">{sessions.length} sessions</p>
        </div>
        <Button onClick={() => openForm()} className="gap-2"><Plus className="w-4 h-4" /> New Session</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]" />
        </div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-sm min-h-[44px]" />
        <div className="flex gap-1">
          {['all', ...THERAPY_STATUS].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize min-h-[40px] ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-600 mb-3" />
          <p className="text-surface-500">No therapy sessions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((s) => (
            <div key={s.id} className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-surface-900 dark:text-white">{s.therapyName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{s.therapyCategory}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                      s.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                    }`}>{s.status}</span>
                  </div>
                  <p className="text-sm text-surface-500 mt-1">{s.patientName} · {s.doctorName} · Therapist: {s.therapistName}</p>
                  <p className="text-xs text-surface-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.scheduledDate}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.scheduledTime} · {s.duration}min</span>
                    <span>₹{s.cost.toLocaleString('en-IN')}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" onClick={() => openForm(s)} className="text-xs px-2 py-1">Edit</Button>
                  {s.status === 'scheduled' && (
                    <>
                      <button onClick={() => updateStatus(s.id, 'in-progress')} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">Start</button>
                      <button onClick={() => updateStatus(s.id, 'cancelled')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Cancel</button>
                    </>
                  )}
                  {s.status === 'in-progress' && (
                    <button onClick={() => updateStatus(s.id, 'completed')} className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Complete</button>
                  )}
                </div>
              </div>
              {s.notes && <p className="text-xs text-surface-400 mt-2">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); resetForm(); }} title={editingSession ? 'Edit Session' : 'New Therapy Session'} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Patient *</label>
              {patientId ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium">{patients.find((p) => p.id === patientId)?.name}</span>
                  <button onClick={() => setPatientId('')} className="ml-2 text-sm text-surface-500">Change</button>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
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
                    className={`px-3 py-2 text-xs font-medium rounded-lg min-h-[36px] ${therapyCategory === cat ? 'bg-emerald-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
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
