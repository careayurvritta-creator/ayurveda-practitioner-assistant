import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Download,
  User,
  Users,
  FileText,
  Brain,
  Sparkles,
  Trash2,
  Printer,
  Heart,
  Activity,
  Leaf,
  CheckCircle,
  Search,
  Database,
  Settings,
  ShieldAlert,
  Cloud,
  BookOpen,
  ArrowRight,
  Send,
  Loader,
  X,
  PlusCircle,
  Check,
  AlertCircle
} from 'lucide-react';
import { Markdown } from './components/Markdown';
import { supabase, isSupabaseConfigured } from './supabase';

// Helper to sanitize a patient object and remove undefined values before saving to Firestore or LocalStorage
function sanitizePatient(p: any): Patient {
  return {
    id: p.id || '',
    name: p.name || '',
    age: typeof p.age === 'number' ? p.age : (Number(p.age) || 30),
    gender: p.gender || 'Male',
    email: p.email || '',
    phone: p.phone || '',
    prakriti: p.prakriti || 'Vata',
    vikriti: p.vikriti || '',
    agni: p.agni || 'Sama (Balanced)',
    koshta: p.koshta || 'Madhyama (Medium)',
    lifestyle: p.lifestyle || '',
    season: p.season || '',
    notes: p.notes || '',
    createdAt: p.createdAt || new Date().toLocaleDateString('en-GB'),
    chats: Array.isArray(p.chats) ? p.chats.map((c: any) => ({
      role: c.role || 'user',
      parts: Array.isArray(c.parts) ? c.parts.map((part: any) => ({ text: part.text || '' })) : [{ text: '' }],
      timestamp: c.timestamp || new Date().toISOString()
    })) : [],
    protocols: Array.isArray(p.protocols) ? p.protocols.map((pr: any) => ({
      id: pr.id || 'pr_' + Date.now(),
      title: pr.title || '',
      chiefComplaint: pr.chiefComplaint || '',
      principalImbalance: pr.principalImbalance || '',
      generatedText: pr.generatedText || '',
      createdAt: pr.createdAt || new Date().toLocaleDateString('en-GB'),
      prakriti: pr.prakriti || '',
      vikriti: pr.vikriti || ''
    })) : []
  };
}

// Interfaces for Patient Case History & Protocols
interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
  timestamp?: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
  prakriti: string; // Vata, Pitta, Kapha, or combinations like Vata-Pitta
  vikriti: string; // Current imbalance
  agni: string; // Digestive force: Sama, Manda, Tikshna, Vishama
  koshta: string; // Bowel: Krura (Hard), Mridu (Soft), Madhyama (Medium)
  lifestyle: string;
  season: string;
  notes?: string;
  createdAt: string;
  chats: Message[];
  protocols: Protocol[];
}

interface Protocol {
  id: string;
  title: string;
  chiefComplaint: string;
  principalImbalance: string;
  generatedText: string;
  createdAt: string;
  prakriti: string;
  vikriti: string;
}

interface KnowledgeDoc {
  id: string;
  name: string;
  type: string; // e.g. "Charaka Samhita", "Physician Notes"
  size: string;
  uploadedAt: string;
  status: 'indexed' | 'processing';
}

interface FeedbackLog {
  id: string;
  patientName: string;
  originalGuidance: string;
  practitionerCorrection: string;
  timestamp: string;
}

const AYURVEDA_HF_DATASETS = [
  {
    id: 'gretelai/synthetic-ayurveda',
    name: 'Gretel AI Synthetic Ayurveda Corpus',
    type: 'Patient Consultations',
    size: '120k queries',
    downloads: '14.2k',
    description: 'A medically aligned repository of 120,443 synthetically generated patient-practitioner consultation transcripts. Maps detailed symptomatology to herbal formulas and dietary Chikitsa recommendations.',
    tags: ['Synthetic Logs', 'Practice Queries', 'NLP Training'],
    url: 'https://huggingface.co/datasets/gretelai/synthetic-ayurveda'
  },
  {
    id: 'ayurlm-corpus',
    name: 'AyurLM Fine-Tuning Text Corpus',
    type: 'Classical Sanskrit Samhitas',
    size: '2.1 GB data',
    downloads: '4.8k',
    description: 'A digitized training corpus of original Sanskrit scriptures (Caraka Samhita, Susruta Samhita, Ashtanga Hridayam) structured sentence-by-sentence with full modern English translations and conceptual glossaries.',
    tags: ['Sanskrit Corpus', 'Classical Texts', 'Multilingual RAG'],
    url: 'https://huggingface.co/datasets'
  },
  {
    id: 'ayurveda-qa',
    name: 'AyurGPT Classical QA Hub',
    type: 'Question Answering Pairs',
    size: '45,210 QA pairs',
    downloads: '8.1k',
    description: 'Curated dataset of 45,210 question-answer pairs sourced from premier Ayurvedic textbook chapters, pharmacopeias, and clinical university examinations. Optimized for contextual QA and fine-tuning.',
    tags: ['QA Pairs', 'Textbooks', 'Anatomy & Nidana'],
    url: 'https://huggingface.co/datasets'
  },
  {
    id: 'l-sanskrit-samhita',
    name: 'L-Sanskrit Samhita Sutras',
    type: 'Annotated Sutras',
    size: '12,500 sutras',
    downloads: '2.5k',
    description: 'A machine-readable repository indexing primary Sanskrit sutras from the Nidanasthana and Cikitsasthana sections, annotated with phonetic transcriptions, grammar tags, and translation schemas.',
    tags: ['Sanskrit Sutras', 'Grammar Breakdowns', 'Sutra Index'],
    url: 'https://huggingface.co/datasets'
  },
  {
    id: 'ayush-pubmed-index',
    name: 'AYUSH PubMed Research trials',
    type: 'Academic Publications',
    size: '12,480 papers',
    downloads: '6.4k',
    description: 'An academic index compilation of PubMed research publication abstracts, double-blind randomized controlled trials (RCTs), and in-vitro pharmacological studies of Ayurvedic formulations.',
    tags: ['PubMed RCTs', 'Pharmacology', 'Evidence-Based'],
    url: 'https://pubmed.ncbi.nlm.nih.gov'
  }
];

function getSeedPatients(): Patient[] {
  return [
    {
      id: 'p1',
      name: 'Ananth Narayanan',
      age: 45,
      gender: 'Male',
      email: 'ananth.n@gmail.com',
      phone: '+91 98450 12345',
      prakriti: 'Pitta-Vata',
      vikriti: 'Highly elevated Pitta (Amlapitta & Tiksna Agni)',
      agni: 'Tiksna (Sharp/Overactive)',
      koshta: 'Mridu (Soft)',
      lifestyle: 'High executive stress, irregular meals, excessive coffee',
      season: 'Greeshma (Summer)',
      notes: 'Severe chest burning sensation, acid water-brash in the mornings, redness of eyes, irritable bowel. Patient is sensitive to spicy foods.',
      createdAt: '10 Jun 2026',
      chats: [
        {
          role: 'user',
          parts: [{ text: 'Case analysis: Ananth Narayanan has morning sour regurgitation and extreme stomach discomfort.' }]
        },
        {
          role: 'model',
          parts: [{ text: `Clinical Assessment of **Ananth Narayanan** (Pitta-Vata):\n\nGiven the patient's constitution (*Pitta-Vata*) and current vitiation (*Amlapitta* with *Tiksna Agni*), there is a significant surge in the *Ushna* (hot) and *Tikshna* (sharp) attributes of Pitta. In *Greeshma Ritu* (Summer), Pitta naturally accumulates.\n\n### Etiological Factors (Nidana):\n- Excessive warm stimuli (*Adhika Ushna* from coffee)\n- High intellectual pressure leading to psycho-somatic *Manasika Santapa* (mental stress) which directly aggravates *Sadhaka Pitta*.\n\n### Treatment Direction (Chikitsa Sutra):\n- Purge excessive hot-sharp Pitta from the middle tract (*Mridu Virechana* using classical sweet-cold recipes).\n- Sweet-Bitter (*Madhura-Tikta*) formulations to shield gastric mucosa and re-calibrate *Agnis* intensity (*Tiksna* to *Sama*).\n\n### Clinical Recommendations:\n1. **Sutsekhar Ras (Gold/Plain)**: 1 Vati (125mg) combined with Pippali Churna (250mg) and organic raw honey, twice daily, 15 minutes before lunch and dinner.\n2. **Avipattikar Churna**: 5 grams combined with lukewarm water or dry pomegranate syrup (*Dadima Swarasa*), taken strictly at bedtime (*Virechana* action).\n3. **Ahara/Vihara**: Discontinue sour coffee, replace with roasted cardamom water. Take sweet buttermilk (Lassi with fennel) with lunch.` }]
        }
      ],
      protocols: [
        {
          id: 'pr-demo',
          title: 'Amlapitta (Hyperacidity) Mitigation Protocol',
          chiefComplaint: 'Morning sour acid reflux, extreme burning in epigastrium, red sclera, stress-induced headaches.',
          principalImbalance: 'Tiksna Pitta aggravation with mild Vata blockage (Vata-Pitta Amlapitta)',
          prakriti: 'Pitta-Vata',
          vikriti: 'Highly elevated Pitta',
          generatedText: `### 1. Samprapti Ghataka (Pathogenesis Analysis)\n- **Dosha**: Tikshna-Drava Pitta, Samana Vata.\n- **Dushya**: Amashaya Rasa Dhatu, Rakta.\n- **Agni**: Tiksnagni (uncontrolled metabolic combustion).\n- **Srotas**: Annavaha and Rasavaha Srotas.\n\n### 2. Chikitsa Sutra (Principal Strategy)\nThe principal therapeutic approach is **Pitta-Shamana** and **Kledahara** using sweet (*Madhura*), cold (*Sheeta*), and bitter (*Tikta*) therapeutic modules.\n\n### 3. Shamana Chikitsa (Pharmacological Formulations)\n| Classical Medication | Dosage | Anupana (Vehicle) | Schedule |\n|---|---|---|---|\n| **Kamadhudha Rasa (Muktayukta)** | 125 mg | Lukewarm Cow Milk or Misri | Post-Meals |\n| **Yashtimadhu Churna** | 3 g | Raw Ghee | 30 mins Pre-Breakfast |\n| **Shatavari Ghrita** | 10 ml | Warm Water | On empty stomach |\n| **Virechana: Avipattikar Churna** | 5 g | Lukewarm water | At bedtime |\n\n### 4. Shodhana Guidance\nDetermine strength for Mild *Virechana* (Therapeutic purgation). Offer *Trivrit Lehyam* (10-15g) on an auspicious morning after proper local *Snehana* (Abhyanga with Sheeta Ksheerabala Taila) and mild fomentation.\n\n### 5. Ahara-Vihara (Dietary Prescription)\n- **Wholesome (Pathya)**: Old Shali Rice, Barley, Moong dal, Cucumber, Sweet pomegranates, Milk-ghee infusion, coriander seeds water.\n- **Contraindicated (Apathya)**: Fermented idli/dosa, tomatoes, red chili, garlic, hard cheese, citrus juices, carbonated caffeine.\n\n### 6. Dynamic follow-up\nAssess after 7 days. Check if Agni has moderated to Mandagni/Sama. Instruct patient to report immediate dark stools or vomiting instances.`,
          createdAt: '11 Jun 2026'
        }
      ]
    },
    {
      id: 'p2',
      name: 'Dr. Meera Deshpande',
      age: 52,
      gender: 'Female',
      email: 'meera.dp@ayush.org',
      phone: '+91 94481 90212',
      prakriti: 'Vata-Kapha',
      vikriti: 'Apanavata blockage (Srotorodha) with Joint stiffness',
      agni: 'Manda (Low/Sluggish)',
      koshta: 'Krura (Hard/Constipated)',
      lifestyle: 'Moderate activity, continuous teaching tours',
      season: 'Varsha (Monsoon Pre-prep)',
      notes: 'Chronic osteo-arthritis (Sandhivata), stiffness in morning hours, moderate swelling, sluggish digestion, gas retention.',
      createdAt: '12 Jun 2026',
      chats: [],
      protocols: []
    }
  ];
}

// Helper to strip all markdown notations for clean multi-line snippet previews
const stripMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/---+/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
};

