import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { useToast } from '../../../contexts/ToastContext';
import type { OpdVisit, AshtvidhaPariksha, DashvidhaPariksha, NidanPanchak } from '../types';

interface ConsultationFormModalProps {
  visit: OpdVisit;
  onClose: () => void;
}

const ASHTVIDHA_FIELDS: Array<{ key: keyof AshtvidhaPariksha; label: string; hint: string }> = [
  { key: 'nadi', label: 'Nadi (Pulse)', hint: 'Vata — thin/wiry, Pitta — moderate/throbbing, Kapha — slow/soft' },
  { key: 'mala', label: 'Mala (Stool)', hint: 'Consistency, frequency, color, odor' },
  { key: 'mutra', label: 'Mutra (Urine)', hint: 'Color, frequency, burning sensation, quantity' },
  { key: 'jihwa', label: 'Jihwa (Tongue)', hint: 'Coating, color, cracks, shape' },
  { key: 'shabda', label: 'Shabda (Voice)', hint: 'Strength, tone, clarity' },
  { key: 'sparsha', label: 'Sparsha (Skin)', hint: 'Temperature, moisture, texture, sensitivity' },
  { key: 'drika', label: 'Drika (Eyes)', hint: 'Color, vision quality, discharge, dryness' },
  { key: 'akruti', label: 'Akruti (Body Built)', hint: 'Frame size, symmetry, deformities' },
];

const DASHVIDHA_FIELDS: Array<{ key: keyof DashvidhaPariksha; label: string; hint: string }> = [
  { key: 'prakriti', label: 'Prakriti (Constitution)', hint: 'Vata / Pitta / Kapha / Mixed' },
  { key: 'vikriti', label: 'Vikriti (Current Imbalance)', hint: 'Which dosha(s) are aggravated' },
  { key: 'sara', label: 'Sara (Tissue Excellence)', hint: 'Best developed dhatu' },
  { key: 'samhanana', label: 'Samhanana (Compactness)', hint: 'Slack / Medium / Firm' },
  { key: 'pramana', label: 'Pramana (Measurements)', hint: 'Small / Medium / Large build' },
  { key: 'satmya', label: 'Satmya (Adaptability)', hint: 'Poor / Moderate / Excellent' },
  { key: 'vaya', label: 'Vaya (Age)', hint: 'Balya (<16) / Madhya (16-60) / Jirna (>60)' },
  { key: 'aharaShakti', label: 'Ahara Shakti (Digestive Power)', hint: 'Weak / Moderate / Strong' },
  { key: 'vyayamaShakti', label: 'Vyayama Shakti (Exercise Capacity)', hint: 'Weak / Moderate / Strong' },
  { key: 'sattva', label: 'Sattva (Mental Strength)', hint: 'Sattva / Rajas / Tamas predominant' },
];

