import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { TimeSlotPicker } from './TimeSlotPicker';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients } from '../slices/himsPatientSlice';
import { createAppointment } from '../slices/appointmentSlice';
import { useToast } from '../../../contexts/ToastContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { DOCTORS, APPOINTMENT_TYPES } from '../types';
import { UserPlus } from 'lucide-react';

interface AppointmentFormModalProps {
  isOpen?: boolean;
  onClose: () => void;
  preSelectedPatient?: {
    patientId: string;
    patientName: string;
    uhid: string;
  };
}

export function AppointmentFormModal({ isOpen = true, onClose, preSelectedPatient }: AppointmentFormModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { showToast } = useToast();
  const { errors, validate, clearFieldError, getFieldError } = useFormValidation();

  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedPatient?.patientId || '');
  const [selectedPatientName, setSelectedPatientName] = useState(preSelectedPatient?.patientName || '');
  const [selectedUhid, setSelectedUhid] = useState(preSelectedPatient?.uhid || '');
  const [doctorName] = useState(DOCTORS[0]);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState<string>('consultation');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [chamber, setChamber] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (preSelectedPatient) {
      setSelectedPatientId(preSelectedPatient.patientId);
      setSelectedPatientName(preSelectedPatient.patientName);
      setSelectedUhid(preSelectedPatient.uhid);
    }
  }, [preSelectedPatient]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(patientSearch);
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [patientSearch]);

  const filteredPatients = useMemo(() => {
    if (debouncedSearch.length < 2) return [];
    const q = debouncedSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, debouncedSearch]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const validateForm = (): boolean => {
    return validate([
      { field: 'patient', condition: !selectedPatientId, message: 'Please select a patient' },
      { field: 'date', condition: !appointmentDate, message: 'Please select a date' },
      { field: 'slot', condition: !selectedSlot, message: 'Please select a time slot' },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const [hours, mins] = selectedSlot.split(':').map(Number);
    const endMinutes = hours * 60 + mins + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    try {
      await dispatch(createAppointment({
        patientId: selectedPatientId,
        patientName: selectedPatientName,
        uhid: selectedUhid,
        doctorName,
        appointmentDate,
        startTime: selectedSlot,
        endTime,
        duration: 30,
        type: appointmentType as any,
        status: 'scheduled',
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
        chamber: chamber.trim() || undefined,
      })).unwrap();
      showToast('Appointment booked successfully', 'success');
      onClose();
    } catch {
      showToast('Failed to book appointment. Please try again.', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Patient *
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div>
                <span className="font-medium text-surface-900 dark:text-white">
                  {selectedPatientName}
                </span>
                <span className="ml-2 text-xs text-surface-500">{selectedUhid}</span>
                <span className="ml-2 text-xs text-surface-400">
                  {selectedPatient.age}y · {selectedPatient.gender}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId('');
                  setSelectedPatientName('');
                  setSelectedUhid('');
                  setPatientSearch('');
                }}
                className="text-sm text-surface-500 hover:text-surface-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, UHID, or phone..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); clearFieldError('patient'); }}
                  onFocus={() => setShowPatientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  className="w-full px-4 py-3 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                />
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setSelectedPatientName(p.name);
                          setSelectedUhid(p.mrn);
                          setPatientSearch('');
                          setShowPatientDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 text-sm border-b border-surface-100 dark:border-surface-800 last:border-0"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-surface-500">{p.mrn}</span>
                        <span className="ml-2 text-xs text-surface-400">
                          {p.age}y · {p.gender}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {showPatientDropdown && filteredPatients.length === 0 && debouncedSearch.length >= 2 && (
                <div className="text-center py-3">
                  <p className="text-sm text-surface-500 mb-2">No patients found</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/hims/patients');
                    }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1 mx-auto"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register New Patient
                  </button>
                </div>
              )}
              {getFieldError('patient') && (
                <p className="text-sm text-red-500">{getFieldError('patient')}</p>
              )}
            </>
          )}
        </div>

        {/* Date */}
        <Input
          label="Appointment Date *"
          type="date"
          value={appointmentDate}
          onChange={(e) => { setAppointmentDate(e.target.value); setSelectedSlot(''); }}
          min={new Date().toISOString().split('T')[0]}
          error={getFieldError('date')}
        />

        {/* Doctor */}
        <Input
          label="Doctor"
          value={doctorName}
          disabled
          className="bg-surface-100 dark:bg-surface-700"
        />

        {/* Time Slots */}
        {appointmentDate && (
          <TimeSlotPicker
            date={appointmentDate}
            doctorName={doctorName}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        )}
        {getFieldError('slot') && (
          <p className="text-sm text-red-500">{getFieldError('slot')}</p>
        )}

        {/* Appointment Type */}
        <Select
          label="Appointment Type *"
          value={appointmentType}
          onChange={(e) => setAppointmentType(e.target.value)}
        >
          {APPOINTMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            </option>
          ))}
        </Select>

        {/* Reason */}
        <Textarea
          label="Reason / Chief Complaint"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief description of the visit reason"
          rows={2}
        />

        {/* Chamber */}
        <Input
          label="Chamber / OPD Room"
          value={chamber}
          onChange={(e) => setChamber(e.target.value)}
          placeholder="e.g. OPD-1"
        />

        {/* Notes */}
        <Textarea
          label="Additional Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions or notes"
          rows={2}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedPatientId || !selectedSlot || !appointmentDate}
            className="flex-1"
          >
            Book Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
