import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useToast } from '../../../contexts/ToastContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import type { HimsPatient } from '../types';
import { GENDERS, BLOOD_GROUPS, PRAKRITI_TYPES } from '../types';

interface PatientFormModalProps {
  isOpen?: boolean;
  onClose: () => void;
  patient?: HimsPatient;
}

export function PatientFormModal({ isOpen = true, onClose, patient }: PatientFormModalProps) {
  const { addPatient, updatePatient, findDuplicatePatient } = useHimsPatients();
  const { showToast } = useToast();
  const { errors, validate, clearErrors, clearFieldError, getFieldError } = useFormValidation();

  const isEdit = !!patient;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<HimsPatient['gender']>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [vikriti, setVikriti] = useState('');
  const [allergies, setAllergies] = useState('');

  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    message: string;
    existingPatient?: HimsPatient;
  }>({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen) {
      clearErrors();
      if (patient) {
        setName(patient.name);
        setAge(String(patient.age));
        setGender(patient.gender);
        setPhone(patient.phone);
        setEmail(patient.email || '');
        setAddress(patient.address || '');
        setBloodGroup(patient.bloodGroup || '');
        setEmergencyContact(patient.emergencyContact || '');
        setPrakriti(patient.prakriti || '');
        setVikriti(patient.vikriti || '');
        setAllergies(patient.allergies || '');
      } else {
        setName('');
        setAge('');
        setGender('Male');
        setPhone('');
        setEmail('');
        setAddress('');
        setBloodGroup('');
        setEmergencyContact('');
        setPrakriti('');
        setVikriti('');
        setAllergies('');
      }
    }
  }, [isOpen, patient, clearErrors]);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    clearFieldError('phone');
  };

  const handleAgeChange = (value: string) => {
    setAge(value);
    clearFieldError('age');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    clearFieldError('name');
  };

  const validateForm = (): boolean => {
    return validate([
      { field: 'name', condition: !name.trim(), message: 'Name is required' },
      { field: 'name', condition: name.trim().length > 0 && name.trim().length < 2, message: 'Name must be at least 2 characters' },
      { field: 'age', condition: !age, message: 'Age is required' },
      { field: 'age', condition: age !== '' && (parseInt(age, 10) < 0 || parseInt(age, 10) > 120), message: 'Please enter a valid age (0-120)' },
      { field: 'phone', condition: !phone.trim(), message: 'Phone number is required' },
      { field: 'phone', condition: phone.length > 0 && !/^[6-9]\d{9}$/.test(phone), message: 'Please enter a valid 10-digit Indian mobile number' },
      { field: 'email', condition: email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), message: 'Please enter a valid email address' },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isEdit) {
      const duplicate = findDuplicatePatient(phone, name);
      if (duplicate.isDuplicate && duplicate.existingPatient) {
        setDuplicateWarning({
          isOpen: true,
          message: `A patient with this ${duplicate.matchType === 'phone' ? 'phone number' : 'name'} already exists: ${duplicate.existingPatient.name} (${duplicate.existingPatient.mrn}). Do you want to create a new patient anyway?`,
          existingPatient: duplicate.existingPatient,
        });
        return;
      }
    }

    savePatient();
  };

  const savePatient = () => {
    const patientData = {
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      bloodGroup: (bloodGroup || undefined) as HimsPatient['bloodGroup'],
      emergencyContact: emergencyContact.trim() || undefined,
      prakriti: prakriti || undefined,
      vikriti: vikriti || undefined,
      allergies: allergies.trim() || undefined,
    };

    if (isEdit && patient) {
      updatePatient(patient.id, patientData);
      showToast('Patient updated successfully', 'success');
    } else {
      addPatient(patientData);
      showToast('Patient registered successfully', 'success');
    }
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Patient' : 'Register New Patient'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && patient && (
            <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-700 rounded-lg text-sm">
              <span className="text-surface-500">MRN:</span>
              <span className="font-medium text-surface-900 dark:text-white">{patient.mrn}</span>
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Personal Information
            </legend>

            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter full name"
              error={getFieldError('name')}
              aria-required="true"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age *"
                type="number"
                value={age}
                onChange={(e) => handleAgeChange(e.target.value)}
                min={0}
                max={120}
                placeholder="0-120"
                error={getFieldError('age')}
                aria-required="true"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Gender *
                </label>
                <div className="flex gap-1" role="radiogroup" aria-label="Gender">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={gender === g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                        gender === g
                          ? 'bg-emerald-600 text-white'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone *"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
                error={getFieldError('phone')}
                aria-required="true"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                placeholder="email@example.com"
                error={getFieldError('email')}
              />
            </div>

            <Textarea
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              rows={2}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
              <Input
                label="Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & phone"
              />
            </div>
          </fieldset>

          <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Ayurveda Assessment (Optional)
              </legend>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Prakriti
                </label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Prakriti">
                  {PRAKRITI_TYPES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={prakriti === p}
                      onClick={() => setPrakriti(prakriti === p ? '' : p)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                        prakriti === p
                          ? 'bg-emerald-600 text-white'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Select
                label="Vikriti"
                value={vikriti}
                onChange={(e) => setVikriti(e.target.value)}
              >
                <option value="">Select</option>
                {PRAKRITI_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>

              <Textarea
                label="Known Allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Food, medicine, or other allergies"
                rows={2}
              />
            </fieldset>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!name.trim() || !phone.trim() || !age}
            >
              {isEdit ? 'Save Changes' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={duplicateWarning.isOpen}
        onClose={() => setDuplicateWarning({ isOpen: false, message: '' })}
        onConfirm={savePatient}
        title="Possible Duplicate Patient"
        message={duplicateWarning.message}
        confirmLabel="Create New"
        cancelLabel="Use Existing"
      />
    </>
  );
}
