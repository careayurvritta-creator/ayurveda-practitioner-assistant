import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { DOCTORS } from '../types';
import type { PrescriptionItem } from '../types';

interface CreateVisitModalProps {
  onClose: () => void;
}

export function CreateVisitModal({ onClose }: CreateVisitModalProps) {
  const { patients } = useHimsPatients();
  const { addVisit } = useOpd();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorName, setDoctorName] = useState(DOCTORS[0]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);

  // Prescription form state
  const [rxMedicine, setRxMedicine] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxDuration, setRxDuration] = useState('7 days');
  const [rxInstructions, setRxInstructions] = useState('');

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const addPrescriptionItem = () => {
    if (!rxMedicine.trim()) return;
    setPrescription((prev) => [
      ...prev,
      {
        medicine: rxMedicine.trim(),
        dosage: rxDosage.trim(),
        frequency: rxFrequency,
        duration: rxDuration,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !chiefComplaint.trim()) return;

    addVisit({
      patientId: selectedPatientId,
      patientName: selectedPatient?.name || '',
      doctorName,
      chiefComplaint: chiefComplaint.trim(),
      diagnosis: diagnosis.trim(),
      prescription,
      notes: notes.trim() || undefined,
      status: 'waiting',
      consultationFee: parseInt(consultationFee, 10) || 500,
    });
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
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId('');
                  setPatientSearch('');
                }}
                className="text-sm text-surface-500 hover:text-surface-700"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                label=""
                placeholder="Search patient by name or MRN..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {patientSearch && filteredPatients.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
                  {filteredPatients.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 text-sm border-b border-surface-100 dark:border-surface-800 last:border-0"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-surface-500">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Doctor */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Doctor *
          </label>
          <select
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
          >
            {DOCTORS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Chief Complaint */}
        <Input
          label="Chief Complaint *"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="e.g. Joint pain, Digestive issues"
          required
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
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrescriptionItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Medicine name"
              value={rxMedicine}
              onChange={(e) => setRxMedicine(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
            />
            <input
              type="text"
              placeholder="Dosage (e.g. 500mg)"
              value={rxDosage}
              onChange={(e) => setRxDosage(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={rxFrequency}
              onChange={(e) => setRxFrequency(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
            >
              <option>Once daily</option>
              <option>Twice daily</option>
              <option>Thrice daily</option>
              <option>Before meals</option>
              <option>After meals</option>
              <option>At bedtime</option>
            </select>
            <input
              type="text"
              placeholder="Duration (e.g. 7 days)"
              value={rxDuration}
              onChange={(e) => setRxDuration(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Instructions (optional)"
              value={rxInstructions}
              onChange={(e) => setRxInstructions(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
            />
            <button
              type="button"
              onClick={addPrescriptionItem}
              className="px-3 py-2 text-sm rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-200"
            >
              Add
            </button>
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
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Clinical Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional observations..."
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

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
