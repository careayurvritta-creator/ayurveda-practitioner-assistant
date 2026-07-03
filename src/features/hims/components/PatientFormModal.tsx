import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createPatient, updatePatient } from '../slices/himsPatientSlice';
import { useToast } from '../../../contexts/ToastContext';
import { useFormValidation } from '../../../hooks/useFormValidation';
import type { PatientRecord } from '../db/PatientRepository';
import { GENDERS, BLOOD_GROUPS, PRAKRITI_TYPES, AGNI_TYPES, KOSHTA_TYPES } from '../types';

interface PatientFormModalProps {
  isOpen?: boolean;
  onClose: () => void;
  patient?: PatientRecord;
  onRegistered?: (patientId: string, patientName: string, uhid: string) => void;
}

export function PatientFormModal({ isOpen = true, onClose, patient, onRegistered }: PatientFormModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { patients } = useAppSelector((s) => s.hims.patients);
  const { showToast } = useToast();
  const { errors, validate, clearErrors, clearFieldError, getFieldError } = useFormValidation();

  const isEdit = !!patient;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<PatientRecord['gender']>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [occupation, setOccupation] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [pastHistory, setPastHistory] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [vikriti, setVikriti] = useState('');
  const [agni, setAgni] = useState('');
  const [koshta, setKoshta] = useState('');
  const [sara, setSara] = useState('');
  const [samhanana, setSamhanana] = useState('');
  const [satmya, setSatmya] = useState('');
  const [sattva, setSattva] = useState('');
  const [aharaShakti, setAharaShakti] = useState('');
  const [vyayamaShakti, setVyayamaShakti] = useState('');
  const [vaya, setVaya] = useState('');
  const [allergies, setAllergies] = useState('');

  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    message: string;
    existingPatient?: PatientRecord;
  }>({ isOpen: false, message: '' });

  const [postRegistrationDialog, setPostRegistrationDialog] = useState<{
    isOpen: boolean;
    patientId: string;
    patientName: string;
    uhid: string;
  }>({ isOpen: false, patientId: '', patientName: '', uhid: '' });

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
        setOccupation(patient.occupation || '');
        setReferredBy(patient.referredBy || '');
        setPastHistory(patient.pastHistory || '');
        setFamilyHistory(patient.familyHistory || '');
        setPrakriti(patient.prakriti || '');
        setVikriti(patient.vikriti || '');
        setAgni(patient.agni || '');
        setKoshta(patient.koshta || '');
        setSara(patient.sara || '');
        setSamhanana(patient.samhanana || '');
        setSatmya(patient.satmya || '');
        setSattva(patient.sattva || '');
        setAharaShakti(patient.aharaShakti || '');
        setVyayamaShakti(patient.vyayamaShakti || '');
        setVaya(patient.vaya || '');
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
        setOccupation('');
        setReferredBy('');
        setPastHistory('');
        setFamilyHistory('');
        setPrakriti('');
        setVikriti('');
        setAgni('');
        setKoshta('');
        setSara('');
        setSamhanana('');
        setSatmya('');
        setSattva('');
        setAharaShakti('');
        setVyayamaShakti('');
        setVaya('');
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

  const findDuplicatePatient = (phoneNum: string, nameVal: string, excludeId?: string) => {
    const normalizedPhone = phoneNum.replace(/\D/g, '');
    const trimmedName = nameVal.trim().toLowerCase();

    const phoneMatch = patients.find(
      (p) => p.id !== excludeId && p.phone.replace(/\D/g, '') === normalizedPhone
    );
    if (phoneMatch) {
      return { isDuplicate: true, existingPatient: phoneMatch, matchType: 'phone' as const };
    }

    const nameMatch = patients.find(
      (p) => p.id !== excludeId && p.name.trim().toLowerCase() === trimmedName
    );
    if (nameMatch) {
      return { isDuplicate: true, existingPatient: nameMatch, matchType: 'name' as const };
    }

    return { isDuplicate: false, matchType: 'none' as const };
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

  const savePatient = async () => {
    const patientData = {
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      bloodGroup: (bloodGroup || undefined) as PatientRecord['bloodGroup'],
      emergencyContact: emergencyContact.trim() || undefined,
      occupation: occupation.trim() || undefined,
      referredBy: referredBy.trim() || undefined,
      pastHistory: pastHistory.trim() || undefined,
      familyHistory: familyHistory.trim() || undefined,
      prakriti: prakriti || undefined,
      vikriti: vikriti || undefined,
      agni: agni || undefined,
      koshta: koshta || undefined,
      sara: sara || undefined,
      samhanana: samhanana || undefined,
      satmya: satmya || undefined,
      sattva: sattva || undefined,
      aharaShakti: aharaShakti || undefined,
      vyayamaShakti: vyayamaShakti || undefined,
      vaya: vaya || undefined,
      allergies: allergies.trim() || undefined,
    };

    if (isEdit && patient) {
      try {
        await dispatch(updatePatient({ id: patient.id, updates: patientData })).unwrap();
        showToast('Patient updated successfully', 'success');
        onClose();
      } catch {
        showToast('Failed to update patient. Please try again.', 'error');
      }
    } else {
      try {
        const result = await dispatch(createPatient(patientData)).unwrap();
        showToast('Patient registered successfully', 'success');
        if (onRegistered) {
          onRegistered(result.id, result.name, result.mrn);
        } else {
          setPostRegistrationDialog({
            isOpen: true,
            patientId: result.id,
            patientName: result.name,
            uhid: result.mrn,
          });
        }
      } catch {
        showToast('Failed to register patient. Please try again.', 'error');
      }
    }
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
                Additional Details (Optional)
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Teacher"
                />
                <Input
                  label="Referred By"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="Doctor or source"
                />
              </div>

              <Textarea
                label="Past Medical History"
                value={pastHistory}
                onChange={(e) => setPastHistory(e.target.value)}
                placeholder="Previous surgeries, chronic conditions..."
                rows={2}
              />

              <Textarea
                label="Family History"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="Hereditary conditions, family illnesses..."
                rows={2}
              />
            </fieldset>
          </div>

          <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Ayurveda Assessment (Optional)
              </legend>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Prakriti (Constitution)
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

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Vikriti (Current Imbalance)"
                  value={vikriti}
                  onChange={(e) => setVikriti(e.target.value)}
                >
                  <option value="">Select</option>
                  {PRAKRITI_TYPES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>

                <Select
                  label="Agni (Digestive Fire)"
                  value={agni}
                  onChange={(e) => setAgni(e.target.value)}
                >
                  <option value="">Select</option>
                  {AGNI_TYPES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Koshta (Bowel Habit)"
                  value={koshta}
                  onChange={(e) => setKoshta(e.target.value)}
                >
                  <option value="">Select</option>
                  {KOSHTA_TYPES.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </Select>

                <Select
                  label="Sara (Tissue Excellence)"
                  value={sara}
                  onChange={(e) => setSara(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Pravara">Pravara (Excellent)</option>
                  <option value="Madhyama">Madhyama (Medium)</option>
                  <option value="Avara">Avara (Poor)</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Samhanana (Compactness)"
                  value={samhanana}
                  onChange={(e) => setSamhanana(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Pravara">Pravara (Firm)</option>
                  <option value="Madhyama">Madhyama (Medium)</option>
                  <option value="Avara">Avara (Loose)</option>
                </Select>

                <Select
                  label="Satmya (Adaptability)"
                  value={satmya}
                  onChange={(e) => setSatmya(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Sattvika">Sattvika</option>
                  <option value="Rajasika">Rajasika</option>
                  <option value="Tamasika">Tamasika</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Ahara Shakti (Digestive Power)"
                  value={aharaShakti}
                  onChange={(e) => setAharaShakti(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Pravara">Pravara (Strong)</option>
                  <option value="Madhyama">Madhyama (Medium)</option>
                  <option value="Avara">Avara (Weak)</option>
                </Select>

                <Select
                  label="Vyayama Shakti (Exercise Capacity)"
                  value={vyayamaShakti}
                  onChange={(e) => setVyayamaShakti(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Pravara">Pravara (Strong)</option>
                  <option value="Madhyama">Madhyama (Medium)</option>
                  <option value="Avara">Avara (Weak)</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Sattva (Mental Strength)"
                  value={sattva}
                  onChange={(e) => setSattva(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Sattvika">Sattvika</option>
                  <option value="Rajasika">Rajasika</option>
                  <option value="Tamasika">Tamasika</option>
                </Select>

                <Select
                  label="Vaya (Age Group)"
                  value={vaya}
                  onChange={(e) => setVaya(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Bala">Bala (Child)</option>
                  <option value="Madhya">Madhya (Adult)</option>
                  <option value="Jirna">Jirna (Elderly)</option>
                </Select>
              </div>

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

      <ConfirmationDialog
        isOpen={postRegistrationDialog.isOpen}
        onClose={() => {
          setPostRegistrationDialog({ isOpen: false, patientId: '', patientName: '', uhid: '' });
          onClose();
        }}
        onConfirm={() => {
          const { patientId, patientName, uhid } = postRegistrationDialog;
          setPostRegistrationDialog({ isOpen: false, patientId: '', patientName: '', uhid: '' });
          onClose();
          navigate('/hims/appointments/new', { state: { patientId, patientName, uhid } });
        }}
        title="Patient Registered Successfully"
        message={`${postRegistrationDialog.patientName} (${postRegistrationDialog.uhid}) has been registered. Would you like to book an appointment now?`}
        confirmLabel="Book Appointment"
        cancelLabel="Done"
      />
    </>
  );
}
