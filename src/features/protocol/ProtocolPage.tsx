import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { usePatients } from '../../contexts/PatientContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { Markdown } from '../../components/markdown/Markdown';
import { Check, ArrowLeft, ArrowRight, Download, Copy, CheckCircle2, RotateCcw } from 'lucide-react';

const CORE_QUESTIONS = [
  { key: 'prakriti', label: 'Prakriti (Constitution)', placeholder: 'e.g., Vata-Pitta' },
  { key: 'vikriti', label: 'Vikriti (Current Imbalance)', placeholder: 'e.g., Pitta aggravation' },
  { key: 'agni', label: 'Agni (Digestive Fire)', placeholder: 'e.g., Tikshnagni (sharp)' },
  { key: 'koshta', label: 'Koshta (Bowel Habits)', placeholder: 'e.g., Vishama (irregular)' },
  { key: 'satmya', label: 'Satmya (Adaptability)', placeholder: 'e.g., Average adaptability' },
  { key: 'sara', label: 'Sara (Tissue Quality)', placeholder: 'e.g., Good tissue elasticity' },
  { key: 'pramana', label: 'Pramana (Measurements)', placeholder: 'e.g., Medium build' },
];

const STEP_LABELS = ['Patient Info', 'Assessment', 'Generate'];

export default function ProtocolPage() {
  const {
    currentStep,
    patientData,
    answers,
    generatedProtocol,
    isGenerating,
    setStep,
    updatePatientData,
    addAnswer,
    generateProtocol,
    reset,
  } = useProtocol();
  const { selectedPatient, setSelectedPatientId } = usePatients();

  const [copied, setCopied] = React.useState(false);
  const [dynamicQuestions, setDynamicQuestions] = React.useState<string[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (selectedPatient) {
      updatePatientData({
        name: selectedPatient.name,
        age: String(selectedPatient.age),
        gender: selectedPatient.gender,
      });
      setSelectedPatientId(selectedPatient.id);
    }
  }, [selectedPatient, updatePatientData, setSelectedPatientId]);

  const answeredCount = CORE_QUESTIONS.filter((q) => answers[q.key as keyof typeof answers]).length;
  const progress = Math.round((answeredCount / CORE_QUESTIONS.length) * 100);

  const handleGenerate = async () => {
    await generateProtocol();
    setStep(3);
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(generatedProtocol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedProtocol;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedProtocol], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol-${patientData.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator */}
      <div className="px-4 py-4 border-b border-surface-100 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEP_LABELS.map((label, idx) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > idx + 1
                        ? 'bg-primary-600 text-white'
                        : currentStep === idx + 1
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-600'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                    }`}
                  >
                    {currentStep > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    currentStep === idx + 1 ? 'text-primary-600' : 'text-surface-500'
                  }`}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 ${
                    currentStep > idx + 1 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          {currentStep === 2 && (
            <div className="w-full bg-surface-100 dark:bg-surface-800 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Step 1: Patient Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Patient Information
              </h2>
              <Input
                label="Patient Name"
                value={patientData.name}
                onChange={(e) => updatePatientData({ name: e.target.value })}
                placeholder="Enter patient name"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  value={patientData.age}
                  onChange={(e) => updatePatientData({ age: e.target.value })}
                  placeholder="Age"
                  min="0"
                  max="150"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                    Gender
                  </label>
                  <select
                    value={patientData.gender}
                    onChange={(e) => updatePatientData({ gender: e.target.value })}
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
                  Chief Complaint
                </label>
                <textarea
                  value={patientData.chiefComplaint}
                  onChange={(e) => updatePatientData({ chiefComplaint: e.target.value })}
                  placeholder="Describe the main health concern..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder-surface-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Assessment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Clinical Assessment
              </h2>
              <p className="text-sm text-surface-500 mb-4">
                Answer these questions to help build a comprehensive treatment protocol.
              </p>

              {CORE_QUESTIONS.map((q) => (
                <Input
                  key={q.key}
                  label={q.label}
                  value={answers[q.key as keyof typeof answers]}
                  onChange={(e) => addAnswer(q.key, e.target.value)}
                  placeholder={q.placeholder}
                />
              ))}

              {dynamicQuestions.length > 0 && (
                <>
                  <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                    <p className="text-sm font-medium text-primary-600 mb-3">
                      Follow-up questions based on your answers:
                    </p>
                  </div>
                  {dynamicQuestions.map((q) => (
                    <Input
                      key={q}
                      label={q}
                      value={dynamicAnswers[q] || ''}
                      onChange={(e) => setDynamicAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                      placeholder="Your answer"
                    />
                  ))}
                </>
              )}

              {answeredCount >= 5 && dynamicQuestions.length === 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setDynamicQuestions(['Any seasonal aggravating factors?', 'Current medications?'])}
                  className="w-full"
                >
                  + Add follow-up questions
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Generate & Output */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {generatedProtocol ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                      Treatment Protocol
                    </h2>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCopy}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <Markdown content={generatedProtocol} />
                  </div>

                  <Button
                    variant="secondary"
                    onClick={reset}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Start New Protocol
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  {isGenerating ? (
                    <div className="space-y-4">
                      <Spinner size="lg" />
                      <p className="text-surface-500">Generating treatment protocol...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                        Ready to Generate
                      </h2>
                      <p className="text-sm text-surface-500 max-w-md mx-auto">
                        Review the patient information and assessment answers, then generate a comprehensive Ayurvedic treatment protocol.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && !generatedProtocol && (
            <Button
              variant="secondary"
              onClick={() => setStep(currentStep - 1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}

          {currentStep < 3 && (
            <Button
              onClick={() => setStep(currentStep + 1)}
              className="flex-1"
              disabled={currentStep === 1 && !patientData.name}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {currentStep === 3 && !generatedProtocol && (
            <Button
              onClick={handleGenerate}
              loading={isGenerating}
              className="flex-1"
              disabled={isGenerating}
            >
              Generate Protocol
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
