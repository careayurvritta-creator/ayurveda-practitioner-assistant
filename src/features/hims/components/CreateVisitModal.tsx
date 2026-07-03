import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients } from '../slices/himsPatientSlice';
import { createVisit } from '../slices/opdSlice';
import { fetchMedicines } from '../slices/pharmacySlice';
import { useToast } from '../../../contexts/ToastContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { DOCTORS } from '../types';
import type { PrescriptionItem } from '../types';

interface CreateVisitModalProps {
  onClose: () => void;
}

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Before meals',
  'After meals',
  'At bedtime',
];

export function CreateVisitModal({ onClose }: CreateVisitModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { medicines } = useAppSelector((s) => s.hims.pharmacy);
  const { showToast } = useToast();
  const { errors, validate, clearFieldError, getFieldError } = useFormValidation();

  const [patientSearch, setPatientSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [rxMedicine, setRxMedicine] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxDuration, setRxDuration] = useState('7 days');
  const [rxInstructions, setRxInstructions] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    dispatch(fetchPatients());
    dispatch(fetchMedicines());
  }, [dispatch]);

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

  const matchedMedicines = useMemo(() => {
    if (!rxMedicine || rxMedicine.length < 2) return [];
    const q = rxMedicine.toLowerCase();
    return medicines.filter(
      (m) => (m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)) && m.quantity > 0
    ).slice(0, 5);
  }, [rxMedicine, medicines]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const addPrescriptionItem = () => {
    if (!rxMedicine.trim()) return;
    setPrescription((prev) => [
      ...prev,
      {
        medicine: rxMedicine.trim(),
        dosage: rxDosage.trim(),
        frequency: rxFrequency,
        duration: rxDuration.trim(),
        instructions: rxInstructions.trim() || undefined,
      },
    ]);
    setRxMedicine('');
    setRxDosage('');
    setRxInstructions('');
  };

  const removePrescriptionItem = (index: number) => {
    setPrescription((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    return validate([
      { field: 'patient', condition: !selectedPatientId, message: 'Please select a patient' },
      { field: 'chiefComplaint', condition: !chiefComplaint.trim(), message: 'Chief complaint is required' },
      { field: 'chiefComplaint', condition: chiefComplaint.trim().length > 0 && chiefComplaint.trim().length < 2, message: 'Chief complaint must be at least 2 characters' },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await dispatch(createVisit({
      patientId: selectedPatientId,
      patientName: selectedPatient?.name || '',
      doctorName,
      chiefComplaint: chiefComplaint.trim(),
      diagnosis: diagnosis.trim(),
      prescription,
      notes: notes.trim() || undefined,
      status: 'waiting',
      consultationFee: parseFloat(consultationFee) || 500,
    }));
    showToast('Visit created successfully', 'success');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New OPD Visit" maxWidth="max-w-lg">
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
                  {selectedPatient.name}
                </span>
                <span className="ml-2 text-xs text-surface-500">{selectedPatient.mrn}</span>
                <span className="ml-2 text-xs text-surface-400">
                  {selectedPatient.age}y · {selectedPatient.gender}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId('');
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
                  placeholder="Search by name, MRN, or phone..."
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
                {showPatientDropdown && filteredPatients.length === 0 && debouncedSearch.length >= 2 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg p-4 text-center">
                    <p className="text-sm text-surface-500 mb-2">No patients found</p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/hims/patients');
                      }}
                      className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      + Register New Patient
                    </button>
                  </div>
                )}
              </div>
              {getFieldError('patient') && (
                <p className="text-sm text-red-500">{getFieldError('patient')}</p>
              )}
            </>
          )}
        </div>

        {/* Doctor */}
        <Select
          label="Doctor *"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
        >
          {DOCTORS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>

        {/* Chief Complaint */}
        <Input
          label="Chief Complaint *"
          value={chiefComplaint}
          onChange={(e) => { setChiefComplaint(e.target.value); clearFieldError('chiefComplaint'); }}
          placeholder="e.g. Joint pain, Digestive issues"
          error={getFieldError('chiefComplaint')}
          aria-required="true"
        />

        {/* Diagnosis */}
        <Input
          label="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Provisional diagnosis"
        />

        {/* Prescription */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Prescription
          </label>

          {prescription.length > 0 && (
            <div className="space-y-1">
              {prescription.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded-lg text-sm"
                >
                  <span className="text-surface-900 dark:text-white">
                    {item.medicine} — {item.dosage} {item.frequency} × {item.duration}
                    {item.instructions && ` (${item.instructions})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrescriptionItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Medicine name"
                value={rxMedicine}
                onChange={(e) => { setRxMedicine(e.target.value); setShowMedicineDropdown(true); }}
                onFocus={() => setShowMedicineDropdown(true)}
                onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 200)}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
              />
              {showMedicineDropdown && matchedMedicines.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg">
                  {matchedMedicines.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => {
                        setRxMedicine(med.name);
                        setShowMedicineDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 border-b border-surface-100 dark:border-surface-700 last:border-0"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{med.name}</span>
                        <span className="text-surface-500">₹{med.price}</span>
                      </div>
                      <div className="text-xs text-surface-400">
                        {med.category} · Stock: {med.quantity} {med.unit}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Dosage (e.g. 500mg)"
              value={rxDosage}
              onChange={(e) => setRxDosage(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={rxFrequency}
              onChange={(e) => setRxFrequency(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Duration (e.g. 7 days)"
              value={rxDuration}
              onChange={(e) => setRxDuration(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Instructions (optional)"
              value={rxInstructions}
              onChange={(e) => setRxInstructions(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            />
            <Button type="button" variant="secondary" onClick={addPrescriptionItem}>
              Add
            </Button>
          </div>
        </div>

        {/* Consultation Fee */}
        <Input
          label="Consultation Fee (₹)"
          type="number"
          min={0}
          value={consultationFee}
          onChange={(e) => setConsultationFee(e.target.value)}
        />

        {/* Notes */}
        <Textarea
          label="Clinical Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional observations..."
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedPatientId || !chiefComplaint.trim()}
            className="flex-1"
          >
            Create Visit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
