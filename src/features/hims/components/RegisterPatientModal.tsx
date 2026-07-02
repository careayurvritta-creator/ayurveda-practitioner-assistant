import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import type { HimsPatient } from '../types';

interface RegisterPatientModalProps {
  onClose: () => void;
}

const GENDERS: HimsPatient['gender'][] = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PRAKRITI_TYPES = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 'Tridosha'];

export function RegisterPatientModal({ onClose }: RegisterPatientModalProps) {
  const { addPatient } = useHimsPatients();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<HimsPatient['gender']>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [vikriti, setVikriti] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !age) return;

    addPatient({
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      prakriti: prakriti || undefined,
      vikriti: vikriti || undefined,
      allergies: allergies.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register New Patient" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramesh Kumar"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Age *"
            type="number"
            min={1}
            max={150}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Years"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Gender *
            </label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    gender === g
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone *"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Optional"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <Input
            label="Emergency Contact"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Prakriti (Constitution)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRAKRITI_TYPES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrakriti(p === prakriti ? '' : p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                  prakriti === p
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Vikriti (Current Imbalance)"
          value={vikriti}
          onChange={(e) => setVikriti(e.target.value)}
          placeholder="e.g. Pitta aggravation"
        />

        <Input
          label="Known Allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="e.g. Dust, Pollen"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || !phone.trim() || !age}
            className="flex-1"
          >
            Register Patient
          </Button>
        </div>
      </form>
    </Modal>
  );
}
