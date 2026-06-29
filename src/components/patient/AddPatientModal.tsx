import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePatients } from '../../contexts/PatientContext';

interface AddPatientModalProps {
  onClose: () => void;
}

const PRAKRITI_OPTIONS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'];
const VIKRITI_OPTIONS = ['Vata aggravation', 'Pitta aggravation', 'Kapha aggravation', 'Vata-Pitta imbalance', 'Pitta-Kapha imbalance', 'Vata-Kapha imbalance'];

export function AddPatientModal({ onClose }: AddPatientModalProps) {
  const { addPatient } = usePatients();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [vikriti, setVikriti] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prakriti) return;

    addPatient({
      name: name.trim(),
      age: parseInt(age) || 0,
      gender,
      prakriti,
      vikriti,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Patient" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Patient Name"
          placeholder="Enter full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age"
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min="0"
            max="150"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none min-h-[48px]"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Prakriti (Constitution) *
          </label>
          <div className="flex flex-wrap gap-2">
            {PRAKRITI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPrakriti(opt)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  prakriti === opt
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Vikriti (Current Imbalance)
          </label>
          <div className="flex flex-wrap gap-2">
            {VIKRITI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setVikriti(opt)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  vikriti === opt
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Clinical Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Chief complaint, history, etc."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || !prakriti}
            className="flex-1"
          >
            Add Patient
          </Button>
        </div>
      </form>
    </Modal>
  );
}
