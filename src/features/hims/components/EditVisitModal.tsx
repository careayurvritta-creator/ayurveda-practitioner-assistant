import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { useAppDispatch } from '../../../store/hooks';
import { updateVisit } from '../slices/opdSlice';
import { DOCTORS } from '../types';
import type { VisitRecord } from '../db/VisitRepository';

interface EditVisitModalProps {
  visit: VisitRecord;
  onClose: () => void;
}

export function EditVisitModal({ visit, onClose }: EditVisitModalProps) {
  const dispatch = useAppDispatch();
  const [doctorName, setDoctorName] = useState(visit.doctorName);
  const [chiefComplaint, setChiefComplaint] = useState(visit.chiefComplaint);
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis);
  const [notes, setNotes] = useState(visit.notes || '');
  const [consultationFee, setConsultationFee] = useState(String(visit.consultationFee));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;

    dispatch(updateVisit({
      id: visit.id,
      updates: {
        doctorName,
        chiefComplaint: chiefComplaint.trim(),
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        consultationFee: parseFloat(consultationFee) || 0,
      },
    }));
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Visit" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-surface-50 dark:bg-surface-700 rounded-lg text-sm">
          <span className="text-surface-500">Patient:</span>
          <span className="ml-2 font-medium text-surface-900 dark:text-white">{visit.patientName}</span>
          <span className="ml-2 text-surface-400">
            {new Date(visit.visitDate).toLocaleDateString('en-IN')}
          </span>
        </div>

        <Select
          label="Doctor"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
        >
          {DOCTORS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>

        <Input
          label="Chief Complaint *"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          required
        />

        <Input
          label="Diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Provisional diagnosis"
        />

        <Input
          label="Consultation Fee (₹)"
          type="number"
          min={0}
          value={consultationFee}
          onChange={(e) => setConsultationFee(e.target.value)}
        />

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
          <Button type="submit" disabled={!chiefComplaint.trim()} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
