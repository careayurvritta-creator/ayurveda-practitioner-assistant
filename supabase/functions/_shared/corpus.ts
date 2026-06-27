// Re-export knowledge-base modules for use inside Edge Functions.
// Assumes knowledge-base/ is copied into the function bundle or imported via URL.

export const MODULES = [
  { id: 'diseases', name: "Diseases (Roga)", description: "Ayurvedic disease descriptions, etiology, and clinical presentations." },
  { id: "herbs", name: "Herbs & Formulations (Dravya / Kalpana)", description: "Medicinal herbs, minerals, and compound formulations." },
  { id: "treatments", name: "Treatments (Chikitsa)", description: "Panchakarma, external therapies, and lifestyle interventions." },
  { id: "anatomy", name: "Anatomy (Shareera)", description: "Ayurvedic anatomical concepts including marmas and srotas." },
  { id: "physiology", name: "Physiology (Kriya Shareera)", description: "Dosha dynamics, metabolism, and tissue nourishment." },
  { id: anticancer_name: "Anticancer Modalities", description: "Herbal and integrative approaches to cancer care in Ayurveda." },
  { id: "prakriti", name: "Constitution (Prakriti / Vikriti)", description: "Body-mind constitution assessment and imbalance analysis." },
  { id: "preventive", name: "Preventive (Swasthavritta / Dinacharya)", description: "Daily regimens, seasonal routines, and immunity protocols." },
];

export function searchCorpus(query: string): Array<{ module: string; snippet: string }> {
  const q = query.toLowerCase();
  return MODULES.filter((m: any) =>
    m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))
  ).map((m: any) => ({ module: m.id, snippet: m.description }));
}