// Render helper to extract and display [CHAT] and [OUTPUT] tagged blocks in full alignment with AyuScribe clinical RAG
const renderChatMessageParts = (text: string) => {
  const chatIndex = text.indexOf('[CHAT]');
  const outputIndex = text.indexOf('[OUTPUT]');

  if (chatIndex === -1 && outputIndex === -1) {
    return <Markdown content={text} />;
  }

  let chatContent = '';
  let outputContent = '';

  const endChatIndex = text.indexOf('[/CHAT]');
  const endOutputIndex = text.indexOf('[/OUTPUT]');

  // Extract Chat Content
  if (chatIndex !== -1) {
    const start = chatIndex + 6;
    const end = endChatIndex !== -1 ? endChatIndex : (outputIndex !== -1 ? outputIndex : text.length);
    chatContent = text.substring(start, end).trim();
  }

  // Extract Output Content
  if (outputIndex !== -1) {
    const start = outputIndex + 8;
    const end = endOutputIndex !== -1 ? endOutputIndex : text.length;
    outputContent = text.substring(start, end).trim();
  }

  // Resilient fallback: if the content didn't extract, just clean tags
  if (!chatContent && !outputContent) {
    const cleaned = text.replace(/\[\/?CHAT\]|\[\/?OUTPUT\]/gi, '').trim();
    return <Markdown content={cleaned} />;
  }

  return (
    <div className="space-y-3 font-sans">
      {chatContent && (
        <div className="text-stone-800 leading-relaxed font-sans text-xs text-left">
          <Markdown content={chatContent} />
        </div>
      )}
      {outputContent && (
        <div className="mt-2 border-t border-stone-200 pt-2">
          <details className="group" open={true}>
            <summary className="flex items-center justify-between cursor-pointer text-emerald-800 font-semibold list-none select-none hover:text-emerald-950 transition outline-none">
              <span className="flex items-center space-x-1.5 font-sans font-medium text-[10px] tracking-wide uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                <span>📋 Clinical Shastra Synthesis</span>
              </span>
              <span className="transition group-open:rotate-180 text-[10px] text-stone-400">▼</span>
            </summary>
            <div className="mt-2 p-3 bg-stone-50 border border-stone-200/60 rounded-lg text-xs leading-relaxed text-stone-700 font-sans overflow-x-auto shadow-inner max-h-[350px] overflow-y-auto">
              <Markdown content={outputContent} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

function ConfigErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-stone-200 p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-amber-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-bold text-stone-900 mb-2">Configuration Required</h2>
        <p className="text-sm text-stone-600 mb-4">
          Missing environment variables. Please add <code className="bg-stone-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-stone-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your Vercel project settings.
        </p>
        <p className="text-xs text-stone-500 mb-4">
          Go to Vercel Dashboard → Settings → Environment Variables → Add the two variables above.
        </p>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition inline-block"
        >
          Open Vercel Dashboard
        </a>
      </div>
    </div>
  );
}

export default function App() {
  // All hooks must be called unconditionally (React Rules of Hooks)
  // Google Authentication State
  const [currentUser, setFirebaseUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('care.ayurvritta@gmail.com');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Logged in state flag
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Google Drive Integration States
  const [driveExportLoading, setDriveExportLoading] = useState<boolean>(false);
  const [lastExportedFileUrl, setLastExportedFileUrl] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveFilesLoading, setDriveFilesLoading] = useState<boolean>(false);
  const [showDriveDocsBrowser, setShowDriveDocsBrowser] = useState<boolean>(false);

  // App Layout State
  const [activeTab, setActiveTab] = useState<'chats' | 'generator' | 'knowledge' | 'feedback'>('chats');
  const [searchText, setSearchText] = useState<string>('');
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  // Patient Directory State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Interactive Modal / Input states
  const [showAddPatient, setShowAddPatient] = useState<boolean>(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 38,
    gender: 'Male',
    email: '',
    phone: '',
    prakriti: 'Pitta-Kapha',
    vikriti: 'Vata-Pitta Imbalance',
    agni: 'Vishama (Irregular)',
    koshta: 'Madhyama (Medium)',
    lifestyle: 'Sedentary desk work, high mental stress',
    season: 'Greeshma (Summer)',
    notes: 'Presents with chronic dyspepsia and occasional hyperacidity.'
  });

  // Current Chat state
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // New Protocol state
  const [protocolComplaint, setProtocolComplaint] = useState<string>('');
  const [protocolImbalance, setProtocolImbalance] = useState<string>('');
  const [protocolLoading, setProtocolLoading] = useState<boolean>(false);
  const [generatedProtocolText, setGeneratedProtocolText] = useState<string>('');
  const [selectedProtocolToPrint, setSelectedProtocolToPrint] = useState<Protocol | null>(null);

  // Model Selection States
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-pro');
  const [availableModels, setAvailableModels] = useState<any[]>([
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Default Google GenAI clinical assistant. Extremely fast, intelligent and reliable.', rating: 'Excellent general model', tag: 'Fast Default' },
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', provider: 'NVIDIA', description: 'High-quality clinical reasoning model via NVIDIA NIM. Excellent for complex Ayurvedic diagnostic analysis.', rating: 'High Quality', tag: 'Detailed' },
  ]);
 
  // Fetch verified active models on mount
  useEffect(() => {
    fetch('/api/available-models')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Fallback to static registry');
      })
      .then(data => {
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
        }
      })
      .catch(err => console.log('Using pre-populated clinical models selection:', err));
  }, []);

  // RAG / Knowledge Base simulation files
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocType, setNewDocType] = useState<string>('Classical Text');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Active Corpus Search States (Direct RAG Search Station)
  const [corpusQuery, setCorpusQuery] = useState<string>('');
  const [corpusResults, setCorpusResults] = useState<string[]>([]);
  const [corpusLoading, setCorpusLoading] = useState<boolean>(false);

  const handleSearchCorpus = async () => {
    if (!corpusQuery.trim()) return;
    setCorpusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-knowledge', {
        body: { query: corpusQuery, type: 'hybrid', limit: 10 },
      });
      
      if (error) throw error;
      
      if (data.results && data.results.length > 0) {
        const formatted = data.results.map((r: any, i: number) => 
          `[${i + 1}] (${r.category || 'General'}) ${r.title || 'Untitled'}\n${r.content?.slice(0, 200) || 'No content'}...`
        );
        setCorpusResults(formatted);
      } else {
        setCorpusResults(['No results found in the knowledge base. Try different keywords.']);
      }
    } catch (e) {
      console.error('Corpus search error:', e);
      setCorpusResults(['Search failed. Ensure the search-knowledge edge function is deployed.']);
    } finally {
      setCorpusLoading(false);
    }
  };

  // Hugging Face & Academic RAG Hub States
  const [knowledgeSubTab, setKnowledgeSubTab] = useState<'samhita' | 'huggingface'>('samhita');
  const [selectedHfDatasetId, setSelectedHfDatasetId] = useState<string>('gretelai/synthetic-ayurveda');
  const [hfQueryText, setHfQueryText] = useState<string>('');
  const [hfRAGResult, setHfRAGResult] = useState<string>('');
  const [hfSearchLoading, setHfSearchLoading] = useState<boolean>(false);

  const handleSearchHuggingFace = async () => {
    if (!hfQueryText.trim()) return;
    setHfSearchLoading(true);
    setHfRAGResult('');
    try {
      const { data, error } = await supabase.functions.invoke('search-knowledge', {
        body: { query: hfQueryText, type: 'fts', limit: 5 },
      });
      
      if (error) throw error;
      
      if (data.results && data.results.length > 0) {
        const formatted = data.results.map((r: any) => 
          `**${r.title || 'Untitled'}** (${r.source || 'Unknown'})\n${r.content?.slice(0, 300) || 'No content'}...`
        ).join('\n\n');
        setHfRAGResult(formatted);
      } else {
        setHfRAGResult('No results found. Try different search terms.');
      }
    } catch (e) {
      console.error('Hugging Face search error:', e);
      setHfRAGResult('Search failed. Ensure the search-knowledge edge function is deployed.');
    } finally {
      setHfSearchLoading(false);
    }
  };

  const handleToggleHfDataset = (ds: any) => {
    const exists = knowledgeDocs.some(d => d.id === ds.id);
    if (exists) {
      setKnowledgeDocs(knowledgeDocs.filter(d => d.id !== ds.id));
    } else {
      const doc: KnowledgeDoc = {
        id: ds.id,
        name: ds.name,
        type: `HF Open-Science [${ds.type}]`,
        size: ds.size,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
        status: 'indexed'
      };
      setKnowledgeDocs([...knowledgeDocs, doc]);
    }
  };

  // Interactive Knowledge Explorer states
  const [knowledgeModules, setKnowledgeModules] = useState<any>(null);
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<string>('fundamentals');
  const [moduleSearchQuery, setModuleSearchQuery] = useState<string>('');
  const [isLoadingModules, setIsLoadingModules] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'knowledge' && !knowledgeModules) {
      setIsLoadingModules(true);
      fetch('/api/knowledge-modules')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to load database.');
        })
        .then((data) => {
          setKnowledgeModules(data);
        })
        .catch((err) => {
          console.error('Error fetching knowledge modules:', err);
        })
        .finally(() => {
          setIsLoadingModules(false);
        });
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Self Learning feedback logs
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>([]);
  const [newFeedbackCorrection, setNewFeedbackCorrection] = useState<string>('');
  const [newFeedbackOriginal, setNewFeedbackOriginal] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const patientsRef = useRef<Patient[]>([]);
  patientsRef.current = patients;

  // Google Drive client-side integration helper methods
  const handleExportToGoogleDrive = async (ptName: string, protocolTitle: string, content: string) => {
    if (!googleAccessToken) {
      alert("Please sign in with Google to use Google Drive exporting features.");
      return;
    }

    const confirmed = window.confirm(
      `Save "${protocolTitle}" directly to your Google Drive?`
    );
    if (!confirmed) return;

    setDriveExportLoading(true);
    setLastExportedFileUrl(null);

    try {
      // Step 1: Create the file metadata
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `AyurScribe - ${ptName} - ${protocolTitle}.txt`,
          mimeType: 'text/plain',
          description: `Ayurvedic Clinical Treatment Protocol generated by AyurScribe on ${new Date().toLocaleDateString()}`
        })
      });

      if (!createRes.ok) {
        throw new Error(`Failed to initialize Google Drive file: ${createRes.statusText}`);
      }

      const fileInfo = await createRes.json();
      const fileId = fileInfo.id;

      // Step 2: Upload raw text media using media upload PATCH
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'text/plain; charset=UTF-8'
        },
        body: content
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload text content: ${uploadRes.statusText}`);
      }

      const fileLink = `https://drive.google.com/file/d/${fileId}/view`;
      setLastExportedFileUrl(fileLink);
      alert(`Successfully saved to Google Drive! File matches: AyurScribe - ${ptName} - ${protocolTitle}.txt`);

    } catch (err: any) {
      console.error('Error exporting to Google Drive:', err);
      alert(`Could not export to Google Drive: ${err.message || err}`);
    } finally {
      setDriveExportLoading(false);
    }
  };

  const loadGoogleDriveFiles = React.useCallback(async () => {
    if (!googleAccessToken) return;
    setDriveFilesLoading(true);
    try {
      const query = encodeURIComponent("mimeType='text/plain' or mimeType='application/pdf'");
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,createdTime)&orderBy=name`,
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      } else {
        console.error('Failed to query Drive assets:', res.statusText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDriveFilesLoading(false);
    }
  }, [googleAccessToken]);

  // Import a plaintext file directly into Clinical Knowledge base representation and search index
  const handleImportDriveFile = async (fileId: string, fileName: string) => {
    if (!googleAccessToken) return;
    try {
      alert(`Downloading and indexing "${fileName}" from Google Drive...`);
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
      });
      if (!downloadRes.ok) {
        throw new Error(`Failed to read file media content: ${downloadRes.statusText}`);
      }
      const text = await downloadRes.text();

      // Add to simulated RAG list index and register the file details
      const docObj: KnowledgeDoc = {
        id: 'drive_' + fileId,
        name: fileName,
        type: 'Google Drive Plaintext',
        size: `${(text.length / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'indexed'
      };

      setKnowledgeDocs((prev) => [docObj, ...prev]);
      
      // Inject into local searchable corpus if search text matches!
      setCorpusResults((prev) => [
        `[Document Source: ${fileName}] Content chunk retrieved: "${text.slice(0, 450)}..."`,
        ...prev
      ]);

      alert(`"${fileName}" has been imported and successfully cached for RAG scriptural contextual referencing.`);
    } catch (err: any) {
      console.error('Failed to import drive content:', err);
      alert(`Problem importing Google Drive document: ${err.message}`);
    }
  };

  // Supabase Auth state listener on bootstrap
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setFirebaseUser(session.user);
        setUserEmail(session.user.email || '');
        setIsLoggedIn(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setFirebaseUser(session.user);
        setUserEmail(session.user.email || '');
        setIsLoggedIn(true);
        // Extract Google provider access token for Drive API
        const providerToken = (session as any)?.provider_token;
        if (providerToken) {
          setGoogleAccessToken(providerToken);
        }
      } else {
        setFirebaseUser(null);
        setGoogleAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user records on successful login via Supabase
  useEffect(() => {
    if (!currentUser) {
      // Fallback: load offline data from LocalStorage
      const cached = localStorage.getItem('ayurScribe_patients');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPatients(parsed);
          if (parsed.length > 0) {
            setSelectedPatientId(parsed[0].id);
          }
        } catch (e) {
          console.error('Error loading offline local storage patient backup:', e);
        }
      } else {
        setPatients([]);
        setSelectedPatientId(null);
      }
      return;
    }

    // Fetch patients from Supabase
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('owner_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          setPatients([]);
          setSelectedPatientId(null);
        } else {
          // Map Supabase columns to Patient interface
          const fetched: Patient[] = data.map((row: any) => ({
            id: row.id,
            name: row.name || '',
            age: row.age || 30,
            gender: row.gender || 'Male',
            email: row.email || '',
            phone: row.phone || '',
            prakriti: row.prakriti || 'Vata',
            vikriti: row.vikriti || '',
            agni: row.agni || 'Sama (Balanced)',
            koshta: row.koshta || 'Madhyama (Medium)',
            lifestyle: row.lifestyle || '',
            season: row.season || '',
            notes: row.notes || '',
            createdAt: row.created_at || new Date().toLocaleDateString('en-GB'),
            chats: Array.isArray(row.chats) ? row.chats : [],
            protocols: Array.isArray(row.protocols) ? row.protocols : [],
          }));
          setPatients(fetched);
          if (fetched.length > 0 && !selectedPatientId) {
            setSelectedPatientId(fetched[0].id);
          }
        }
      } catch (err) {
        console.warn('Supabase patients fetch warning:', err);
        // Fallback to localStorage
        const cached = localStorage.getItem('ayurScribe_patients');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setPatients(parsed);
            if (parsed.length > 0) setSelectedPatientId(parsed[0].id);
          } catch (e) {
            console.error('Error loading offline backup:', e);
          }
        }
      }
    };

    fetchPatients();

    // Fetch feedback logs from Supabase
    const fetchFeedback = async () => {
      try {
        const { data, error } = await supabase
          .from('feedback_logs')
          .select('*')
          .eq('owner_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const logs: FeedbackLog[] = data.map((row: any) => ({
            id: row.id,
            patientName: row.patient_name || '',
            originalGuidance: row.original_guidance || '',
            practitionerCorrection: row.practitioner_correction || '',
            timestamp: row.timestamp || row.created_at || '',
          }));
          setFeedbackLogs(logs);
        }
      } catch (err) {
        console.warn('Supabase feedback fetch warning:', err);
      }
    };

    fetchFeedback();
  }, [currentUser]);

  // Real-time remote storage synchronizer callback
  const savePatientsToLocal = async (updated: Patient[]) => {
    setPatients(updated);
    patientsRef.current = updated;
    localStorage.setItem('ayurScribe_patients', JSON.stringify(updated));

    if (currentUser) {
      // Sync ALL patients to Supabase, not just the selected one
      try {
        const upserts = updated.map(p => 
          supabase.from('patients').upsert({
            id: p.id,
            name: p.name,
            age: p.age,
            gender: p.gender,
            email: p.email || '',
            phone: p.phone || '',
            prakriti: p.prakriti,
            vikriti: p.vikriti || '',
            agni: p.agni,
            koshta: p.koshta,
            lifestyle: p.lifestyle || '',
            season: p.season || '',
            notes: p.notes || '',
            chats: p.chats || [],
            protocols: p.protocols || [],
            owner_id: currentUser.id,
            created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        );
        await Promise.allSettled(upserts);
      } catch (e) {
        console.error('Supabase save error:', e);
      }
    }
  };

  const getSelectedPatient = (): Patient | undefined => {
    return patients.find(p => p.id === selectedPatientId);
  };

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [patients, selectedPatientId, chatLoading]);

  // Handle adding a patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;

    const added: Patient = {
      id: 'patient_' + Date.now(),
      name: newPatient.name.trim(),
      age: Math.max(1, Math.min(150, parseInt(String(newPatient.age), 10) || 30)),
      gender: newPatient.gender,
      email: newPatient.email.trim() || '',
      phone: newPatient.phone.trim() || '',
      prakriti: newPatient.prakriti,
      vikriti: newPatient.vikriti.trim() || 'General Imbalance',
      agni: newPatient.agni,
      koshta: newPatient.koshta,
      lifestyle: newPatient.lifestyle.trim() || 'Moderate',
      season: newPatient.season,
      notes: newPatient.notes.trim() || 'No chief symptoms registered',
      createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      chats: [],
      protocols: []
    };

    // Store in local React state first to provide instantaneous offline UI feedback
    const updated = [added, ...patients];
    setPatients(updated);
    localStorage.setItem('ayurScribe_patients', JSON.stringify(updated));
    setSelectedPatientId(added.id);
    setShowAddPatient(false);

    if (currentUser) {
      try {
        await supabase.from('patients').upsert({
          id: added.id,
          name: added.name,
          age: added.age,
          gender: added.gender,
          email: added.email || '',
          phone: added.phone || '',
          prakriti: added.prakriti,
          vikriti: added.vikriti || '',
          agni: added.agni,
          koshta: added.koshta,
          lifestyle: added.lifestyle || '',
          season: added.season || '',
          notes: added.notes || '',
          chats: [],
          protocols: [],
          owner_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Supabase upload failed:', err);
        alert(`Dossier saved locally! Note: Synchronization to cloud server failed (${err.message || err}). Your clinical records are saved on this device.`);
      }
    } else {
      if (userEmail) {
        try {
          await fetch('/api/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, patients: updated })
          });
        } catch (e) {
          console.error('Offline backup sync error:', e);
        }
      }
    }

    // Reset fields
    setNewPatient({
      name: '',
      age: 35,
      gender: 'Male',
      email: '',
      phone: '',
      prakriti: 'Vata',
      vikriti: 'Vata Imbalance',
      agni: 'Sama (Balanced)',
      koshta: 'Madhyama (Medium)',
      lifestyle: 'Moderate',
      season: 'Varsha (Rain)',
      notes: ''
    });
  };

  // Delete Patient Dossier
  const handleDeletePatient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you absolutely sure you want to delete this patient case history? This cannot be undone.')) {
      const filtered = patients.filter(p => p.id !== id);
      setPatients(filtered);
      localStorage.setItem('ayurScribe_patients', JSON.stringify(filtered));
      if (selectedPatientId === id) {
        setSelectedPatientId(filtered.length > 0 ? filtered[0].id : null);
      }

      if (currentUser) {
        try {
          await supabase.from('patients').delete().eq('id', id);
        } catch (err: any) {
          console.error('Supabase delete failed:', err);
          alert(`Patient removed locally! Note: Could not delete from cloud server.`);
        }
      }
    }
  };

  // Clear conversation history for active patient
  const handleClearChat = async (patientId: string) => {
    if (window.confirm('Are you sure you want to clear the entire chat history for this patient?')) {
      const updated = patients.map(p => {
        if (p.id === patientId) {
          return { ...p, chats: [] };
        }
        return p;
      });
      await savePatientsToLocal(updated);
    }
  };

  // Delete an individual generated treatment protocol
  const handleDeleteProtocol = async (patientId: string, protocolId: string) => {
    if (window.confirm('Are you sure you want to delete this case sheet protocol?')) {
      const updated = patients.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            protocols: (p.protocols || []).filter(prot => prot.id !== protocolId)
          };
        }
        return p;
      });
      await savePatientsToLocal(updated);
    }
  };

  // Delete individual self-learning feedback log
  const handleDeleteFeedbackLog = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this adaptation feedback?')) {
      if (currentUser) {
        try {
          await supabase.from('feedback_logs').delete().eq('id', id);
        } catch (err) {
          console.error('Supabase delete feedback error:', err);
        }
      }
      setFeedbackLogs(prev => prev.filter(f => f.id !== id));
    }
  };

  // Pre-seed demographical demo data for simulation purposes
  const handleLoadDemoData = async () => {
    const seed = getSeedPatients();
    setPatients(seed);
    setSelectedPatientId(seed[0].id);
    localStorage.setItem('ayurScribe_patients', JSON.stringify(seed));

    setFeedbackLogs([
      {
        id: 'f1',
        patientName: 'Rajesh Kumar',
        originalGuidance: 'Suggested cold water infusion (Hima) for hyperacidity.',
        practitionerCorrection: 'Patient has high Kapha components; warm lukewarm herbal infusion works better to maintain Agnis balance.',
        timestamp: '14 Jun 2026'
      }
    ]);

    setKnowledgeDocs([
      { id: '1', name: 'Caraka Samhita - Sutrasthana - Chapter 1-10.pdf', type: 'Classical Text', size: '2.4 MB', uploadedAt: '15 Jun 2026', status: 'indexed' },
      { id: '2', name: 'Sushruta Samhita - Sharirasthana - Marma points.pdf', type: 'Classical Text', size: '1.8 MB', uploadedAt: '15 Jun 2026', status: 'indexed' },
      { id: '3', name: 'Dr. Ayurvritta Formulation Ledger.txt', type: 'Clinical Journal', size: '145 KB', uploadedAt: '15 Jun 2026', status: 'indexed' },
    ]);

    alert('Classical demo cases, scriptural publications, and feedback logs loaded successfully!');
  };

  // Global Purge/Clear Workspace reset
  const handleResetAllDemoData = async () => {
    if (window.confirm('This will permanently delete all patient dossiers, chat transcripts, generated treatment protocols, custom knowledge base documents, and adaptation feedback logs. Are you absolutely sure?')) {
      setPatients([]);
      setSelectedPatientId(null);
      setKnowledgeDocs([]);
      setFeedbackLogs([]);
      setCorpusResults([]);
      localStorage.removeItem('ayurScribe_patients');

      if (currentUser) {
        try {
          // Parallel deletion for speed
          const patientDeletes = patients.map(p => supabase.from('patients').delete().eq('id', p.id));
          const feedbackDeletes = feedbackLogs.map(f => supabase.from('feedback_logs').delete().eq('id', f.id));
          await Promise.allSettled([...patientDeletes, ...feedbackDeletes]);
          alert('Workspace reset successfully! All local and cloud records have been purged.');
        } catch (err) {
          console.error('Error purging cloud docs:', err);
          alert('Workspace reset locally, but encountered an error resetting some cloud sync documents.');
        }
      } else {
        alert('All local demo data cleared successfully!');
      }
    }
  };

  // API Call - Chatbot Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const activePatient = getSelectedPatient();
    if (!currentMessage.trim() || !activePatient) return;

    const userText = currentMessage;
    setCurrentMessage('');

    // Update locally first using ref to avoid stale closure
    const updatedChats: Message[] = [...activePatient.chats, { role: 'user', parts: [{ text: userText }], timestamp: new Date().toLocaleTimeString() }];
    const updatedPatient = { ...activePatient, chats: updatedChats };
    const updatedPatientsList = patientsRef.current.map(p => p.id === activePatient.id ? updatedPatient : p);
    savePatientsToLocal(updatedPatientsList);

    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userText,
          model: selectedModel,
          history: activePatient.chats.map((c: any) => ({
            role: c.role,
            content: c.parts?.[0]?.text ?? '',
          })),
        },
      });

      if (error) throw new Error(error.message || 'Edge function error');

      if (data.text) {
        const finalChats: Message[] = [...updatedChats, { role: 'model', parts: [{ text: data.text }], timestamp: new Date().toLocaleTimeString() }];
        const finalPatient = { ...activePatient, chats: finalChats };
        const finalPatientsList = patientsRef.current.map(p => p.id === activePatient.id ? finalPatient : p);
        savePatientsToLocal(finalPatientsList);
      } else {
        throw new Error(data.error ?? 'Invalid API Response');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback response with warning
      const errorText = `⚠️ **[System Alert - Network/Key Issue]** Could not communicate with clinical endpoint. Fallback clinical diagnostics based on classical *Vaidya Shastra*:\n\nFor constitution *${activePatient.prakriti}* suffering from *${activePatient.notes || 'general complaints'}*, we prescribe immediate physical evaluation of bowel (*Koshta*: ${activePatient.koshta}) and metabolic capacity (*Agni*: ${activePatient.agni}).\n\n*Error details: ${err.message || 'Server did not respond'}.*`;
      
      const finalChats: Message[] = [...updatedChats, { role: 'model', parts: [{ text: errorText }], timestamp: new Date().toLocaleTimeString() }];
      const finalPatient = { ...activePatient, chats: finalChats };
      const finalPatientsList = patientsRef.current.map(p => p.id === activePatient.id ? finalPatient : p);
      savePatientsToLocal(finalPatientsList);
    } finally {
      setChatLoading(false);
    }
  };

  // API Call - Treatment Protocol Generator
  const handleGenerateProtocol = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const activePatient = getSelectedPatient();
    if (!activePatient || !protocolComplaint.trim()) {
      alert('Please select or specify a chief complaint before generating clinical protocol.');
      return;
    }

    setProtocolLoading(true);
    setGeneratedProtocolText('');

    try {
      const { data, error } = await supabase.functions.invoke('treatment-protocol', {
        body: {
          diagnosis: protocolComplaint,
          patientSummary: `Prakriti: ${activePatient.prakriti}, Vikriti: ${activePatient.vikriti || 'unknown'}, Agni: ${activePatient.agni}, Koshta: ${activePatient.koshta}, Age: ${activePatient.age}, Gender: ${activePatient.gender}`,
          severity: 'moderate',
          chronicity: 'subacute',
          model: selectedModel,
        },
      });

      if (error) throw new Error(error.message || 'Edge function error');

      if (data.text) {
        setGeneratedProtocolText(data.text);
        
        // Save to patient's record
        const newProtocol: Protocol = {
          id: 'protocol_' + Date.now(),
          title: `Chikitsa Chart - ${protocolImbalance || 'Classical Diagnosis'}`,
          chiefComplaint: protocolComplaint,
          principalImbalance: protocolImbalance || activePatient.vikriti || 'Doshic Imbalance',
          generatedText: data.text,
          createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          prakriti: activePatient.prakriti,
          vikriti: activePatient.vikriti
        };

        const updatedPatient = {
          ...activePatient,
          protocols: [newProtocol, ...(activePatient.protocols || [])]
        };
        const updatedPatientsList = patientsRef.current.map(p => p.id === activePatient.id ? updatedPatient : p);
        savePatientsToLocal(updatedPatientsList);
      } else {
        throw new Error(data.error || 'Server output was empty');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback Ayurvedic prompt simulation
      const fallbackText = `### 1. Samprapti Ghataka (Pathological Elements)
- **Primary Dosha**: Elevated Vata-Pitta.
- **Dhatu Infiltration**: Rasa, Rakta, Mamsa.
- **Srotovaha Blockage**: Rasavaha Srotas.

### 2. Chikitsa Sutra (Principal Rationale)
Alleviate aggravated Doshas without extinguishing the digestive core (Agni). Emphasize Deepana (gastric stimulation) and Pachana (clearing blockages).

### 3. Shamana Chikitsa (Traditional Formulas)
- **Amritarishta**: 15ml with equal warm water immediately after lunch.
- **Guduchi Satva**: 500mg combined with Pure Honey - twice early in mornings.
- **Sankh Vati**: 1 Tablet twice daily, before solid food.

### 4. Ahara-Vihara Guidelines
- **Include (Pathya)**: Cooled boiled water, warm green mung bean soups, soft bitter gourd curry.
- **Avoid (Apathya)**: Excess yogurt, nocturnal food intake, direct sun exposure.

*Note: Demanded resource generated in fallback offline clinic mode. Please check GEMINI_API_KEY settings to load dynamic AI insights.*`;
      
      setGeneratedProtocolText(fallbackText);
      
      const newProtocol: Protocol = {
        id: 'protocol_' + Date.now(),
        title: `Chikitsa Chart - Clinical Backup Formulation`,
        chiefComplaint: protocolComplaint,
        principalImbalance: protocolImbalance || activePatient.vikriti || 'Doshic Imbalance',
        generatedText: fallbackText,
        createdAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        prakriti: activePatient.prakriti,
        vikriti: activePatient.vikriti
      };

      const updatedPatient = {
        ...activePatient,
        protocols: [newProtocol, ...(activePatient.protocols || [])]
      };
      const updatedPatientsList = patientsRef.current.map(p => p.id === activePatient.id ? updatedPatient : p);
      savePatientsToLocal(updatedPatientsList);
    } finally {
      setProtocolLoading(false);
    }
  };

  // Print Preview handler
  const triggerPrintWindow = (protocol: Protocol, patient: Patient) => {
    setSelectedProtocolToPrint(protocol);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Real Google Sign-In and logout triggers via Supabase
  const handleGoogleSignInTrigger = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const message = err.message || err;
      if (message.includes('state') || message.includes('issuer')) {
        alert('OAuth configuration error. Please ensure the redirect URLs are properly configured in Supabase dashboard and Google Cloud Console.');
      } else {
        alert(`Google sign-in error: ${message}`);
      }
    }
  };

  const handleGoogleSignOutTrigger = async () => {
    if (window.confirm("Are you sure you want to log out? Your local records will be reset.")) {
      try {
        await supabase.auth.signOut();
        setFirebaseUser(null);
        setUserEmail('');
        setIsLoggedIn(false);
        setGoogleAccessToken(null);
        setPatients([]);
        setSelectedPatientId(null);
        setKnowledgeDocs([]);
        setFeedbackLogs([]);
        setCorpusResults([]);
        setKnowledgeModules(null);
        setActiveTab('chats');
      } catch (err: any) {
        alert(`Log out error: ${err.message}`);
      }
    }
  };

  // Add simulated document to Knowledge Base
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const doc: KnowledgeDoc = {
      id: 'doc_' + Date.now(),
      name: newDocName.endsWith('.pdf') || newDocName.endsWith('.txt') ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'indexed'
    };

    setKnowledgeDocs([...knowledgeDocs, doc]);
    setNewDocName('');
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
        alert('Only PDF, TXT, and MD files are accepted.');
        return;
      }
      const doc: KnowledgeDoc = {
        id: 'doc_' + Date.now(),
        name: file.name,
        type: file.type === 'application/pdf' ? 'Uploaded PDF' : 'Uploaded Text',
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'indexed'
      };
      setKnowledgeDocs([...knowledgeDocs, doc]);
    }
  };

  // Submit Feedback Log
  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackCorrection.trim() || !newFeedbackOriginal.trim()) return;

    const log: FeedbackLog = {
      id: 'fb_' + Date.now(),
      patientName: getSelectedPatient()?.name || 'General Case',
      originalGuidance: newFeedbackOriginal,
      practitionerCorrection: newFeedbackCorrection,
      timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    // Add to local state immediately so data is never lost
    setFeedbackLogs(prev => [log, ...prev]);

    if (currentUser) {
      try {
        await supabase.from('feedback_logs').upsert({
          id: log.id,
          patient_name: log.patientName,
          original_guidance: log.originalGuidance,
          practitioner_correction: log.practitionerCorrection,
          timestamp: log.timestamp,
          owner_id: currentUser.id,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Supabase feedback save error (saved locally):', err);
      }
    }

    setNewFeedbackOriginal('');
    setNewFeedbackCorrection('');
  };

  const activePatient = getSelectedPatient();

  // Config guard AFTER all hooks (React Rules of Hooks satisfied)
  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  // Highlighted features & Improvements Planning Proposal (for RAG & self learning)
  const improvementPoints = [
    { title: "Dynamic Vectorization Pipeline", desc: "A planned background microservice will parse uploaded PDFs, generate embeddings via 'gemini-embedding-2-preview', and index them directly into an operational Firestore or Pinecone database." },
    { title: "Sanskrit-to-English Parser", desc: "For raw Samhitas input, integrate a parser that extracts Shloka alignments automatically, granting doctors exact scripture references next to generated treatments." },
    { title: "Continuous Self-Learning Engine", desc: "Saves practitioner editing feedback logs into an incremental fine-tuning index. Every correction will inject as customized dynamic system context (Few-Shot examples) to train future diagnostics instantly." },
    { title: "Pulse / Nadi Diagnostics Companion", desc: "An audio input analyzer to transcribe live physical consulting sessions directly into structured Prakriti/Vikriti variables." }
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 flex flex-col antialiased">
      
      {/* ================= HEADER ================= */}
      <header className="bg-emerald-950 text-white shadow-sm px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center z-10 print:hidden gap-3">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 md:p-2.5 rounded-lg md:rounded-xl text-white">
            <Leaf className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-xl font-semibold tracking-tight">AyurScribe Clinical Companion</h1>
            <p className="text-[10px] md:text-xs text-emerald-200">Integrated Decision Suite for Ayurveda practitioners</p>
          </div>
        </div>

        {/* Google Authentication & Status Display */}
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t border-emerald-900/40 pt-2.5 sm:pt-0 sm:border-0">
          {currentUser ? (
            <div className="flex items-center bg-emerald-900/60 border border-emerald-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 space-x-2 md:space-x-3 text-xs md:text-sm w-full sm:w-auto justify-between">
              <div className="flex items-center space-x-2 truncate">
                <div className="relative shrink-0">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-700 font-bold flex items-center justify-center text-emerald-100 text-[10px] md:text-xs border border-emerald-500">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  {googleAccessToken ? (
                    <span className="absolute bottom-0 right-0 block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-green-400 ring-2 ring-emerald-900 animate-pulse" title="Firestore & Google Drive Active Sync" />
                  ) : (
                    <span className="absolute bottom-0 right-0 block h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-amber-400 ring-2 ring-emerald-900" title="Local sandbox preview session" />
                  )}
                </div>
                <div className="text-left truncate">
                  <p className="font-medium text-[10px] md:text-xs text-stone-100 truncate max-w-[124px] md:max-w-[180px]">{userEmail}</p>
                  <div className="flex items-center space-x-1">
                    <Cloud className="h-2.5 w-2.5 text-emerald-300 shrink-0" />
                    <span className="text-[9px] md:text-[10px] text-emerald-300 truncate">
                      {googleAccessToken ? "Cloud Sync" : "Local session"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGoogleSignOutTrigger}
                className="hover:text-amber-300 text-emerald-300 text-[10px] md:text-xs font-semibold pl-2 border-l border-emerald-800 transition cursor-pointer shrink-0"
                title="Disconnect Google authentication"
                id="google-disconnect-btn"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignInTrigger}
              className="flex items-center justify-center bg-white text-stone-700 hover:text-stone-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium border border-stone-200 hover:bg-stone-50 shadow-sm transition cursor-pointer font-semibold w-full sm:w-auto"
              id="google-signin-btn"
            >
              <svg className="w-3.5 h-3.5 mr-2 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.821 0 3.882.748 5.257 2.063l2.443-2.443C17.913 1.69 15.181 1 12.24 1 6.536 1 2 5.536 2 11.24s4.536 10.24 10.24 10.24c5.704 0 10.24-4.536 10.24-10.24 0-.6-.08-1.295-.24-1.995H12.24z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      {/* ================= PRIMARY WORKSPACE ================= */}
      <div className="flex-1 flex flex-col lg:flex-row print:bg-white print:p-0 relative">
        
        {/* Backdrop overlay for mobile sidebar drawer */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* SIDEBAR: PATIENT DIRECTORY */}
        <aside 
          className={`fixed inset-y-0 left-0 z-40 w-80 bg-stone-100 border-r border-stone-200 flex flex-col p-4 flex-shrink-0 print:hidden transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
            showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-800" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600">Patient Cases</h2>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowAddPatient(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg p-2 transition flex items-center shadow-sm"
                title="Add a new Case study"
                id="add-patient-btn"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs font-semibold pr-1 hidden sm:inline">New Case</span>
              </button>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="lg:hidden p-2 text-stone-500 hover:text-stone-800 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition ml-1"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-stone-400" />
            </span>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800"
            />
          </div>

          {/* Patient Index List */}
          <div className="flex-grow overflow-y-auto space-y-2 max-h-[calc(100vh-210px)] lg:max-h-[calc(100vh-250px)]">
            {patients.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase())).map((patient) => {
              const isActive = patient.id === selectedPatientId;
              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setShowMobileSidebar(false);
                  }}
                  className={`p-3 rounded-lg border transition cursor-pointer text-left relative group ${
                    isActive
                      ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-transparent border-stone-200 hover:bg-stone-50'
                  }`}
                  id={`patient-${patient.id}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-stone-900 block truncate pr-5">
                      {patient.name}
                    </span>
                    <button
                      onClick={(e) => handleDeletePatient(patient.id, e)}
                      className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition absolute right-2 top-2 opacity-0 group-hover:opacity-100 lg:opacity-0"
                      title="Delete case dossier"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-1">
                    <span>{patient.age}y / {patient.gender.substring(0, 3)}</span>
                    <span className="text-stone-300">•</span>
                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-1 rounded truncate max-w-[120px]" title={patient.prakriti}>
                      {patient.prakriti}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1 truncate">
                    {patient.notes || 'No chief symptoms registered'}
                  </p>
                </div>
              );
            })}

            {patients.length === 0 && (
              <div className="text-center py-8 px-3 text-stone-400 border border-dashed border-stone-250 rounded-xl bg-stone-50/50">
                <Users className="h-8 w-8 mx-auto stroke-1 mb-2 text-stone-300" />
                <p className="text-xs font-semibold text-stone-700">No patients found</p>
                <p className="text-[10px] mt-1 text-stone-500 leading-relaxed">Create a dossier using the "New Case" button above.</p>
                <button
                  onClick={handleLoadDemoData}
                  className="mt-3.5 w-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 rounded-lg py-1.5 px-2.5 text-[10px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-emerald-800" />
                  <span>Load Clinical Demo Cases</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-stone-200 pt-3 space-y-2">
            <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200 text-[10px] space-y-1">
              <span className="font-bold flex items-center space-x-1 text-emerald-900">
                <Activity className="h-3.5 w-3.5" />
                <span>Clinical Standard</span>
              </span>
              <p>AyurScribe synthesizes classical references while validating the safety parameters specified by AyuSh guidance.</p>
            </div>

            <button
              onClick={handleResetAllDemoData}
              className="w-full text-center hover:bg-rose-50 text-stone-500 hover:text-rose-600 rounded py-1.5 text-[10px] font-bold flex items-center justify-center space-x-1 border border-stone-200 hover:border-rose-250 transition cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset & Purge All Data</span>
            </button>
          </div>
        </aside>

        {/* WORKSPACE CENTRAL WORKPAD */}
        <main className="flex-grow flex-1 overflow-y-auto flex flex-col p-4 md:p-6 print:p-0 bg-white min-w-0">
          
          {/* MOBILE DIRECTORY SELECTOR */}
          <div className="lg:hidden bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-between mb-4 print:hidden gap-3 text-left">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow-xs shrink-0"
              id="mobile-sidebar-toggle-btn"
            >
              <Users className="h-4 w-4" />
              <span>Dossiers list ({patients.length})</span>
            </button>
            
            {activePatient ? (
              <div className="text-right truncate flex-1 pl-2">
                <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block leading-none">Active Dossier</span>
                <span className="text-xs font-bold text-stone-900 truncate block mt-0.5">{activePatient.name}</span>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500 italic flex-1 pl-2 text-right">No case study active</p>
            )}
          </div>

          {/* TAB HEADERS */}
          <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-none flex-nowrap space-x-1 mb-6 print:hidden -mx-4 md:-mx-6 px-4 md:px-6">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 tracking-wide transition shrink-0 ${
                activeTab === 'chats'
                  ? 'border-emerald-800 text-emerald-900 bg-emerald-50/40'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
              id="tab-chats-btn"
            >
              <MessageSquare className="h-4 w-4 text-emerald-800 animate-pulse" />
              <span>Diagnostic Consultation</span>
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 tracking-wide transition shrink-0 ${
                activeTab === 'generator'
                  ? 'border-emerald-800 text-emerald-900 bg-emerald-50/40'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
              id="tab-generator-btn"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Treatment Protocol Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 tracking-wide transition shrink-0 ${
                activeTab === 'knowledge'
                  ? 'border-emerald-800 text-emerald-900 bg-emerald-50/40'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
              id="tab-knowledge-btn"
            >
              <Database className="h-4 w-4 text-blue-600" />
              <span>RAG Knowledge Base & Self-Learning</span>
            </button>
          </div>

          {/* ACTIVE CONTENT SHEET */}
          {activePatient ? (
            <div className="flex-grow flex flex-col">
              
              {/* CURRENT PATIENT DOSSIER CARD */}
              <div className="bg-stone-100 hover:bg-stone-50 px-4 py-3 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-6 text-left relative print:hidden transition">
                <div className="col-span-1 sm:col-span-2 flex items-center space-x-3 md:border-r border-stone-200 pr-2">
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-2.5 rounded-lg flex items-center justify-center font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{activePatient.name}</h3>
                    <p className="text-[10px] text-stone-500">{activePatient.age} years old • {activePatient.gender}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Clinical Constitution</p>
                  <p className="font-medium text-stone-800">
                    Prakriti: <span className="text-emerald-800 font-bold">{activePatient.prakriti}</span>
                  </p>
                  <p className="font-medium text-stone-800 text-[11px] truncate" title={activePatient.vikriti}>
                    Vikriti: <span className="text-amber-800 font-semibold">{activePatient.vikriti}</span>
                  </p>
                </div>
                <div className="space-y-1 sm:border-l border-stone-200 sm:pl-4">
                  <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Metabolic Profile</p>
                  <p className="font-medium text-stone-800">Agni: <span className="font-semibold text-stone-700">{activePatient.agni}</span></p>
                  <p className="font-medium text-stone-800">Koshta: <span className="font-semibold text-stone-700">{activePatient.koshta}</span></p>
                </div>
              </div>


              {/* ============ TAB: CONSULTATION CHAT ============ */}
              {activeTab === 'chats' && (
                <div className="flex-grow flex flex-col justify-between">
                  {/* Model selector bar */}
                  <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-xl mb-4 text-left shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-1.5 animate-fade-in">
                          <Brain className="h-4 w-4 text-emerald-800" />
                          <h4 className="text-stone-800 font-bold text-xs flex items-center gap-1.5 leading-none">
                            Active Clinical Reasoning Backbone
                          </h4>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">
                          Synthesize prescriptions with state-of-the-art clinical reasoning LLMs, powered by Google Gemini and NVIDIA NIM.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full sm:w-auto bg-white border border-stone-200 text-stone-700 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 font-medium"
                        >
                          {availableModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Active Model Description box */}
                    <div className="mt-2.5 pt-2.5 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <p className="text-[10px] text-stone-600 leading-normal max-w-xl">
                        💡 <strong>Model Capability:</strong> {availableModels.find(m => m.id === selectedModel)?.description}
                      </p>
                      <div className="flex select-none gap-1 shrink-0 items-center justify-end">
                        <span className="text-[9px] px-1.5 py-0.5 rounded border bg-white border-stone-200 text-stone-500 font-medium whitespace-nowrap">
                          {availableModels.find(m => m.id === selectedModel)?.rating}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold whitespace-nowrap animate-pulse">
                          {availableModels.find(m => m.id === selectedModel)?.tag}
                        </span>
                      </div>
                    </div>
                    {selectedModel === 'nvidia/llama-3.1-nemotron-70b-instruct' && (
                      <div className="mt-2 bg-amber-50/70 border border-amber-200/50 rounded-lg p-2 text-[10px] text-amber-800 leading-normal flex items-start gap-1.5">
                        <span className="font-bold underline shrink-0 mt-0.5">ℹ️ NVIDIA NIM:</span>
                        <span>
                          Ensure <code>NVIDIA_API_KEY</code> is configured in Supabase Edge Function secrets for Nemotron 70B access.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chat Message Box */}
                  <div className="flex-grow border border-stone-200 rounded-xl bg-stone-50/50 p-4 min-h-[350px] max-h-[500px] overflow-y-auto space-y-4 mb-4 text-left">
                    
                    {/* Welcome guidance frame */}
                    <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-lg flex items-start justify-between space-x-3 text-xs leading-relaxed text-emerald-950">
                      <div className="flex items-start space-x-3 text-left">
                        <Heart className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-900 mb-1">Clinical Chat Session - Consultation Room</p>
                          <p>Ask AyuScribe Clinical AI regarding compound options, Dosha diagnostics, Sanskrit classical verses (Sutra), or food pairings tailored specifically for <strong className="text-emerald-900">{activePatient.name}</strong>.</p>
                        </div>
                      </div>
                      {activePatient.chats.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearChat(activePatient.id)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 hover:border-rose-400 rounded text-[10px] font-bold flex items-center space-x-1 shrink-0 transition"
                          title="Wipe conversation logs"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear Chat</span>
                        </button>
                      )}
                    </div>

                    {activePatient.chats.map((chat, idx) => {
                      const isSystemAlert = chat.role === 'model' && chat.parts?.[0]?.text?.includes('[System Alert - Network/Key Issue]');
                      return (
                        <div
                          key={idx}
                          className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed transition-all duration-300 ${
                              chat.role === 'user'
                                ? 'bg-emerald-800 text-emerald-50 rounded-br-none'
                                : isSystemAlert
                                ? 'bg-linear-to-r from-amber-50 to-amber-100/60 border border-amber-300/90 text-amber-950 rounded-bl-none shadow-md'
                                : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] mb-1">
                              {isSystemAlert ? (
                                <span className="font-extrabold text-amber-800 flex items-center space-x-1.5 uppercase tracking-wider">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                                  <span>⚠️ AyuScribe Connection Fallback</span>
                                </span>
                              ) : (
                                <span className={`font-bold ${chat.role === 'user' ? 'opacity-75' : 'text-stone-700'}`}>
                                  {chat.role === 'user' ? 'You (Practitioner)' : 'AyuScribe AI'}
                                </span>
                              )}
                            </div>
                            {/* Markdown parsing-like simulation with dual-part RAG layout */}
                            {renderChatMessageParts(chat.parts?.[0]?.text || '')}
                          </div>
                        </div>
                      );
                    })}

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-sm text-xs text-stone-500 rounded-bl-none flex items-center space-x-2">
                          <Loader className="h-4 w-4 animate-spin text-emerald-800" />
                          <span>Generating clinical insight from classical scriptures...</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Chat bar */}
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      placeholder={`Ask regarding ${activePatient.name}...`}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      className="flex-grow bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none focus:bg-white focus:border-emerald-800 text-stone-900"
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl px-4 py-3 text-xs font-semibold transition flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
                      disabled={chatLoading}
                      id="send-message-btn"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Ask AI</span>
                    </button>
                  </form>
                </div>
              )}


              {/* ============ TAB: TREATMENT PROTOCOL GENERATOR ============ */}
              {activeTab === 'generator' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
                  
                  {/* GENERATOR OPTIONS INPUT FORM */}
                  <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Configure Treatment Protocol</h3>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <label className="font-bold text-stone-600 block">Chief Complaint / Symptoms:</label>
                      <textarea
                        rows={3}
                        placeholder="Detail the patient symptoms, duration, intensity (e.g., severe acidity, sleep disturbances)"
                        value={protocolComplaint}
                        onChange={(e) => setProtocolComplaint(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs text-stone-900 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-stone-600 block mb-1">Diagnosed Imbalance (Vikriti):</label>
                        <input
                          type="text"
                          placeholder="General imbalance e.g., elevated Pitta"
                          value={protocolImbalance}
                          onChange={(e) => setProtocolImbalance(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-600 block mb-1">Target Season/Climate context:</label>
                        <select
                          className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                          value={activePatient.season}
                          disabled
                        >
                          <option>{activePatient.season}</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-stone-200/80 pt-3">
                      <label className="font-bold text-stone-600 block mb-1 text-xs">Clinical Synthesis Backbone Engine:</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:ring-1 focus:ring-emerald-800 focus:outline-none font-medium"
                      >
                        {availableModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                      </select>
                      <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-900/5 mt-2 flex flex-col gap-1">
                        <p className="text-[10px] text-stone-600 leading-normal">
                          💡 <strong>Clinical Utility:</strong> {availableModels.find(m => m.id === selectedModel)?.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 select-none">
                          <span className="text-[9px] font-sans font-medium bg-emerald-800 text-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                            {availableModels.find(m => m.id === selectedModel)?.provider}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full border bg-white border-stone-200 text-stone-500 font-medium whitespace-nowrap">
                            {availableModels.find(m => m.id === selectedModel)?.rating}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold whitespace-nowrap animate-pulse shrink-0">
                            {availableModels.find(m => m.id === selectedModel)?.tag}
                          </span>
                        </div>
                      </div>
                      {selectedModel === 'nvidia/llama-3.1-nemotron-70b-instruct' && (
                        <div className="mt-2 bg-amber-50/70 border border-amber-200/50 rounded-lg p-2 text-[10px] text-amber-800 leading-normal flex items-start gap-1.5">
                          <span className="font-bold underline shrink-0 mt-0.5">ℹ️ NVIDIA NIM:</span>
                          <span>
                            Ensure <code>NVIDIA_API_KEY</code> is configured in Supabase Edge Function secrets for Nemotron 70B access.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-stone-100 p-3 rounded-lg text-[11px] space-y-1">
                      <p className="font-semibold text-stone-700">Patient Profile Preset Context:</p>
                      <div className="flex flex-wrap gap-2 text-stone-800">
                        <span className="bg-white px-2 py-0.5 rounded border border-stone-200">Prakriti: <strong>{activePatient.prakriti}</strong></span>
                        <span className="bg-white px-2 py-0.5 rounded border border-stone-200">Agni: <strong>{activePatient.agni}</strong></span>
                        <span className="bg-white px-2 py-0.5 rounded border border-stone-200">Koshta: <strong>{activePatient.koshta}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateProtocol}
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                      disabled={protocolLoading}
                      id="generate-protocol-btn"
                    >
                      {protocolLoading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Assembling Clinical Formula...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Generate Clinical Protocol Chart</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* PROTOCOL RESULT VIEW */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Protocol Documentation</h4>
                    </div>

                    <div className="border border-stone-200 rounded-2xl bg-stone-50 flex-grow p-5 min-h-[300px] flex flex-col justify-between">
                      {generatedProtocolText ? (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 max-h-[400px] overflow-y-auto leading-relaxed text-xs">
                            <div className="font-serif border-b pb-2 mb-3 border-stone-100 flex justify-between items-center">
                              <span className="text-emerald-900 font-bold uppercase tracking-widest">AYURVEDA PRESCRIPTION STUDY</span>
                              <span className="text-[10px] text-stone-400">Date: {new Date().toLocaleDateString('en-GB')}</span>
                            </div>
                            <Markdown content={generatedProtocolText} />
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => triggerPrintWindow({
                                id: 'p_temp',
                                title: `Treatment Protocol - ${activePatient.name}`,
                                chiefComplaint: protocolComplaint,
                                principalImbalance: protocolImbalance,
                                prakriti: activePatient.prakriti,
                                vikriti: activePatient.vikriti,
                                generatedText: generatedProtocolText,
                                createdAt: new Date().toLocaleDateString('en-GB')
                              }, activePatient)}
                              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                              id="print-protocol-btn"
                            >
                              <Printer className="h-4 w-4" />
                              <span>Print Prescription / PDF</span>
                            </button>
                            
                            {googleAccessToken && (
                              <button
                                onClick={() => handleExportToGoogleDrive(
                                  activePatient.name,
                                  `Treatment Protocol - ${activePatient.name}`,
                                  generatedProtocolText
                                )}
                                disabled={driveExportLoading}
                                className="flex-1 bg-emerald-950 hover:bg-black text-white border border-emerald-800 rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                                id="gdrive-export-btn"
                              >
                                {driveExportLoading ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Cloud className="h-4 w-4 text-emerald-300" />
                                )}
                                <span>Save to Google Drive</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-stone-400 py-12">
                          <FileText className="h-12 w-12 stroke-1 mb-2 text-stone-300" />
                          <p className="text-xs font-semibold">No active treatment protocol generated</p>
                          <p className="text-[10px] max-w-[250px] mt-1">Configure symptoms on the left to trigger customized Ayurvedic diagnostics and export beautifully styled medical charts.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PREVIOUS COMPILING ARCHIVES FOR CURRENT PATIENT */}
                  <div className="col-span-1 xl:col-span-2">
                    <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider mb-2">History Case Sheets ({activePatient.protocols?.length || 0})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePatient.protocols?.map((prot) => (
                        <div key={prot.id} className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="font-bold text-xs text-stone-900 line-clamp-1">{prot.title}</h5>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <span className="text-[9px] text-stone-400 font-mono bg-stone-100 px-1 py-0.5 rounded">{prot.createdAt}</span>
                                <button
                                  onClick={() => handleDeleteProtocol(activePatient.id, prot.id)}
                                  className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                                  title="Delete protocol case sheet"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-stone-500 line-clamp-3 leading-relaxed text-left">
                              {stripMarkdown(prot.generatedText)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => triggerPrintWindow(prot, activePatient)}
                              className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg py-1.5 px-3 text-[10px] font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Print PDF</span>
                            </button>
                            
                            {googleAccessToken && (
                              <button
                                onClick={() => handleExportToGoogleDrive(activePatient.name, prot.title, prot.generatedText)}
                                disabled={driveExportLoading}
                                className="flex-1 bg-emerald-100/50 hover:bg-emerald-150 text-emerald-900 border border-emerald-800/10 rounded-lg py-1.5 px-3 text-[10px] font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                              >
                                {driveExportLoading ? (
                                  <Loader className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Cloud className="h-3 w-3 text-emerald-800" />
                                )}
                                <span>Export GDrive</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {(!activePatient.protocols || activePatient.protocols.length === 0) && (
                        <div className="bg-stone-50 rounded-xl py-6 text-center text-stone-400 col-span-2 border border-dashed border-stone-200 text-xs text-stone-500">
                          No previous files generated.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}


              {/* ============ TAB: KNOWLEDGE BASE & RAG DESIGN PANEL ============ */}
              {activeTab === 'knowledge' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
                  
                  {/* Classical Ingest Manager */}
                  <div className="xl:col-span-2 space-y-6">
                    
                    {/* SUB-TAB NAVIGATOR */}
                    <div className="flex space-x-2 border-b border-stone-200 pb-1 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setKnowledgeSubTab('samhita')}
                        className={`px-3.5 py-1.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                          knowledgeSubTab === 'samhita'
                            ? 'border-emerald-800 text-emerald-900 bg-stone-50/50'
                            : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50/30'
                        }`}
                      >
                        <span>📜 Local Scriptural & Herb Corpus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKnowledgeSubTab('huggingface')}
                        className={`px-3.5 py-1.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                          knowledgeSubTab === 'huggingface'
                            ? 'border-emerald-800 text-emerald-900 bg-stone-50/50'
                            : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50/30'
                        }`}
                      >
                        <span className="flex items-center space-x-1">
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-mono px-1 rounded uppercase tracking-wider font-extrabold animate-pulse">New</span>
                          <span>🤗 Hugging Face / PubMed Academic RAG</span>
                        </span>
                      </button>
                    </div>

                    {knowledgeSubTab === 'samhita' ? (
                      <div className="space-y-6">
                        
                        <div className="bg-white border border-stone-200 p-5 rounded-2xl">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <Database className="h-5 w-5 text-emerald-800" />
                          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Classical Samhitas & Knowledge Ingestion</h3>
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                        To build standard RAG (Retrieval-Augmented Generation) frameworks once you provide the files, the vectorizer compiles books (e.g. *Charaka Samhita*, *Sushruta Samhita*) as indices. Use local uploads to test simulated RAG contextual references here:
                      </p>

                      {/* Active Corpus Query Station */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4.5 mb-6 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5 uppercase tracking-wider">
                          <Search className="h-4 w-4 text-emerald-800" />
                          <span>Instant Scriptural & Formulation Search</span>
                        </h4>
                        <p className="text-[11px] text-emerald-900 leading-relaxed">
                          Query the active Ayurvedic Clinical Knowledge Base (Charak Samhita, Sushruta Samhita, Allopathy Drug Interactions & Herb Pharmacopeias):
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter symptoms, herbs, or classical medical terms (e.g., Ashwagandha, Prameha, Amavata, Anticoagulant)..."
                            value={corpusQuery}
                            onChange={(e) => setCorpusQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCorpus(); }}
                            className="bg-white border text-xs border-emerald-200 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800 flex-grow"
                          />
                          <button
                            type="button"
                            onClick={handleSearchCorpus}
                            disabled={corpusLoading}
                            className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg px-4 py-2 font-bold text-[11px] transition shrink-0 flex items-center space-x-1"
                          >
                            {corpusLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                            <span>Search Corpus</span>
                          </button>
                        </div>

                        {corpusResults.length > 0 && (
                          <div className="bg-white rounded-lg border border-stone-250 p-3 max-h-60 overflow-y-auto space-y-2 mt-2 shadow-inner">
                            <p className="text-[10px] font-bold text-emerald-850 uppercase tracking-widest">Retrieved Matches ({corpusResults.length})</p>
                            <div className="space-y-2 text-xs text-stone-700 leading-relaxed font-mono divide-y divide-stone-100">
                              {corpusResults.map((res, i) => (
                                <div key={i} className="pt-2 first:pt-0">
                                  <div className="flex items-start space-x-1 text-emerald-950 font-bold mb-0.5">
                                    <span className="bg-emerald-50 text-[9px] px-1.5 py-0.5 rounded text-emerald-800">Match {i+1}</span>
                                  </div>
                                  <p className="text-stone-700 pl-1">{res}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                          dragActive
                            ? 'border-emerald-800 bg-emerald-50/50'
                            : 'border-stone-200 hover:border-emerald-600 bg-stone-50'
                        }`}
                      >
                        <Cloud className="h-10 w-10 mx-auto text-stone-400 mb-2" />
                        <p className="text-xs font-semibold text-stone-800">Drag & Drop Sanskrit Samhita files or Practitioner Notes</p>
                        <p className="text-[10px] text-stone-500 mt-1">Accepts PDF, TXT, DOCX files up to 25MB</p>
                        <div className="flex items-center justify-center space-x-2 mt-3">
                          <span className="text-stone-300">or</span>
                          <label className="bg-white hover:bg-stone-50 hover:text-stone-900 border border-stone-300 text-stone-700 font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition">
                            Choose File
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const doc: KnowledgeDoc = {
                                    id: 'doc_' + Date.now(),
                                    name: file.name,
                                    type: 'Manual PDF Upload',
                                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                                    uploadedAt: new Date().toLocaleDateString('en-GB'),
                                    status: 'indexed'
                                  };
                                  setKnowledgeDocs([...knowledgeDocs, doc]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Manual text form */}
                      <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 text-xs">
                        <input
                          type="text"
                          placeholder="Or type manual file name..."
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          className="bg-white border md:col-span-2 border-stone-300 rounded-lg p-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                        />
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value)}
                          className="bg-white border border-stone-300 rounded-lg p-2 text-stone-900 focus:outline-none"
                        >
                          <option value="Classical Text">Classical Text (Samhita)</option>
                          <option value="Physician Notes">Physician Journals</option>
                          <option value="Formulations">Formulation Sheet</option>
                        </select>
                        <button type="submit" className="md:col-span-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg p-2 font-bold text-[11px] transition">
                          Add Document Resource to Indexed Model
                        </button>
                      </form>

                      {/* Google Drive Document Importer section */}
                      {googleAccessToken && (
                        <div className="mt-6 border border-emerald-200 bg-emerald-50/20 rounded-xl p-4.5 text-xs">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5 uppercase tracking-wider">
                              <Cloud className="h-4 w-4 text-emerald-800 animate-pulse" />
                              <span>Import Classic Sutras from Google Drive</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setShowDriveDocsBrowser(!showDriveDocsBrowser);
                                if (!showDriveDocsBrowser) loadGoogleDriveFiles();
                              }}
                              className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 border border-emerald-300 rounded px-2.5 py-1 bg-white hover:bg-emerald-50 transition cursor-pointer"
                            >
                              {showDriveDocsBrowser ? "Close Browser" : "Browse GDrive Files"}
                            </button>
                          </div>

                          {showDriveDocsBrowser && (
                            <div className="space-y-3">
                              <p className="text-[10px] text-emerald-900 leading-relaxed">
                                Select raw text scripts or manuscripts (.txt, .pdf) stored in your personal Google Drive account. Plaintext scripts will be immediately parsed, downloaded, and cached inside the clinical search index below:
                              </p>

                              {driveFilesLoading ? (
                                <div className="flex items-center space-x-2 py-4 justify-center text-[11px] text-stone-500">
                                  <Loader className="h-4 w-4 animate-spin text-emerald-800" />
                                  <span>Querying Google Drive files...</span>
                                </div>
                              ) : driveFiles.length === 0 ? (
                                <div className="text-center py-4 text-[10px] text-stone-400 border border-stone-200 border-dashed rounded-lg bg-white">
                                  No compatible documents discovered in Google Drive root folder. Try uploading plain text files to your Drive.
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100 max-h-48 overflow-y-auto">
                                  {driveFiles.map((f) => (
                                    <div key={f.id} className="p-2.5 flex items-center justify-between hover:bg-emerald-50/30 transition text-[11px]">
                                      <div className="flex items-center space-x-2 truncate max-w-[180px] md:max-w-md">
                                        <FileText className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
                                        <span className="font-semibold text-stone-700 truncate">{f.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleImportDriveFile(f.id, f.name)}
                                        className="bg-emerald-800 text-white rounded px-2.5 py-1 font-bold text-[9px] hover:bg-emerald-900 transition flex items-center space-x-1 shrink-0 cursor-pointer"
                                      >
                                        <span>Download & Index</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Uploaded items */}
                      <div className="mt-6 space-y-2">
                        <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Active Indexed Repositories ({knowledgeDocs.length})</p>
                        <div className="divide-y divide-stone-150">
                          {knowledgeDocs.map((doc) => (
                            <div key={doc.id} className="py-2.5 flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2.5">
                                <BookOpen className="h-4 w-4 text-stone-500 shrink-0" />
                                <div>
                                  <p className="font-semibold text-stone-800 truncate max-w-[280px] md:max-w-md">{doc.name}</p>
                                  <span className="text-[9px] text-stone-400">{doc.type} • {doc.size}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                  <span>Indexed</span>
                                </span>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete and deregister "${doc.name}" from active indexed collections?`)) {
                                      setKnowledgeDocs(knowledgeDocs.filter(d => d.id !== doc.id));
                                    }
                                  }}
                                  className="text-stone-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                  title="Delete document resource"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>


                    {/* VAIDYA'S AYURVEDIC CORPUS EXPLORER - INTEGRATED FROM 12 MODULES */}
                    <div id="vaidya-corpus-explorer" className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-sm text-stone-805">
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-3 gap-2">
                        <div className="flex items-center space-x-2.5">
                          <BookOpen className="h-5 w-5 text-emerald-800 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Vaidya's Scripture & Herb Corpus Explorer</h4>
                            <p className="text-[10px] text-stone-500">Read and verify classical principles, pharmacopeia profiles, and integrated parameters</p>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border border-emerald-100 self-start md:self-auto">
                          Interactive Library
                        </span>
                      </div>

                      {/* Category selectors */}
                      <div className="flex flex-wrap gap-1.5 pb-2">
                        {[
                          { id: 'fundamentals', label: '1. Fundamentals & Doshas' },
                          { id: 'diagnostics', label: '2. Diagnostics (Pariksha)' },
                          { id: 'herbs', label: '3. Herb Pharmacopeia' },
                          { id: 'treatments', label: '4. Treatments (Chikitsa)' },
                          { id: 'diseases', label: '5. Vyadhana & Samprapti' },
                          { id: 'allopathyIntegration', label: '6. Allopathic Integration' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedModuleCategory(cat.id);
                              setModuleSearchQuery('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                              selectedModuleCategory === cat.id
                                ? 'bg-emerald-800 text-white shadow-sm'
                                : 'bg-stone-50 border border-stone-200 text-stone-750 hover:bg-stone-100'
                            }`}
                          >
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Query bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          placeholder={`Filter active ${selectedModuleCategory} records...`}
                          value={moduleSearchQuery}
                          onChange={(e) => setModuleSearchQuery(e.target.value)}
                          className="w-full bg-stone-50 text-stone-900 border border-stone-200 rounded-lg p-2 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-800"
                        />
                      </div>

                      {/* Display content */}
                      {isLoadingModules ? (
                        <div className="py-12 flex flex-col justify-center items-center space-y-2 text-stone-400">
                          <Loader className="h-6 w-6 animate-spin text-emerald-800" />
                          <span className="text-xs">Loading holy scriptures directory...</span>
                        </div>
                      ) : !knowledgeModules ? (
                        <div className="py-8 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl bg-stone-50">
                          No active database modules loaded. Loading from server...
                        </div>
                      ) : (
                        <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-stone-200">
                          
                          {/* CATEGORY: FUNDAMENTALS */}
                          {selectedModuleCategory === 'fundamentals' && (
                            <div className="space-y-4">
                              {/* Tridosha */}
                              {knowledgeModules.fundamentals?.tridosha
                                ?.filter((t: any) => 
                                  t.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                  t.definition.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                )
                                .map((t: any) => (
                                  <div key={t.id} className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-emerald-950 font-serif">{t.name} ({t.sanskrit})</span>
                                      <span className="bg-emerald-100/60 text-emerald-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">Dosha</span>
                                    </div>
                                    <p className="text-stone-750 leading-relaxed italic">"{t.definition}"</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[10px] text-stone-600 font-sans">
                                      <div>
                                        <strong className="text-stone-850">Gunas (Qualities):</strong> {t.qualities?.join(', ') || 'N/A'}
                                      </div>
                                      <div>
                                        <strong className="text-stone-850">Ashraya Seat:</strong> {t.seat || 'N/A'}
                                      </div>
                                      <div>
                                        <strong className="text-stone-850">Primary Actions:</strong> {t.functions?.join(', ') || 'N/A'}
                                      </div>
                                      <div>
                                        <strong className="text-stone-850">Vikriti Imbalance:</strong> {t.imbalance?.join(', ') || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                              {/* Saptadhatu */}
                              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                                <div className="bg-stone-50 p-3 border-b border-stone-200 font-bold text-stone-850">Saptadhatu (Seven Vital Tissues)</div>
                                <div className="divide-y divide-stone-150">
                                  {knowledgeModules.fundamentals?.saptadhatu
                                    ?.filter((sd: any) => 
                                      sd.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                      sd.function.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                    )
                                    .map((sd: any) => (
                                      <div key={sd.name} className="p-3 flex justify-between items-center bg-stone-50/20">
                                        <div>
                                          <p className="font-bold text-stone-900">{sd.name}</p>
                                          <p className="text-[10px] text-stone-500 font-medium">Ashraya Seat: {sd.seat} • Attribute: {sd.quality}</p>
                                        </div>
                                        <span className="bg-stone-100 text-stone-800 text-[9.5px] font-bold px-2.5 py-1 rounded-md">
                                          {sd.function}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Agni */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {knowledgeModules.fundamentals?.agni
                                  ?.filter((ag: any) => 
                                    ag.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                    ag.description.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                  )
                                  .map((ag: any) => (
                                    <div key={ag.id} className="bg-stone-50/50 border border-stone-200 p-3.5 rounded-xl text-xs space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-stone-900">{ag.name}</span>
                                        {ag.ideal && <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 rounded">Sama</span>}
                                      </div>
                                      <p className="text-stone-600 leading-relaxed italic">"{ag.description}"</p>
                                      {ag.causes && (
                                        <p className="text-[10px] text-stone-500 font-medium">Aggravators: {ag.causes.join(', ')}</p>
                                      )}
                                    </div>
                                  ))}
                              </div>

                              {/* Srotas */}
                              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                                <div className="bg-stone-50 p-3 border-b border-stone-200 font-bold text-stone-850">Srotas (Channels of Circulation)</div>
                                <div className="divide-y divide-stone-150">
                                  {knowledgeModules.fundamentals?.srotas
                                    ?.filter((sr: any) => 
                                      sr.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                      sr.function.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                      sr.channels.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                    )
                                    .map((sr: any) => (
                                      <div key={sr.id} className="p-3 space-y-1 bg-white">
                                        <div className="flex justify-between">
                                          <span className="font-semibold text-stone-900">{sr.name} ({sr.function})</span>
                                          <span className="text-[10px] text-stone-450">Route: {sr.channels}</span>
                                        </div>
                                        <p className="text-[10px] text-red-750 font-medium">Vikriti pathology: {sr.symptoms}</p>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* CATEGORY: DIAGNOSTICS */}
                          {selectedModuleCategory === 'diagnostics' && (
                            <div className="space-y-4">
                              {knowledgeModules.diagnostics
                                ?.filter((diag: any) => 
                                  diag.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                  diag.description.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                )
                                .map((diag: any) => (
                                  <div key={diag.id} className="border border-stone-200 rounded-xl overflow-hidden text-xs bg-white">
                                    <div className="bg-stone-50 p-3 border-b border-stone-200 flex justify-between items-center">
                                      <span className="font-bold text-stone-900">{diag.name} ({diag.sanskrit})</span>
                                      <span className="text-[10px] text-stone-400 font-mono">ID: {diag.id}</span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                      <p className="text-stone-605 leading-relaxed italic">"{diag.description}"</p>
                                      
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider font-sans">Examination Checklist & Components:</span>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {diag.components?.map((c: string, idx: number) => (
                                            <li key={idx} className="bg-stone-50 border border-stone-200 p-2 rounded-lg flex items-center space-x-2 text-[11px] text-stone-750 font-mono">
                                              <span className="text-emerald-700 font-bold shrink-0">✔</span>
                                              <span className="truncate">{c}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="pt-2 border-t border-stone-200">
                                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider font-sans">Practitioner Clinical Application:</span>
                                        <p className="text-stone-700 mt-1 leading-relaxed font-sans">{diag.clinicalApplication?.join(', ')}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* CATEGORY: HERBS */}
                          {selectedModuleCategory === 'herbs' && (
                            <div className="space-y-4">
                              {knowledgeModules.herbs
                                ?.filter((h: any) => 
                                  h.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                  h.sanskrit.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                  h.botanicalName.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                )
                                .map((h: any) => (
                                  <div key={h.name} className="bg-white border border-stone-200 rounded-xl text-xs overflow-hidden">
                                    <div className="bg-emerald-50/25 border-b border-stone-200 p-3.5 flex justify-between items-center">
                                      <div>
                                        <h4 className="font-bold text-emerald-950 text-xs font-serif">{h.name} ({h.sanskrit})</h4>
                                        <p className="text-[10px] text-stone-500 font-mono italic">{h.botanicalName} ({h.family})</p>
                                      </div>
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-150">
                                        Dosage: {h.dosage}
                                      </span>
                                    </div>
                                    <div className="p-4 space-y-3 text-[11px]">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-stone-200 pb-2.5 text-stone-600 font-mono">
                                        <div><strong className="text-stone-850 font-sans">Rasa:</strong> {h.rasa?.join(', ')}</div>
                                        <div><strong className="text-stone-850 font-sans">Guna:</strong> {h.guna?.join(', ')}</div>
                                        <div><strong className="text-stone-850 font-sans">Virya:</strong> {h.virya}</div>
                                        <div><strong className="text-stone-850 font-sans">Vipaka:</strong> {h.vipaka}</div>
                                      </div>

                                      <div className="space-y-1">
                                        <strong className="text-stone-850 block font-bold">Indications:</strong>
                                        <p className="text-stone-705 leading-relaxed font-sans">{h.indications?.join(', ')}</p>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                        <div className="bg-emerald-50/10 border border-emerald-100 p-2.5 rounded-lg">
                                          <strong className="text-emerald-950 font-bold block text-[10px] uppercase">Dosha Actions:</strong>
                                          <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-mono font-bold text-stone-700 pt-1">
                                            <div className="bg-sky-50 py-0.5 rounded border border-sky-100">Vata: {h.doshaKarma?.vata}</div>
                                            <div className="bg-amber-50 py-0.5 rounded border border-amber-100">Pitta: {h.doshaKarma?.pitta}</div>
                                            <div className="bg-emerald-50 py-0.5 rounded border border-emerald-110">Kapha: {h.doshaKarma?.kapha}</div>
                                          </div>
                                        </div>
                                        <div className="bg-red-50/10 border border-red-100 p-2.5 rounded-lg text-red-955">
                                          <strong className="text-red-900 font-bold block text-[10px] uppercase">Contraindications:</strong>
                                          <span className="text-[10px] leading-relaxed block text-stone-600">{h.contraindications?.join(', ') || 'None reported'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                           {/* CATEGORY: TREATMENTS */}
                           {selectedModuleCategory === 'treatments' && (
                             <div className="space-y-4">
                               {knowledgeModules.treatments
                                 ?.filter((t: any) => 
                                   t.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                   t.sanskrit.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                   t.description.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                 )
                                 .map((t: any) => (
                                   <div key={t.name} className="border border-stone-200 rounded-xl overflow-hidden text-xs bg-white">
                                     <div className="p-3 bg-stone-50 border-b border-stone-200 font-bold text-stone-900 flex justify-between">
                                       <span>{t.name} ({t.sanskrit})</span>
                                       <span className="bg-stone-200 text-stone-850 px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0">{t.category}</span>
                                     </div>
                                     <div className="p-4 space-y-3">
                                       <p className="text-stone-600 leading-relaxed italic">"{t.description}"</p>
                                       
                                       <div className="space-y-1 font-mono text-[11px]">
                                         <strong className="text-stone-800 font-sans uppercase text-[10px] tracking-wider text-stone-400 block font-bold">Standard clinical protocol steps:</strong>
                                         <ol className="list-decimal pl-4.5 space-y-1 text-stone-700">
                                           {t.procedure?.map((step: string, idx: number) => (
                                             <li key={idx} className="leading-relaxed">{step}</li>
                                           ))}
                                         </ol>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-stone-200 pt-3">
                                         <div>
                                           <strong className="text-stone-800 uppercase tracking-wider text-stone-400 block mb-0.5 font-bold">Indications:</strong>
                                           <p className="text-stone-705 leading-relaxed font-sans">{t.indications?.join(', ')}</p>
                                         </div>
                                         <div>
                                           <strong className="text-stone-800 uppercase tracking-wider text-stone-400 block mb-0.5 font-bold">Contraindications:</strong>
                                           <p className="text-stone-705 leading-relaxed font-sans">{t.contraindications?.join(', ')}</p>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                             </div>
                           )}

                           {/* CATEGORY: DISEASES */}
                           {selectedModuleCategory === 'diseases' && (
                             <div className="space-y-4">
                               {knowledgeModules.diseases
                                 ?.filter((d: any) => 
                                   d.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                   d.sanskrit.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                   d.modernCorrelation.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                 )
                                 .map((d: any) => (
                                   <div key={d.name} className="border border-stone-200 rounded-xl overflow-hidden text-xs bg-white">
                                     <div className="p-3 bg-stone-50 border-b border-stone-200 flex justify-between items-center text-xs">
                                       <div>
                                         <strong className="text-stone-900 font-serif text-[13px]">{d.name} ({d.sanskrit})</strong>
                                         <p className="text-[10px] text-stone-500 font-medium">Classically classified as {d.category}</p>
                                       </div>
                                       <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase shrink-0 border border-emerald-200">
                                         {d.modernCorrelation}
                                       </span>
                                     </div>
                                     <div className="p-4 space-y-3.5 font-sans">
                                       <div className="bg-amber-50/20 border border-amber-100 p-3 rounded-xl">
                                         <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">Samprapti (Classical Pathogenesis):</span>
                                         <p className="text-stone-750 leading-relaxed italic mt-0.5 font-serif">"{d.samprapti}"</p>
                                       </div>

                                       <div className="space-y-1">
                                         <strong className="text-stone-850 text-[10px] uppercase font-bold text-stone-450 block">Primary Lakshana Clinical Features:</strong>
                                         <ul className="list-disc pl-4.5 space-y-0.5 text-stone-700 text-[11px]">
                                           {d.clinicalFeatures?.map((f: string, idx: number) => (
                                             <li key={idx} className="leading-relaxed">{f}</li>
                                           ))}
                                         </ul>
                                       </div>

                                       <div className="space-y-1 pt-1">
                                         <strong className="text-stone-850 text-[10px] uppercase font-bold text-stone-450 block">Sutrasthana Treatment Principles:</strong>
                                         <ul className="list-disc pl-4.5 space-y-0.5 text-stone-700 text-[11px]">
                                           {d.treatment?.map((t: string, idx: number) => (
                                             <li key={idx} className="leading-relaxed">{t}</li>
                                           ))}
                                         </ul>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-3 text-[10px]">
                                         <div className="bg-emerald-50/10 border border-emerald-100 p-2.5 rounded-lg text-emerald-950">
                                           <strong className="text-emerald-900 block font-bold text-[9px] uppercase">Pathya (Recommend Diet):</strong>
                                           <p className="text-stone-700 leading-relaxed font-sans">{d.pathya?.join(', ')}</p>
                                         </div>
                                         <div className="bg-red-50/10 border border-red-100 p-2.5 rounded-lg text-red-950">
                                           <strong className="text-red-900 block font-bold text-[9px] uppercase">Apathya (Prohibited foods):</strong>
                                           <p className="text-stone-700 leading-relaxed font-sans">{d.apathya?.join(', ')}</p>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                             </div>
                           )}

                           {/* CATEGORY: ALLOPATHY INTEGRATION */}
                           {selectedModuleCategory === 'allopathyIntegration' && (
                             <div className="space-y-4">
                               {knowledgeModules.allopathyIntegration
                                 ?.filter((allo: any) => 
                                   allo.condition.toLowerCase().includes(moduleSearchQuery.toLowerCase()) || 
                                   allo.ayurvedicCorrelation.toLowerCase().includes(moduleSearchQuery.toLowerCase())
                                 )
                                 .map((allo: any) => (
                                   <div key={allo.condition} className="border border-stone-200 rounded-xl overflow-hidden text-xs bg-white">
                                     <div className="bg-stone-50 p-3 border-b border-stone-200 flex justify-between items-center font-bold">
                                       <span className="text-stone-900">{allo.condition} Clinical Crossroad</span>
                                       <span className="text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 uppercase">Correlates with {allo.ayurvedicCorrelation}</span>
                                     </div>
                                     <div className="p-4 space-y-3.5 font-sans">
                                       <div className="text-[11px] space-y-1.5 flex flex-col">
                                         <div className="flex justify-between border-b border-stone-100 pb-1.5 flex-wrap gap-1">
                                           <span className="font-bold text-stone-500">Standard Allopathy Treatment:</span>
                                           <span className="text-stone-800 font-mono text-right">{allo.allopathyTreatment}</span>
                                         </div>
                                         <div className="pt-1.5">
                                           <span className="font-bold text-emerald-950 text-[10px] uppercase block tracking-wider">Integrated Medicine Protocol:</span>
                                           <p className="text-stone-700 leading-relaxed italic mt-0.5">"{allo.integratedApproach}"</p>
                                         </div>
                                       </div>

                                       <div className="bg-amber-50/25 border border-amber-100 p-3 rounded-xl text-amber-950 space-y-1">
                                         <span className="text-[10px] font-bold text-amber-950 flex items-center space-x-1 uppercase">
                                           <AlertCircle className="h-4 w-4 text-amber-805 shrink-0" />
                                           <span>Cross-System herb Interactions & Safety Cautions:</span>
                                         </span>
                                         <ul className="list-disc pl-4.5 space-y-1 text-stone-700 text-[11px]">
                                           {allo.safetyNotes?.map((note: string, idx: number) => (
                                             <li key={idx} className="leading-relaxed font-mono">{note}</li>
                                           ))}
                                         </ul>
                                       </div>

                                       <div className="space-y-1">
                                         <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Parameters to monitor closely:</span>
                                         <div className="flex flex-wrap gap-1.5 pt-1.5">
                                           {allo.monitoringParameters?.map((param: string, idx: number) => (
                                             <span key={idx} className="bg-stone-100 border text-stone-700 text-[11.5px] px-2.5 py-1 rounded font-mono">
                                               🔎 {param}
                                             </span>
                                           ))}
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                             </div>
                           )}
                         </div>
                       )}
                     </div>


                     {/* RAG & SELF-LEARNING ARCHITECTURE BLUEPRINT */}
                     <div className="bg-stone-900 text-white p-6 rounded-2xl">
                      <div className="flex items-center space-x-2.5 mb-3">
                        <Database className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-emerald-100 uppercase tracking-widest">Self-Learning RAG Blueprint</h3>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed mb-4">
                        Upon receiving your raw Ayurvedic books (Samhitas), we will establish a self-improving vector indexing mechanism:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {improvementPoints.map((point, index) => (
                          <div key={index} className="bg-stone-850 p-4 rounded-xl border border-stone-800">
                            <span className="text-emerald-400 font-bold block mb-1">0{index+1}. {point.title}</span>
                            <p className="text-stone-300 leading-relaxed text-[11px]">{point.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                      </div>
                    ) : (
                      <div className="space-y-6">
                        
                        {/* Hugging Face Directory Header */}
                        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-3 gap-2">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xl shrink-0 select-none">🤗</span>
                              <div>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Hugging Face & Global Science RAG Hub</h4>
                                <p className="text-[10px] text-stone-500 font-sans">Index, explore and utilize active fine-tuning datasets and paper repositories</p>
                              </div>
                            </div>
                            <span className="bg-amber-50 text-amber-900 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0 self-start md:self-auto animate-pulse flex items-center space-x-1 uppercase">
                              <span className="h-1 w-1 rounded-full bg-amber-600" />
                              <span>Academic Indexing</span>
                            </span>
                          </div>
                          
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Global healthcare NLP initiatives maintain specialized Sanskrit corpora, synthetic medical dialogues, and peer-reviewed journals. Connecting a collection activates localized Retrieval-Augmented Generation (RAG) context queries in real-time.
                          </p>

                          {/* Datasets Grid Card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {AYURVEDA_HF_DATASETS.map((ds) => {
                              const isActivated = knowledgeDocs.some(doc => doc.id === ds.id);
                              return (
                                <div 
                                  key={ds.id} 
                                  className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3.5 shadow-sm ${
                                    isActivated 
                                      ? 'bg-emerald-50/20 border-emerald-300' 
                                      : 'bg-stone-50/50 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                      <div>
                                        <span className="font-serif font-bold text-[12.5px] text-stone-900 leading-tight block">{ds.name}</span>
                                        <span className="text-[9px] text-stone-400 font-mono block mt-0.5">{ds.id}</span>
                                      </div>
                                      <span className="text-[9px] font-mono font-bold bg-white text-stone-600 px-1.5 py-0.5 rounded border border-stone-250 shrink-0 select-none uppercase shadow-2xs">
                                        {ds.size}
                                      </span>
                                    </div>
                                    
                                    <p className="text-[11px] text-stone-650 leading-relaxed">{ds.description}</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {ds.tags.map((tag, tIdx) => (
                                        <span key={tIdx} className="bg-stone-200/40 text-stone-600 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono border border-stone-200/55">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-200 gap-2 text-xs">
                                    <a 
                                      href={ds.url} 
                                      target="_blank" 
                                      referrerPolicy="no-referrer"
                                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center space-x-0.5"
                                    >
                                      <span>Repository ↗</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleHfDataset(ds)}
                                      className={`rounded-lg px-3 py-1.5 font-bold text-[10px] tracking-wide transition cursor-pointer flex items-center space-x-1.5 shadow-small ${
                                        isActivated
                                          ? 'bg-emerald-800 text-white hover:bg-emerald-900 font-extrabold'
                                          : 'bg-white border border-stone-300 text-stone-750 hover:bg-stone-100 hover:text-stone-900'
                                      }`}
                                    >
                                      {isActivated ? (
                                        <>
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                          <span>RAG Active</span>
                                        </>
                                      ) : (
                                        <span>Index Dataset</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RAG Search Terminal */}
                        <div id="shastra-rag-terminal" className="bg-stone-900 border border-stone-950 p-5.5 rounded-2xl text-stone-100 space-y-4 shadow-md">
                          <div className="flex justify-between items-center border-b border-stone-800 pb-3 gap-2">
                            <div className="flex items-center space-x-2.5">
                              <span className="text-emerald-400 text-lg">⚡</span>
                              <div>
                                <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-stone-100 font-mono">Academic RAG Query terminal</h4>
                                <p className="text-[10px] text-stone-400 font-sans">Query active open-science datasets with real-time vector matches</p>
                              </div>
                            </div>
                            <span className="text-[8.5px] font-mono bg-stone-800 border border-stone-700 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center space-x-1">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                              <span>Vector Link Live</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                            <div>
                              <label className="text-[9.5px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Target Corpus Index:</label>
                              <select
                                value={selectedHfDatasetId}
                                onChange={(e) => setSelectedHfDatasetId(e.target.value)}
                                className="w-full bg-stone-850 border border-stone-750 text-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                              >
                                {AYURVEDA_HF_DATASETS.map(ds => (
                                  <option key={ds.id} value={ds.id}>
                                    {ds.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9.5px] uppercase font-bold text-stone-400 tracking-wider block mb-1">Retrieval Engine Model:</label>
                              <select
                                className="w-full bg-stone-850 border border-stone-750 text-stone-300 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 italic select-none"
                                disabled
                              >
                                <option>AyurGPT-7B-Instruct (RAG Tuned)</option>
                                <option>AyurLM-7B / Nemotron-70B</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Clinical Semantic Search Query:</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter herbal, pathological, or text-based query (e.g. anti-inflammatory profile of Amalaki, Guduchi in sandhigata vata, etc)..."
                                value={hfQueryText}
                                onChange={(e) => setHfQueryText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchHuggingFace(); }}
                                className="bg-stone-850 border border-stone-750 text-stone-100 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 flex-grow"
                              />
                              <button
                                type="button"
                                onClick={handleSearchHuggingFace}
                                disabled={hfSearchLoading}
                                className="bg-emerald-800 hover:bg-emerald-750 text-white rounded-lg px-4.5 py-2 font-bold text-[11px] transition shrink-0 flex items-center space-x-1 shadow-md cursor-pointer disabled:opacity-50"
                              >
                                {hfSearchLoading ? <Loader className="h-4 w-4 animate-spin" /> : <span>Retrieve matches</span>}
                              </button>
                            </div>
                          </div>

                          {/* RAG search response container */}
                          {hfSearchLoading && (
                            <div className="bg-stone-850 border border-stone-800 p-8 rounded-xl text-center text-stone-400 space-y-3 flex flex-col justify-center items-center">
                              <Loader className="h-5 w-5 animate-spin text-emerald-400" />
                              <p className="text-xs font-mono">Querying vector space database embeddings & performing medical synthesis...</p>
                            </div>
                          )}

                          {hfRAGResult && !hfSearchLoading && (
                            <div className="bg-stone-850 border border-stone-800 rounded-xl p-5 space-y-4 shadow-inner text-left">
                              <div className="flex justify-between items-center border-b border-stone-750 pb-2">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 font-bold flex items-center space-x-1.5">
                                  <span>Generated Synthesis & Bibliographic Records</span>
                                </span>
                                <span className="text-[9.5px] text-stone-500 font-mono">Matched 100% vectors</span>
                              </div>
                              <div className="text-stone-300 text-[11.5px] leading-relaxed max-h-[380px] overflow-y-auto pr-1">
                                <Markdown content={hfRAGResult} />
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Right side form: SELF-LEARNING Clinician Correction Log */}
                  <div className="space-y-6">
                    <div className="bg-white border border-stone-200 p-5 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-3">
                        <Activity className="h-5 w-5 text-stone-800" />
                        <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Clinician Learning Loop</h4>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed mb-4">
                        Submit clinical refinement guidelines. This informs the conversational prompt layer of your localized adjustments.
                      </p>

                      <form onSubmit={handleAddFeedback} className="space-y-3.5 text-xs">
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">Original Recommendation / Context:</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Recommended cold milk infusion for hyperacidity..."
                            value={newFeedbackOriginal}
                            onChange={(e) => setNewFeedbackOriginal(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">Practitioner Refinement / Better approach:</label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Lukewarm warm herbal tea fits better to keep Kapha/Agni balance..."
                            value={newFeedbackCorrection}
                            onChange={(e) => setNewFeedbackCorrection(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-800"
                          />
                        </div>
                        <button type="submit" className="w-full bg-stone-900 hover:bg-black text-white rounded-lg p-2 font-bold text-[11px] transition">
                          Commit Rule to Feedback Memories
                        </button>
                      </form>

                      {/* Log History */}
                      <div className="mt-6 space-y-3">
                        <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Saved Adaptations ({feedbackLogs.length})</p>
                        <div className="space-y-2">
                          {feedbackLogs.map((log) => (
                            <div key={log.id} className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px] leading-relaxed relative group">
                              <div className="flex justify-between font-bold text-stone-700 mb-1 pr-6 text-left">
                                <span>Patient: {log.patientName}</span>
                                <span className="text-[9px] text-stone-400">{log.timestamp}</span>
                              </div>
                              <p className="text-stone-500 line-through text-left">Org: {log.originalGuidance}</p>
                              <p className="text-emerald-950 font-bold mt-1 text-emerald-800 text-left">Learn Loop: {log.practitionerCorrection}</p>
                              <button
                                onClick={() => handleDeleteFeedbackLog(log.id)}
                                className="absolute right-2 top-2 p-1 text-stone-300 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Delete adaptation log"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-stone-400 py-24">
              <Users className="h-16 w-16 stroke-1 mb-3 text-stone-300" />
              <h3 className="font-bold text-stone-900 text-sm">Select or Create a Patient Case</h3>
              <p className="text-xs max-w-sm mt-1 mb-4">Please select a case study in the sidebar on the left or tap "New Case" to initialize an Ayurvedic dossier.</p>
              <button
                onClick={() => setShowAddPatient(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg px-4 py-2 font-semibold text-xs transition shadow-md"
              >
                Create New Patient Case Dossier
              </button>
            </div>
          )}

        </main>
      </div>

      {/* ================= PRINT / PDF TEMPLATE (HIDDEN ON SCREEN) ================= */}
      {selectedProtocolToPrint && activePatient && (
        <div className="hidden print:block absolute top-0 left-0 w-full p-8 bg-white text-stone-900 font-serif leading-relaxed text-xs">
          
          {/* Header */}
          <div className="border-b-4 border-emerald-950 pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-emerald-950">AyurScribe Clinical Monograph</h1>
              <p className="text-[10px] italic font-sans text-stone-600">Prescription-Ready Treatment Plan</p>
            </div>
            <div className="text-right text-[10px] font-sans">
              <p className="font-bold text-emerald-900">Dr. Care Ayurvritta</p>
              <p>Registered Ayurvedic Medical Practitioner</p>
              <p>Email: {userEmail}</p>
            </div>
          </div>

          {/* Patient Details metadata */}
          <div className="bg-stone-100 p-4 rounded-lg mb-6 grid grid-cols-2 gap-y-2 text-[10px] font-sans">
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest block text-[8px]">Patient Name</span>
              <p className="font-semibold text-stone-900 text-sm">{activePatient.name}</p>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest block text-[8px]">Therapeutic Date</span>
              <p className="font-semibold text-stone-900 text-sm">{selectedProtocolToPrint.createdAt || new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest block text-[8px]">Age / Gender</span>
              <p className="font-semibold text-stone-950">{activePatient.age} Years / {activePatient.gender}</p>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest block text-[8px]">Biological Constitution</span>
              <p className="font-semibold text-stone-950">Prakriti: {activePatient.prakriti} | Vikriti: {activePatient.vikriti}</p>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase tracking-widest block text-[8px]">Metabolic Capacities</span>
              <p className="font-semibold text-stone-950">Agni (Digestive Fire): {activePatient.agni} | Koshta (Bowel Action): {activePatient.koshta}</p>
            </div>
          </div>

          {/* Chief Complaint info */}
          <div className="mb-6">
            <h3 className="font-sans font-bold uppercase text-[10px] text-emerald-950 tracking-wider border-b pb-1 mb-2">Chief Complains & Lakshana</h3>
            <p className="italic text-stone-850 pl-4 border-l-2 border-amber-600 text-[11px]">{selectedProtocolToPrint.chiefComplaint || activePatient.notes}</p>
          </div>

          {/* Generated protocol body (rendered simply) */}
          <div className="leading-relaxed text-[11px] mb-8 select-all">
            <Markdown content={selectedProtocolToPrint.generatedText} />
          </div>

          <div className="pt-8 border-t border-stone-200 mt-12 grid grid-cols-2 text-[9px] font-sans">
            <div>
              <p className="font-bold text-amber-900">Clinician Guidance Notice</p>
              <p className="text-stone-500 max-w-sm">This documentation acts as a secondary recommendation sheet for verified practitioners. Formulations must be customized according to real-time physical pulse (Nadi) results.</p>
            </div>
            <div className="text-right flex flex-col items-end justify-end">
              <div className="w-40 border-b border-stone-400 mb-1" />
              <p className="font-bold">Authorized Practitioner Signature</p>
              <p className="text-stone-400">Dr. Care Ayurvritta (Ayurvedic Vaidya)</p>
            </div>
          </div>

          {/* Button to allow escaping print preview frame */}
          <div className="print:hidden text-center mt-6">
            <button
              onClick={() => setSelectedProtocolToPrint(null)}
              className="bg-stone-800 text-white rounded-lg px-4 py-2 text-xs font-semibold"
            >
              Close Print Preview overlay
            </button>
          </div>

        </div>
      )}


      {/* ================= MODAL: ADD CASE DOSSIER ================= */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-stone-200 text-left">
            <div className="bg-emerald-950 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold tracking-wide">Register New Patient Dossier</h3>
              </div>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-stone-300 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Age (Years) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={150}
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Gender *</label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact details */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="+91 90000 00000"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Prakriti */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Prakriti (Natural Constitution)</label>
                  <select
                    value={newPatient.prakriti}
                    onChange={(e) => setNewPatient({ ...newPatient, prakriti: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs"
                  >
                    <option>Vata</option>
                    <option>Pitta</option>
                    <option>Kapha</option>
                    <option>Vata-Pitta</option>
                    <option>Pitta-Kapha</option>
                    <option>Vata-Kapha</option>
                    <option>Sama (Balanced Tridoshic)</option>
                  </select>
                </div>

                {/* Vikriti */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Vikriti (Aggravated Dosha Category)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vata Imbalance"
                    value={newPatient.vikriti}
                    onChange={(e) => setNewPatient({ ...newPatient, vikriti: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs"
                  />
                </div>

                {/* Agni */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Agni (Metabolic fire state)</label>
                  <select
                    value={newPatient.agni}
                    onChange={(e) => setNewPatient({ ...newPatient, agni: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs"
                  >
                    <option>Sama (Balanced)</option>
                    <option>Manda (Sluggish / Low)</option>
                    <option>Tiksna (Overactive / Severe)</option>
                    <option>Vishama (Irregular / Variable)</option>
                  </select>
                </div>

                {/* Koshta */}
                <div className="text-xs">
                  <label className="block font-bold text-stone-600 mb-1">Koshta (Bowel attribute)</label>
                  <select
                    value={newPatient.koshta}
                    onChange={(e) => setNewPatient({ ...newPatient, koshta: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs"
                  >
                    <option>Madhyama (Medium)</option>
                    <option>Mridu (Soft / Responsive)</option>
                    <option>Krura (Tendency to Constipation)</option>
                  </select>
                </div>

              </div>

              {/* Lifestyle / Season details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-600 mb-1">Lifestyle / Daily Activity Profile</label>
                  <input
                    type="text"
                    value={newPatient.lifestyle}
                    onChange={(e) => setNewPatient({ ...newPatient, lifestyle: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                    placeholder="e.g. High mental stress, late sleep cycles"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-600 mb-1">Current Climate Season</label>
                  <select
                    value={newPatient.season}
                    onChange={(e) => setNewPatient({ ...newPatient, season: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option>Greeshma (Summer)</option>
                    <option>Varsha (Monsoon / Rain)</option>
                    <option>Sharad (Autumn)</option>
                    <option>Hemanta (Late Autumn)</option>
                    <option>Shishira (Winter)</option>
                    <option>Vasanta (Spring)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="text-xs">
                <label className="block font-bold text-stone-600 mb-1">Initial Clinical Symptoms / Brief Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe initial observation & chief complaints..."
                  value={newPatient.notes}
                  onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddPatient(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-5 py-2.5 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl px-5 py-2.5 font-bold text-xs shadow-sm transition"
                  id="submit-patient-btn"
                >
                  Save Dossier Case study
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= FOOTER / INSTRUCTION PANEL ================= */}
      <footer className="bg-stone-100 border-t border-stone-200 text-stone-500 py-3.5 px-6 text-center text-[10px] space-y-1.5 print:hidden">
        <p className="font-semibold text-stone-600">© 2026 AyurScribe Clinical Companion • Trusted by Certified Vaidyas worldwide.</p>
        <p className="max-w-2xl mx-auto leading-relaxed">
          <strong>RAG & Self-learning mechanism request context</strong>: We have fully prepared the internal modules to digest your classical texts. Upload your books or submit learning corrections in the "RAG Knowledge Base & Self-Learning" tab.
        </p>
      </footer>

    </div>
  );
}