export function ConsultationFormModal({ visit, onClose }: ConsultationFormModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'complaints' | 'ashtvidha' | 'dashvidha' | 'nidan' | 'rx'>('complaints');

  const [chiefComplaints, setChiefComplaints] = useState<Array<{
    sanskritTerm: string;
    englishTerm: string;
    duration: string;
    remarks: string;
  }>>([{ sanskritTerm: '', englishTerm: '', duration: '', remarks: '' }]);

  const [pastHistory, setPastHistory] = useState('');
  const [vitals, setVitals] = useState({
    bp: '', pulse: '', temperature: '', weight: '', height: '', respRate: '', spo2: '',
  });

  const [ashtvidha, setAshtvidha] = useState<AshtvidhaPariksha>({
    nadi: '', mala: '', mutra: '', jihwa: '', shabda: '', sparsha: '', drika: '', akruti: '',
  });

  const [dashvidha, setDashvidha] = useState<DashvidhaPariksha>({
    prakriti: '', vikriti: '', sara: '', samhanana: '', pramana: '', satmya: '', vaya: '', aharaShakti: '', vyayamaShakti: '', sattva: '',
  });

  const [nidan, setNidan] = useState<NidanPanchak>({
    nidana: '', purvarupa: '', rupa: '', samprapti: '', upashaya: '',
  });

  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [investigations, setInvestigations] = useState('');
  const [notes, setNotes] = useState('');

  const addChiefComplaint = () => {
    setChiefComplaints((prev) => [...prev, { sanskritTerm: '', englishTerm: '', duration: '', remarks: '' }]);
  };

  const removeChiefComplaint = (index: number) => {
    setChiefComplaints((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChiefComplaint = (index: number, field: string, value: string) => {
    setChiefComplaints((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const tabs = [
    { id: 'complaints' as const, label: 'Complaints' },
    { id: 'ashtvidha' as const, label: 'Ashtvidha' },
    { id: 'dashvidha' as const, label: 'Dashvidha' },
    { id: 'nidan' as const, label: 'Nidan Panchak' },
    { id: 'rx' as const, label: 'Diagnosis' },
  ];

  const handleSubmit = () => {
    showToast('Consultation form saved successfully', 'success');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="OPD Consultation Form" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Patient Info */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-surface-900 dark:text-white">{visit.patientName}</span>
            <span className="text-surface-500">{visit.doctorName}</span>
          </div>
          <div className="text-xs text-surface-500 mt-1">{new Date().toLocaleDateString('en-IN')}</div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors min-h-[40px] ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Chief Complaints
              </label>
              {chiefComplaints.map((cc, idx) => (
                <div key={idx} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg space-y-2 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Sanskrit Term"
                      value={cc.sanskritTerm}
                      onChange={(e) => updateChiefComplaint(idx, 'sanskritTerm', e.target.value)}
                      placeholder="e.g. Shiro Shoola"
                    />
                    <Input
                      label="English Term"
                      value={cc.englishTerm}
                      onChange={(e) => updateChiefComplaint(idx, 'englishTerm', e.target.value)}
                      placeholder="e.g. Headache"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Duration"
                      value={cc.duration}
                      onChange={(e) => updateChiefComplaint(idx, 'duration', e.target.value)}
                      placeholder="e.g. 3 months"
                    />
                    <Input
                      label="Remarks"
                      value={cc.remarks}
                      onChange={(e) => updateChiefComplaint(idx, 'remarks', e.target.value)}
                      placeholder="Any additional notes"
                    />
                  </div>
                  {chiefComplaints.length > 1 && (
                    <button
                      onClick={() => removeChiefComplaint(idx)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addChiefComplaint} className="mt-2">
                + Add Complaint
              </Button>
            </div>

            <Textarea
              label="Past History"
              value={pastHistory}
              onChange={(e) => setPastHistory(e.target.value)}
              rows={2}
              placeholder="Previous illnesses, surgeries, medications..."
            />

            {/* Vitals */}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                Vitals
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  ['bp', 'BP (mmHg)', '120/80'],
                  ['pulse', 'Pulse', '72'],
                  ['temperature', 'Temp (°F)', '98.6'],
                  ['weight', 'Weight (kg)', '70'],
                ] as const).map(([key, label, ph]) => (
                  <Input
                    key={key}
                    label={label}
                    value={vitals[key]}
                    onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={ph}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {([
                  ['height', 'Height (cm)', '170'],
                  ['respRate', 'Resp Rate', '16'],
                  ['spo2', 'SpO2 (%)', '98'],
                ] as const).map(([key, label, ph]) => (
                  <Input
                    key={key}
                    label={label}
                    value={vitals[key]}
                    onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={ph}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ashtvidha' && (
          <div className="space-y-3">
            <p className="text-sm text-surface-500">
              Ashtavidha Pariksha — Eight-fold clinical examination
            </p>
            {ASHTVIDHA_FIELDS.map((field) => (
              <div key={field.key}>
                <Input
                  label={field.label}
                  value={ashtvidha[field.key]}
                  onChange={(e) => setAshtvidha((a) => ({ ...a, [field.key]: e.target.value }))}
                  placeholder={field.hint}
                />
                <p className="text-xs text-surface-400 mt-0.5">{field.hint}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dashvidha' && (
          <div className="space-y-3">
            <p className="text-sm text-surface-500">
              Dashvidha Pariksha — Ten-fold constitutional examination
            </p>
            {DASHVIDHA_FIELDS.map((field) => (
              <div key={field.key}>
                <Input
                  label={field.label}
                  value={dashvidha[field.key]}
                  onChange={(e) => setDashvidha((d) => ({ ...d, [field.key]: e.target.value }))}
                  placeholder={field.hint}
                />
                <p className="text-xs text-surface-400 mt-0.5">{field.hint}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'nidan' && (
          <div className="space-y-3">
            <p className="text-sm text-surface-500">
              Nidan Panchak — Five-fold diagnostic analysis
            </p>
            {([
              ['nidana', 'Nidana (Etiological Factors)', 'Causes — diet, lifestyle, stress, trauma...'],
              ['purvarupa', 'Purvarupa (Premonitory Symptoms)', 'Early signs before disease manifests'],
              ['rupa', 'Rupa (Cardinal Symptoms)', 'Main symptoms observed'],
              ['samprapti', 'Samprapti (Pathogenesis)', 'Doshic mechanism — Sthana, Samprapti, Dosha'],
              ['upashaya', 'Upashaya (Confirmatory Tests)', 'Diagnostic tests, therapeutic tests'],
            ] as const).map(([key, label, hint]) => (
              <Textarea
                key={key}
                label={label}
                value={nidan[key]}
                onChange={(e) => setNidan((n) => ({ ...n, [key]: e.target.value }))}
                rows={2}
                placeholder={hint}
              />
            ))}
          </div>
        )}

        {activeTab === 'rx' && (
          <div className="space-y-3">
            <Textarea
              label="Provisional Diagnosis"
              value={provisionalDiagnosis}
              onChange={(e) => setProvisionalDiagnosis(e.target.value)}
              rows={2}
              placeholder="Based on examination findings..."
            />
            <Textarea
              label="Investigations"
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              rows={2}
              placeholder="Lab tests, imaging, etc."
            />
            <Textarea
              label="Clinical Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional observations..."
            />
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Save Consultation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
