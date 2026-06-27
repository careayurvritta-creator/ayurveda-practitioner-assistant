export interface PatientChatPrompt {
  system: string;
  user: string;
}

export interface ClinicalDocsPrompt {
  system: string;
  user: string;
}

export interface TreatmentProtocolPrompt {
  system: string;
  user: string;
}

export const PATIENT_SAFETY_PREAMPLE = `You are an Ayurvedic health information assistant. You are NOT a doctor. You do NOT diagnose, prescribe, or treat medical conditions.

SAFETY RULES:
- Never diagnose or tell someone they have a specific disease.
- Never recommend specific medication dosages or treatments without a qualified practitioner's supervision.
- Always advise consulting a qualified Ayurvedic practitioner or allopathic doctor for diagnosis and treatment.
- Be respectful, culturally sensitive, and supportive.
- If someone describes emergency symptoms, advise seeking emergency care immediately.

IMPORTANT: Your responses are for informational purposes only and are based on classical Ayurvedic texts and knowledge.`;

export const DOCTOR_DISCLAIMER = `Note: This AI-generated guidance is for reference only. All recommendations must be validated by the supervising Ayurvedic physician before application to patients.`;

export function buildPatientChatPrompt(context: string, history: Array<{ role: string; content: string }>, currentMessage: string): PatientChatPrompt {
  const system = `${PATIENT_SAFETY_PREAMPLE}

KNOWLEDGE CONTEXT:
${context}

Remember: You are an information resource only. Always suggest consulting an Ayurvedic practitioner.`;

  const historyText = history.length > 0
    ? `\nCONVERSATION HISTORY:\n${history.map(h => `${h.role === 'user' ? 'Patient' : 'Assistant'}: ${h.content}`).join('\n')}\n`
    : '';

  return {
    system,
    user: `${historyText}Patient: ${currentMessage}\nAssistant:`,
  };
}

export function buildClinicalDocsPrompt(context: string, caseData: Record<string, any>, docType: string): ClinicalDocsPrompt {
  const system = `You are an Ayurvedic clinical documentation assistant. Generate professional clinical documents for Ayurvedic physicians.
${DOCTOR_DISCLAIMER}

Document type: ${docType}
Format: SOAP-style (Subjective, Objective, Assessment, Plan) adapted for Ayurvedic practice.

KNOWLEDGE CONTEXT:
${context}

Generate a professional clinical document. Include classical references where relevant.`;

  const caseText = Object.entries(caseData)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');

  return {
    system,
    user: `Generate a ${docType} for the following case:\n${caseText}`,
  };
}

export function buildTreatmentProtocolPrompt(
  context: string,
  diagnosis: string,
  patientSummary: string,
  severity: string,
  chronicity: string,
  researchArticles: Array<{ title: string; abstract: string; source: string; url: string; year: number }>
): TreatmentProtocolPrompt {
  const researchSection = researchArticles.length > 0
    ? `\nMODERN RESEARCH REFERENCES:\n${researchArticles.map((a, i) => `[${i + 1}] ${a.title} (${a.source}, ${a.year}) — ${a.url}\n${a.abstract || 'Abstract not available.'}`).join('\n\n')}`
    : '\nMODERN RESEARCH REFERENCES: No research articles found for this condition. Use classical knowledge only.';

  const system = `You are an Ayurvedic treatment protocol assistant for qualified Ayurvedic physicians.
${DOCTOR_DISCLAIMER}

Generate a comprehensive, detailed treatment protocol with the following sections:

1. CLASSICAL REFERENCE — Sanskrit verse + translation + Charak/Sushruta location
2. SAMPRAPTI (PATHOGENESIS) — dosha/dushya/srotas analysis
3. TREATMENT APPROACH — Shodhana / Shamana / Rasayana plan
4. HERBAL INTERVENTIONS — herb, form, dosage, duration, anupana
5. PANCHAKARMA — procedures, sequence, duration, when indicated
6. PATHYA-APATHYA — diet and regimen do/don't list
7. MODERN EVIDENCE — summary of retrieved research papers, each cited [n]
8. EXPECTED OUTCOMES + FOLLOW-UP — milestones, review schedule, red flags

Be extensive and detailed. Reference classical texts (Charak Samhita, Sushruta Samhita) where applicable.

KNOWLEDGE CONTEXT:
${context}
${researchSection}`;

  return {
    system,
    user: `Provisional Diagnosis: ${diagnosis}
Patient Summary: ${patientSummary || 'Not provided'}
Severity: ${severity || 'Not specified'}
Chronicity: ${chronicity || 'Not specified'}

Generate a comprehensive treatment protocol.`,
  };
}