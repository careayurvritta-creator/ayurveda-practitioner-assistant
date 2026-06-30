export type Intent = 'herb' | 'disease' | 'treatment' | 'diet' | 'dosha' | 'diagnosis' | 'procedure' | 'formulation' | 'general';

export interface ParsedQuery {
  intent: Intent;
  entities: string[];
  primaryCondition: string;
  complexity: 'simple' | 'moderate' | 'complex';
  sanskritTerms: string[];
  isFollowUp: boolean;
  rewrittenQuery: string;
  clinicalPathway: string | null;
}

export const INTENT_KEYWORDS: Record<Intent, string[]> = {
  herb: ['herb', 'plant', 'dravya', 'aushadha', 'medicine', 'tablet', 'capsule', 'churna', 'kwath', 'arista', 'asava', 'gutika', 'bhaisajya', 'kaashtha', 'vati'],
  disease: ['disease', 'vyadhi', 'disorder', 'condition', 'syndrome', 'pathology', 'illness', 'diagnosis', 'roga', 'vikara'],
  treatment: ['treatment', 'chikitsa', 'therapy', 'procedure', 'panchakarma', 'vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'abhyanga', 'pizhichil', 'kati basti', 'greeva basti', 'janu basti', 'shodhana', 'shamana', 'upakrama'],
  diet: ['diet', 'ahara', 'pathya', 'apathya', 'food', 'eat', 'avoid', 'nutritious', 'meal', 'dinacharya', 'ritucharya'],
  dosha: ['vata', 'pitta', 'kapha', 'tridosha', 'dosha', 'vataja', 'pittaja', 'kaphaja', 'doshic', 'prakriti', 'vikriti'],
  diagnosis: ['diagnosis', 'pariksha', 'examination', 'nadi', 'pulse', 'jihva', 'tongue', 'ashtavidha', 'dashavidha', 'prakriti', 'vikriti', 'agni', 'koshta', 'darshana', 'sparshana', 'prashna'],
  procedure: ['procedure', 'karma', 'panchakarma', 'vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'lepa', 'pana', 'dhupa', 'avapeedana', 'dhoomapana'],
  formulation: ['formulation', 'yoga', 'katha', 'kashaya', 'arishta', 'asava', 'taila', 'ghrita', 'churna', 'vati', 'guggulu', 'bhasma', 'rasa'],
  general: [],
};

// Expanded disease-to-Sanskrit mapping (open entity matching)
export const SANSKRIT_DISEASE_MAP: Record<string, string[]> = {
  'diabetes': ['prameha', 'prameha pidika', 'madhumeha', 'kshara meha', 'tikta meha'],
  'hypertension': ['raktagata vata', 'rakta caya', 'dhamani pratichaya'],
  'arthritis': ['amavata', 'sandhi vata', 'vata shleshaka kapha', 'sandhigata vata'],
  'asthma': ['swasa', 'tamaka swasa', 'urdhva swasa', 'mahashwasa', 'chinna swasa'],
  'obesity': ['medoroga', 'sthaulya', 'atisthoulya', 'sthoulya'],
  'hypothyroidism': ['galaganda', 'gandamala', 'apabaahuka'],
  'depression': ['avasada', 'kaphaja unmada', 'manasa mandata', 'chittavISHAYA'],
  'anxiety': ['chittodwega', 'vataja unmada', 'bhaya', 'udyama'],
  'insomnia': ['nidra nasha', 'anidrata', 'vataja nidra', 'nidranash'],
  'gerd': ['amlapitta', 'parinama shula', 'udarshula', 'amlapitta amayascha'],
  'irritable bowel': ['grahani', 'purishavaha srotas', 'koshtagati', 'grahanidosa'],
  'constipation': ['vivandha', 'kostha sanga', 'vataja kostha', 'maha vibandha'],
  'rheumatoid arthritis': ['amavata', 'vata-astheya', 'amavatavyadhi'],
  'psoriasis': ['ekakushta', 'kushta', 'kitibha', 'charmadala'],
  'eczema': ['vicharchika', 'kushta', 'pama', 'sidhma kushta'],
  'uric acid': ['vata raktha', 'vatarakta', 'adhya vata'],
  'kidney stone': ['ashmari', 'mutrashmari', 'sarkara', 'ashmari mutragranthi'],
  'migraine': ['ardhavabhedaka', 'ardhashirah shoola', 'sooryavarta'],
  'back pain': ['kati shoola', 'kati gridhra', 'prishta shoola', 'kati graham'],
  'sciatica': ['gridhrasi', 'laghu ruksha gridhrasi'],
  'gout': ['vatavyadhi', 'vatarakta', 'amavata'],
  'allergic rhinitis': ['pratishyaya', 'vasaka', 'hikka shwasa'],
  'sinusitis': ['dushta pratishyaya', 'pachyaman pratishyaya'],
  'skin rash': ['twak vikara', 'kushtha', 'pitta kushtha'],
  'jaundice': ['kamala', 'pandu roga', 'amlapitta'],
  'anemia': ['pandu roga', 'pandu', 'rakta kshaya'],
  'menstrual disorder': ['artava dosha', 'yonivyapad', 'kashtartava', 'asrigdara'],
  'dysmenorrhea': ['kashtartava', 'yoni shoola', 'artava kshaya'],
  'menopause': ['rajah kshaya', 'rajomoksha kala', 'artava kshaya'],
  'infertility': ['klaibya', 'beeja dosha', 'artava dushya', 'garbhashaya vikara'],
  'headache': ['shirah shoola', 'shirah graham', 'bhrama'],
  'vertigo': ['bhrama', 'pratibhrama', 'tiryak gati'],
  'cold': ['pratishyaya', 'vasaka', 'hikka'],
  'cough': ['kasa', 'kaphaja kasa', 'vataja kasa'],
  'fever': ['jwara', 'tikta jwara', 'vataja jwara', 'pittaja jwara', 'kaphaja jwara'],
  'diarrhea': ['atisara', 'pravahika', 'grahani'],
  'dysentery': ['pravahika', 'raktaatisara', 'sharkaraatisara'],
  'indigestion': ['ajeerna', 'mandagni', 'apaki'],
  'bloating': ['adhimantha', 'tympanites', 'uddvartana'],
  'skin disease': ['kushta', 'twak vikara', 'charmadala'],
  'wound': ['vrana', 'vranashopha', 'dushta vrana'],
  'fracture': ['bhagna', 'asthibhagna', 'sandhi bhagna'],
  'muscle pain': ['mansa shosha', 'mansa gata vata'],
  'joint pain': ['sandhi shoola', 'sandhi gata vata', 'sandhi gata kapha'],
  'eye disease': ['akshi vikara', 'drishti dosha', 'abhishyanda'],
  'ear disease': ['karna roga', 'karna shoola', 'karnanada'],
  'throat disease': ['kantha roga', 'gala shoola', 'kushtha kantha'],
  'dental disease': ['danta roga', 'danta shoola', 'danta kshaya'],
  'heart disease': ['hridroga', 'hridgraha', 'hrishshoola'],
  'liver disease': ['yakrit vikara', 'yakrit pliha vikara', 'kloma vikara'],
  'spleen disease': ['pliha vikara', 'plihodara', 'pliha gulma'],
  'lung disease': ['phuphphusa vikara', 'shwasa', 'kasa'],
  'urinary disease': ['mutra vikara', 'mutragraha', 'mutrashmari'],
  'skin infection': ['kushtha', 'vidradhi', 'arbuda'],
  'boil': ['vidradhi', 'vranaka', 'puyapu'],
  'abscess': ['vidradhi', 'vranapaka', 'arbuda'],
  'cyst': ['granthi', 'arbuda', 'gulma'],
  'tumor': ['arbuda', 'gulma', 'vidradhi'],
  'cancer': ['arbuda', 'granthi', 'gulma', 'apachi'],
  'diabetes insipidus': ['prameha', 'meha', 'uditasya meha'],
  'hypotension': ['raktamanda vata', 'raktakshaya'],
  'pneumonia': ['kasa', 'shwasa', 'jwara'],
  'bronchitis': ['kasa', 'shwasa', 'tamaka swasa'],
  'tuberculosis': ['rajayakshma', 'kshaya roga', 'kshataja kshaya'],
  'epilepsy': ['apasmara', 'smriti bhramsha', 'unmada'],
  'schizophrenia': ['unmada', 'vataja unmada', 'kaphaja unmada'],
  'stroke': ['pakshaghat', 'vata vyadhi', 'ardita'],
  'paralysis': ['pakshaghat', 'vata vyadhi', 'pangu'],
  'muscular dystrophy': ['balya kshaya', 'mansa kshaya', 'dhatu kshaya'],
  'osteoporosis': ['asthi kshaya', 'asthi bhagna', 'sandhi gata vata'],
  'fibromyalgia': ['mansa vata', 'sandhi gata vata', 'mansa shosha'],
  'chronic fatigue': ['dhatu kshaya', 'mandagni', 'vata vyadhi'],
  'autoimmune': ['ama vata', 'amavata', 'vyadhi kshamatva'],
  'thyroid': ['galaganda', 'gandamala', 'apabaahuka'],
  'thyroid hyper': ['galaganda', 'vataja galaganda', 'pitta galaganda'],
  'thyroid hypo': ['galaganda', 'kaphaja galaganda', 'medo viddha'],
  'uti': ['mutra krichra', 'mutra dosha', 'prameha', 'mutragraha'],
  'urinary tract infection': ['mutra krichra', 'mutra jwara', 'mutra dosha'],
  'tonsillitis': ['tundikeri', 'kantha shoola', 'kantha kotha', 'gala shoola'],
  'acne': ['yauvan pidika', 'muhamshika', 'tarunyam pika', 'pudaka'],
  'pimple': ['yauvan pidika', 'muhamshika', 'pidika'],
  'pcos': ['granthi artava dushti', 'artava granthi', 'stree beeja dosha'],
  'pcod': ['granthi artava dushti', 'artava dushti'],
  'polycystic ovary': ['granthi artava dushti', 'artava granthi', 'artava dushti'],
  'infertility female': ['vandhyatva', 'vandhya', 'artava dushti', 'garbhashaya vikara'],
  'dry eye': ['shushka akshipaka', 'drishti kshaya', 'akshi shushkata'],
  'gum disease': ['danta vibhramsa', 'danta mula shotha', 'danta pushpa vikara'],
  'periodontitis': ['danta vibhramsa', 'danta mula gata roga'],
  'gingivitis': ['danta mula shotha', 'danta vibhramsa'],
  'lupus': ['vyadhi kshamatva dushti', 'vyadhi', 'autoimmune vyadhi'],
  'autoimmune disease': ['vyadhi kshamatva dushti', 'amavata', 'vyadhi kshamatva'],
  'pediatric': ['bala roga', 'kaumara bhritya', 'balya'],
  'child immunity': ['abhisyandini', 'vyadhikshamatva kshaya', 'bala'],
};

// Expanded herb synonyms
export const SANSKRIT_SYNONYMS: Record<string, string[]> = {
  'triphala': ['triphala', 'three fruits', 'amla bibhitaka haritaki', 'triphala churna'],
  'ashwagandha': ['ashvagandha', 'withania somnifera', 'balya', 'vayahstha', 'ashwagandha churna', 'ashwagandha vati'],
  'shatavari': ['shatavari', 'asparagus racemosus', 'stree revna', 'bala', 'shatavari churna'],
  'turmeric': ['haridra', 'curcuma longa', 'nisha', 'varnada', 'haridra churna'],
  'ghee': ['ghrita', 'ghee', 'clarified butter', 'samskara', 'ghritam'],
  'oil massage': ['abhyanga', 'oil massage', 'sneha', 'snehana', 'taila abhyanga'],
  'fenugreek': ['methi', 'trigonella foenum', 'methika', 'dipaniya', 'methi seeds'],
  'ginger': ['adrak', 'zingiber officinale', 'adrakam', 'vishwa', 'sunthi', 'shunthi'],
  'boswellia': ['salai', 'boswellia serrata', 'kunduru', 'shallaki', 'guggulu'],
  'commiphora': ['guggulu', 'commiphora mukul', 'guggul', 'mahishasha'],
  'neem': ['nimba', 'azadirachta indica', 'arishtha', 'premna', 'nimba churna'],
  'tulsi': ['tulsi', 'ocimum sanctum', 'basil', 'sacred basil', 'tulsi vati'],
  'amalaki': ['amalaki', 'emblica officinalis', 'amla', 'dhatri', 'amalaki churna'],
  'bibhitaki': ['bibhitaki', 'terminalia bellirica', 'viteda', 'vibhitaka'],
  'haritaki': ['haritaki', 'terminalia chebula', 'vijaya', 'abaya', 'haritaki churna'],
  'brahmi': ['brahmi', 'bacopa monnieri', 'jalanili', 'manjari', 'brahmi vati'],
  'guduchi': ['guduchi', 'tinospora cordifolia', 'amrita', 'madhuparni', 'guduchi satva'],
  'shilajit': ['shilajit', 'asphaltum', 'silajatu', 'shilajatu'],
  'bhringaraj': ['bhringaraj', 'eclipta alba', 'kesharaja', 'makaradhvaja'],
  'yastimadhu': ['yastimadhu', 'glycyrrhiza glabra', 'mulethi', 'madhuyashti'],
  'kutaja': ['kutaja', 'holarrhena antidysenterica', 'indrayava', 'kutaja churna'],
  'musta': ['musta', 'cyperus rotundus', 'nagarmotha', 'mustak'],
  'shatapushpa': ['shatapushpa', 'anethum sowa', 'dill', 'shatapushpadi'],
  'jeeraka': ['jeeraka', 'cuminum cyminum', 'cumin', 'jira'],
  'dhanyaka': ['dhanyaka', 'coriandrum sativum', 'coriander', 'dhania'],
  'elachi': ['elachi', 'elettaria cardamomum', 'cardamom', 'ela'],
  'laung': ['laung', 'syzygium aromaticum', 'clove', 'lavanga'],
  'dalchini': ['dalchini', 'cinnamomum zeylanicum', 'cinnamon', 'twak'],
  'ajwain': ['ajwain', 'trachyspermum ammi', 'carom seeds', 'yavani'],
  'ajmoda': ['ajmoda', 'apium graveolens', 'celery seeds', 'ajamoda'],
  'maricha': ['maricha', 'piper nigrum', 'black pepper', 'marich'],
  'pippali': ['pippali', 'piper longum', 'long pepper', 'pippali mula'],
  'chitraka': ['chitraka', 'plumbago zeylanica', 'chitrak', 'vitanga'],
  'vidanga': ['vidanga', 'embelia ribes', 'false black pepper', 'vidanga'],
  'kushtha': ['kushtha', 'skin disease', 'dermatosis'],
};

// Clinical pathway mappings — common treatment patterns
export const CLINICAL_PATHWAYS: Record<string, {
  diagnosis: string;
  dosha: string;
  treatment: string;
  herbs: string[];
  procedures: string[];
  keywords?: string[];
  formulations?: string[];
  diet?: string[];
  lifestyle?: string[];
}> = {
  // ═══════════════════════════════════════════════════════════════
  // EXISTING PATHWAYS (kept unchanged)
  // ═══════════════════════════════════════════════════════════════
  'amavata': {
    diagnosis: 'Rheumatoid Arthritis (Amavata)',
    dosha: 'Vata (Ama-Vata)',
    treatment: 'Ama pachana → Shamana → Shamshodhana',
    herbs: ['Guggulu', 'Guduchi', 'Shunthi', 'Pippali', 'Haridra', 'Ashwagandha'],
    procedures: ['Basti', 'Abhyanga', 'Swedana', 'Pinda Sweda'],
  },
  'prameha': {
    diagnosis: 'Diabetes Mellitus (Prameha)',
    dosha: 'Kapha (Medo-Dhatu)',
    treatment: 'Langhana → Shamana → Rasayana',
    herbs: ['Guduchi', 'Meshashringi', 'Amalaki', 'Haridra', 'Vijaysar', 'Bilva'],
    procedures: ['Virechana', 'Basti', 'Udvartana'],
  },
  'jwara': {
    diagnosis: 'Fever (Jwara)',
    dosha: 'Sannipata (Tridosha)',
    treatment: 'Langhana → Pachana → Shamana',
    herbs: ['Guduchi', 'Tinospora', 'Neem', 'Tulsi', 'Shunthi', 'Parpata'],
    procedures: ['Virechana', 'Sheetala Upanaha', 'Guduchyadi Kashayam'],
  },
  'shwasa': {
    diagnosis: 'Asthma (Shwasa)',
    dosha: 'Vata-Kapha',
    treatment: 'Snehana → Swedana → Shamana',
    herbs: ['Vasa', 'Pushkarmool', 'Kantakari', 'Shirisha', 'Haridra', 'Pippali'],
    procedures: ['Vamana', 'Nasya', 'Pizhichil'],
  },
  'kashta artava': {
    diagnosis: 'Dysmenorrhea (Kashtartava)',
    dosha: 'Vata (Vata-Kapha)',
    treatment: 'Snehana → Swedana → Shamana',
    herbs: ['Ashwagandha', 'Shatavari', 'Dashamula', 'Guduchi', 'Guggulu', 'Lodhra'],
    procedures: ['Basti', 'Pichcha Basti', 'Kati Basti', 'Uttara Basti'],
  },
  'apasmara': {
    diagnosis: 'Epilepsy (Apasmara)',
    dosha: 'Vata-Kapha',
    treatment: 'Shamana → Rasayana',
    herbs: ['Brahmi', 'Shankhpushpi', 'Vacha', 'Jatamansi', 'Tagar', 'Kushtha'],
    procedures: ['Nasya', 'Shirodhara', 'Shirolepa'],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXPANDED PATHWAYS (27 new disease categories)
  // ═══════════════════════════════════════════════════════════════

  // ── 7. RESPIRATORY — Asthma / Bronchitis ──────────────────────
  'tamaka_shwasa': {
    diagnosis: 'Bronchial Asthma (Tamaka Shwasa)',
    dosha: 'Vata-Kapha (Pranavaha Srotas)',
    treatment: 'Snehapana → Swedana → Vamana → Shamana',
    herbs: ['Vasa (Adhatoda vasica)', 'Pushkarmool (Inula racemosa)', 'Kantakari (Solanum xanthocarpum)', 'Shirisha (Albizia lebbeck)', 'Haridra (Curcuma longa)', 'Pippali (Piper longum)'],
    procedures: ['Vamana (emesis)', 'Nasya (nasal medication)', 'Pizhichil (oil bath)', 'Steam inhalation'],
    keywords: ['asthma', 'bronchitis', 'shwasa', 'tamaka shwasa', 'wheezing', 'breathlessness', 'respiratory'],
    formulations: ['Sitopaladi Churna', 'Talisadi Churna', 'Kantakaryavaleha', 'Shirishavaleha', 'Vasakashta Kashaya'],
    diet: ['Warm soups and gruels (yusha)', 'Barley (yava) preparations', 'Honey (madhu) with warm water', 'Avoid cold and heavy foods', 'Avoid dairy at night', 'Freshly cooked warm meals'],
    lifestyle: ['Avoid exposure to cold wind and dust', 'Practice pranayama (Anulom-Vilom, Bhastrika)', 'Regular steam inhalation with eucalyptus oil', 'Sleep in well-ventilated room', 'Avoid physical exertion in cold weather'],
  },

  // ── 8. DIGESTIVE — IBS / Colitis ──────────────────────────────
  'grahanigraha': {
    diagnosis: 'Irritable Bowel Syndrome (Grahaṇī)',
    dosha: 'Vata-Kapha (Annavaha & Purishavaha Srotas)',
    treatment: 'Deepana → Pachana → Grahi → Rasayana',
    herbs: ['Kutaja (Holarrhena antidysenterica)', 'Musta (Cyperus rotundus)', 'Bilva (Aegle marmelos)', 'Dhataki (Woodfordia fruticosa)', 'Shunthi (Zingiber officinale)', 'Pippali (Piper longum)'],
    procedures: ['Basti (medicated enema)', 'Abhyanga (abdominal massage)', 'Swedana (fomentation)', 'Uttara Basti'],
    keywords: ['ibs', 'irritable bowel', 'grahani', 'colitis', 'diarrhea', 'loose stools', 'digestive disorder', 'bowel'],
    formulations: ['Bilvadi Churna', 'Kutaja Ghana Vati', 'Grahi Churna', 'Takrarishta', 'Dhataki Pushpasava'],
    diet: ['Freshly cooked warm foods', 'Buttermilk (takra) with rock salt', 'Rice gruel (manda) with cumin', 'Avoid raw salads and cold foods', 'Avoid fermented and stale foods', 'Eat at regular intervals'],
    lifestyle: ['Maintain regular eating schedule', 'Avoid stress and anxiety', 'Moderate physical activity', 'Avoid sleeping during daytime', 'Practice grounding meditation'],
  },

  // ── 9. DIGESTIVE — GERD / Acidity ─────────────────────────────
  'amlapittagraha': {
    diagnosis: 'Gastroesophageal Reflux (Amlapitta)',
    dosha: 'Pitta (Anna Pachaka Agni)',
    treatment: 'Pitta Shamana → Grahi → Rasayana',
    herbs: ['Amalaki (Emblica officinalis)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Shatavari (Asparagus racemosus)', 'Guduchi (Tinospora cordifolia)', 'Chandana (Santalum album)', 'Sariva (Hemidesmus indicus)'],
    procedures: ['Pitta-shamana Nasya', 'Shirodhara with cooling oils', 'Takradhara'],
    keywords: ['gerd', 'acidity', 'acid reflux', 'amlapitta', 'heartburn', 'hyperacidity', 'indigestion', 'gastritis'],
    formulations: ['Amalaki Avaleha', 'Sarivadyasava', 'Ushirasava', 'Kamadugha Rasa', 'Mukta Yukti Rasa'],
    diet: ['Sweet, bitter, and astringent tastes', 'Cold milk and ghee', 'Coconut water and cucumber', 'Avoid spicy, sour, and fried foods', 'Avoid coffee, alcohol, and tobacco', 'Light dinners early in the evening'],
    lifestyle: ['Do not lie down immediately after meals', 'Elevate head while sleeping', 'Avoid stress and late-night eating', 'Walk for 15 minutes after dinner', 'Practice Sheetali pranayama'],
  },

  // ── 10. LIVER — Jaundice / Hepatitis ───────────────────────────
  'kamalapandu': {
    diagnosis: 'Jaundice / Hepatitis (Kamala)',
    dosha: 'Pitta (Rakta & Yakrit Dushti)',
    treatment: 'Pitta Shamana → Shodhana → Rasayana',
    herbs: ['Kutaja (Holarrhena antidysenterica)', 'Bhumyamalaki (Phyllanthus niruri)', 'Bhringaraj (Eclipta alba)', 'Guduchi (Tinospora cordifolia)', 'Kalmegh (Andrographis paniculata)', 'Sharpunkha (Tephrosia purpurea)'],
    procedures: ['Virechana (purgation)', 'Raktamokshana (bloodletting)', 'Pitta-shamana Basti', 'Lepa over hepatomegaly area'],
    keywords: ['jaundice', 'hepatitis', 'kamala', 'liver', 'hepatic', 'bilirubin', 'yellow', 'pandu'],
    formulations: ['Kutaja Ghrita', 'Bhumyamalaki Kashaya', 'Arogyavardhini Vati', 'Kumaryasava', 'Bhringaraj Taila'],
    diet: ['Bitter gourd (karela) juice', 'Sugarcane juice with lemon', 'Barley water (yavagu)', 'Light and easily digestible foods', 'Avoid oily, spicy, and fried foods', 'Avoid alcohol completely'],
    lifestyle: ['Complete rest during acute phase', 'Avoid strenuous physical activity', 'Maintain hygiene to prevent spread', 'Avoid exposure to hepatotoxins', 'Regular sleep schedule'],
  },

  // ── 11. KIDNEY — Renal Calculus ────────────────────────────────
  'ashmarichharana': {
    diagnosis: 'Renal Calculus (Ashmari)',
    dosha: 'Vata-Kapha (Mutravaha Srotas)',
    treatment: 'Ashmari Bhedana → Mutra Virajaniya → Rasayana',
    herbs: ['Pashanbheda (Bergenia ligulata)', 'Varuna (Crataeva nurvala)', 'Kulattha (Dolichos biflorus)', 'Shilajit (Asphaltum)', 'Gokshura (Tribulus terrestris)', 'Punarnava (Boerhavia diffusa)'],
    procedures: ['Basti (medicated enema)', 'Uttara Basti', 'Swedana over lumbar region', 'Yoga postures for stone expulsion'],
    keywords: ['kidney stone', 'renal calculus', 'ashmari', 'urinary stone', 'nephrolithiasis', 'renal colic', 'lithiasis'],
    formulations: ['Cystone Tablets', 'Chandraprabha Vati', 'Varunadi Kashaya', 'Gokshuradi Guggulu', 'Pashanbheda Churna'],
    diet: ['Barley water (yava kshara)', 'Lemon water (nimba pani)', 'Ridge gourd (turai) juice', 'Avoid oxalate-rich foods (spinach, tomato)', 'Avoid excessive salt and protein', 'Drink plenty of warm water'],
    lifestyle: ['Regular walking and light exercise', 'Avoid holding urine for long', 'Yoga: Paschimottanasana, Bhujangasana', 'Maintain healthy body weight', 'Avoid sedentary lifestyle'],
  },

  // ── 12. URINARY — UTI ──────────────────────────────────────────
  'mutrakrichra': {
    diagnosis: 'Urinary Tract Infection (Mutra Krichra)',
    dosha: 'Vata-Pitta (Mutravaha Srotas)',
    treatment: 'Mutra Virajaniya → Pitta Shamana → Shamana',
    herbs: ['Gokshura (Tribulus terrestris)', 'Punarnava (Boerhavia diffusa)', 'Daruharidra (Berberis aristata)', 'Palasha (Butea monosperma)', 'Shatavari (Asparagus racemosus)', 'Kulattha (Dolichos biflorus)'],
    procedures: ['Uttara Basti (urethral irrigation)', 'Pitta-shamana Basti', 'Nadi Sweda', 'Vasti Karma'],
    keywords: ['uti', 'urinary tract infection', 'mutra krichra', 'dysuria', 'burning urination', 'urinary infection', 'bladder infection'],
    formulations: ['Gokshuradi Guggulu', 'Chandraprabha Vati', 'Punarnavadi Kashaya', 'Daruharidra Churna', 'Shatavari Kalpa'],
    diet: ['Plenty of water and barley water', 'Cucumber and bottle gourd (lauki)', 'Cranberry-like fruits (kramuka)', 'Avoid spicy, sour, and salty foods', 'Avoid alcohol and caffeine', 'Light, easily digestible meals'],
    lifestyle: ['Maintain personal hygiene', 'Do not hold urine for prolonged periods', 'Wear clean, cotton undergarments', 'Avoid sitting in damp places', 'Practice adequate hydration'],
  },

  // ── 13. NEUROLOGICAL — Paralysis ───────────────────────────────
  'pakshaghatavyavastha': {
    diagnosis: 'Paralysis / Hemiplegia (Pakshaghat)',
    dosha: 'Vata (Vata Prakopa — Rasa-Rakta Dhatu Gata)',
    treatment: 'Snehana → Swedana → Vata Shamana → Balya Rasayana',
    herbs: ['Ashwagandha (Withania somnifera)', 'Bala (Sida cordifolia)', 'Guduchi (Tinospora cordifolia)', 'Dashamula (Ten roots)', 'Shunthi (Zingiber officinale)', 'Pippali (Piper longum)'],
    procedures: ['Abhyanga (oil massage)', 'Pizhichil (oil bath therapy)', 'Shirodhara', 'Nasya (nasal medication)', 'Basti (medicated enema)'],
    keywords: ['paralysis', 'pakshaghat', 'hemiplegia', 'stroke', 'palsy', 'limb weakness', 'neurological'],
    formulations: ['Ashwagandha Churna', 'Bala Taila', 'Dashamula Kashaya', 'Maharasnadi Kashaya', 'Ksheerabala Taila (for Nasya)'],
    diet: ['Warm, nourishing soups and gruels', 'Ghee with warm milk', 'Bala root powder with milk', 'Avoid cold, dry, and light foods', 'Foods that increase Kapha for nourishment', 'Well-cooked, spiced meals'],
    lifestyle: ['Regular oil massage (Abhyanga) daily', 'Physiotherapy and gentle mobilization', 'Sunlight exposure in morning', 'Warm and comfortable environment', 'Caregiver-assisted passive exercises'],
  },

  // ── 14. NEUROLOGICAL — Facial Palsy ────────────────────────────
  'arditavyavastha': {
    diagnosis: 'Facial Palsy (Ardita)',
    dosha: 'Vata (Mukha Vaha Srotas — Vata Prakopa)',
    treatment: 'Snehana → Swedana → Nasya → Vata Shamana',
    herbs: ['Brahmi (Bacopa monnieri)', 'Ashwagandha (Withania somnifera)', 'Shunthi (Zingiber officinale)', 'Vacha (Acorus calamus)', 'Bala (Sida cordifolia)', 'Eranda (Ricinus communis)'],
    procedures: ['Nasya (medicated nasal drops)', 'Mukha Abhyanga (facial massage)', 'Shirodhara', 'Takradhara', 'Pizhichil (head)'],
    keywords: ['facial palsy', 'ardita', 'bell\'s palsy', 'facial paralysis', 'facial nerve', 'face weakness', 'twak'],
    formulations: ['Ksheerabala Taila (Nasya)', 'Brahmi Ghrita', 'Vacha Churna', 'Mahanarayana Taila', 'Ashwagandha Churna with milk'],
    diet: ['Warm, soft foods easy to chew', 'Ghee-processed foods', 'Warm milk with turmeric', 'Avoid cold and dry foods', 'Sesame oil pulling', 'Nutritious soups and stews'],
    lifestyle: ['Facial exercises and massage daily', 'Keep face warm and protected from wind', 'Apply warm compresses', 'Practice facial yoga', 'Avoid cold water on face'],
  },

  // ── 15. MUSCULOSKELETAL — Chronic Back Pain ────────────────────
  'katishulagraha': {
    diagnosis: 'Chronic Low Back Pain (Kati Shula)',
    dosha: 'Vata (Kati Pradesha — Asthi-Majja Gata Vata)',
    treatment: 'Snehana → Swedana → Basti → Vata Shamana',
    herbs: ['Guggulu (Commiphora mukul)', 'Eranda (Ricinus communis)', 'Dashamula (Ten roots)', 'Shallaki (Boswellia serrata)', 'Nirgundi (Vitex negundo)', 'Ashwagandha (Withania somnifera)'],
    procedures: ['Kati Basti (lumbar oil pool)', 'Abhyanga (oil massage)', 'Pizhichil', 'Udvartana', 'Nadi Sweda'],
    keywords: ['back pain', 'lower back', 'kati shula', 'lumbar', 'spine', 'lumbago', 'backache', 'kati'],
    formulations: ['Yogaraj Guggulu', 'Dashamula Kashaya', 'Mahanarayana Taila', 'Kati Basti oil blend', 'Eranda Taila (castor oil)'],
    diet: ['Warm, soupy foods', 'Ginger and garlic preparations', 'Avoid cold, raw, and dry foods', 'Sesame seed preparations', 'Warm milk with Ashwagandha', 'Anti-inflammatory spices (turmeric, fenugreek)'],
    lifestyle: ['Avoid prolonged sitting or standing', 'Use lumbar support while sitting', 'Gentle stretching exercises daily', 'Yoga: Bhujangasana, Makarasana, Shavasana', 'Sleep on firm mattress'],
  },

  // ── 16. MUSCULOSKELETAL — Sciatica ─────────────────────────────
  'gridhrasivyavastha': {
    diagnosis: 'Sciatica (Gridhrasi)',
    dosha: 'Vata (Kati-Pada Gata Vata)',
    treatment: 'Snehapana → Basti → Vata Shamana → Balya',
    herbs: ['Eranda (Ricinus communis)', 'Guggulu (Commiphora mukul)', 'Dashamula (Ten roots)', 'Nirgundi (Vitex negundo)', 'Shallaki (Boswellia serrata)', 'Ashwagandha (Withania somnifera)'],
    procedures: ['Kati Basti', 'Pizhichil (lower limb)', 'Abhyanga with Eranda Taila', 'Nadi Sweda', 'Yoga Basti'],
    keywords: ['sciatica', 'gridhrasi', 'sciatic nerve', 'leg pain', 'radiating pain', 'buttock pain', 'nerve pain'],
    formulations: ['Gokshuradi Guggulu', 'Dashamula Kashaya', 'Eranda Paka', 'Mahamanjishthadi Kashaya', 'Mahanarayana Taila'],
    diet: ['Warm, nourishing foods', 'Ghee and sesame oil in cooking', 'Avoid raw vegetables and salads', 'Warm milk with turmeric at night', 'Bitter gourd and drumstick soup', 'Easy-to-digest cooked meals'],
    lifestyle: ['Avoid bending and lifting heavy objects', 'Sleep on firm surface with knee support', 'Gentle walking daily', 'Yoga: Ardha Matsyendrasana, Pawanmuktasana', 'Apply warm compresses to lower back'],
  },

  // ── 17. MUSCULOSKELETAL — Gout ─────────────────────────────────
  'vataraktavyavastha': {
    diagnosis: 'Gout / Gouty Arthritis (Vatarakta)',
    dosha: 'Vata-Pitta (Rakta Vaha Srotas — Vata Prakopa)',
    treatment: 'Rakta Shodhana → Vata Shamana → Shamshodhana',
    herbs: ['Haridra (Curcuma longa)', 'Guduchi (Tinospora cordifolia)', 'Kiratatikta (Swertia chirata)', 'Sariva (Hemidesmus indicus)', 'Guggulu (Commiphora mukul)', 'Manjishha (Rubia cordifolia)'],
    procedures: ['Raktamokshana (leech therapy)', 'Lepa (paste application)', 'Virechana', 'Pitta-shamana Basti'],
    keywords: ['gout', 'vatarakta', 'uric acid', 'gouty arthritis', 'podagra', 'uric', 'toe pain', 'metatarsal'],
    formulations: ['Kaishore Guggulu', 'Arogyavardhini Vati', 'Sarivadyasava', 'Guduchyadi Kashaya', 'Haridra Khanda'],
    diet: ['Avoid red meat, organ meats, and seafood', 'Avoid alcohol, especially beer', 'Cherry and pomegranate juice', 'Bitter vegetables (bitter gourd, ridge gourd)', 'Avoid spinach, cauliflower, and lentils', 'Plenty of water and alkaline foods'],
    lifestyle: ['Maintain healthy body weight', 'Regular low-impact exercise', 'Avoid fasting for long periods', 'Keep affected joint elevated', 'Avoid cold and damp exposure'],
  },

  // ── 18. ENT — Chronic Sinusitis ────────────────────────────────
  'dushtapratishyayavyavastha': {
    diagnosis: 'Chronic Sinusitis (Dushta Pratishyaya)',
    dosha: 'Kapha (Shiravaha & Pranavaha Srotas)',
    treatment: 'Kapha Shamana → Nasya → Shamshodhana',
    herbs: ['Vasa (Adhatoda vasica)', 'Haridra (Curcuma longa)', 'Pippali (Piper longum)', 'Trikatu (three peppers)', 'Karkatshringi (Pistacia integerrima)', 'Shirisha (Albizia lebbeck)'],
    procedures: ['Nasya (medicated nasal drops)', 'Nasa Putapaka', 'Lepa over sinuses', 'Dhoomapana (smoking therapy)'],
    keywords: ['sinusitis', 'sinus', 'dushta pratishyaya', 'sinus headache', 'nasal congestion', 'post-nasal drip', 'sinus infection'],
    formulations: ['Trikatu Churna', 'Sitopaladi Churna', 'Nasikadi Taila', 'Pippali Vati', 'Vyoshadi Vati'],
    diet: ['Warm and light foods', 'Avoid dairy and cold drinks', 'Honey with warm water', 'Spiced soups and broths', 'Avoid fried and heavy foods', 'Ginger and black pepper in cooking'],
    lifestyle: ['Steam inhalation with eucalyptus', 'Nasal saline irrigation (Jala Neti)', 'Avoid dusty and cold environments', 'Keep head elevated while sleeping', 'Practice Kapalbhati pranayama'],
  },

  // ── 19. ENT — Allergic Rhinitis ────────────────────────────────
  'pratishyayavyavastha': {
    diagnosis: 'Allergic Rhinitis (Pratishyaya)',
    dosha: 'Vata-Kapha (Pranavaha & Shirovaha Srotas)',
    treatment: 'Kapha Shamana → Nasya → Vyadhi Kshamatva Vardhana',
    herbs: ['Tulsi (Ocimum sanctum)', 'Haridra (Curcuma longa)', 'Vasa (Adhatoda vasica)', 'Pippali (Piper longum)', 'Guduchi (Tinospora cordifolia)', 'Shirisha (Albizia lebbeck)'],
    procedures: ['Nasya (Anu Taila)', 'Steam inhalation', 'Nasa Putapaka', 'Lepa over frontal region'],
    keywords: ['allergic rhinitis', 'pratishyaya', 'hay fever', 'sneezing', 'runny nose', 'nasal allergy', 'allergy'],
    formulations: ['Anu Taila (Nasya)', 'Trikatu Churna', 'Sitopaladi Churna', 'Guduchyadi Kashaya', 'Shirishavaleha'],
    diet: ['Avoid known allergenic foods', 'Warm foods and drinks', 'Avoid cold and iced beverages', 'Honey and turmeric with warm water', 'Fresh fruits and vegetables', 'Avoid processed and packaged foods'],
    lifestyle: ['Identify and avoid allergen triggers', 'Use air purifiers and masks', 'Keep windows closed during high pollen', 'Regular exercise to boost immunity', 'Practice Pranayama (Anulom-Vilom)'],
  },

  // ── 20. ENT — Tonsillitis ──────────────────────────────────────
  'tundikerigraha': {
    diagnosis: 'Tonsillitis (Tundikeri)',
    dosha: 'Kapha-Pitta (Kanthavaha Srotas)',
    treatment: 'Kapha Shamana → Pitta Shamana → Krimighna',
    herbs: ['Haridra (Curcuma longa)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Vasa (Adhatoda vasica)', 'Trikatu', 'Karkatshringi (Pistacia integerrima)', 'Elachi (Elettaria cardamomum)'],
    procedures: ['Kavala (gargling)', 'Gandoosha (oil pulling)', 'Nasya', 'Lepa over throat region'],
    keywords: ['tonsillitis', 'tonsils', 'tundikeri', 'throat infection', 'sore throat', 'pharyngitis', 'tonsil enlargement'],
    formulations: ['Khadiradi Vati', 'Trikatu Churna', 'Yashtimadhu Churna', 'Haridra Khanda', 'Talisadi Churna'],
    diet: ['Warm liquids and soups', 'Avoid cold and frozen foods', 'Honey with warm water for gargle', 'Soft, easy-to-swallow foods', 'Avoid spicy and sour foods', 'Turmeric milk at bedtime'],
    lifestyle: ['Avoid cold exposure to throat', 'Gargle with warm saline water', 'Avoid shouting or straining voice', 'Keep throat warm with scarf', 'Practice steam inhalation'],
  },

  // ── 21. DERMATOLOGICAL — Psoriasis ─────────────────────────────
  'kitibhakushthavyavastha': {
    diagnosis: 'Psoriasis (Kitibha Kushtha)',
    dosha: 'Vata-Kapha (Rakta & Twak Dushti)',
    treatment: 'Rakta Shodhana → Lepa → Vata Shamana',
    herbs: ['Haridra (Curcuma longa)', 'Neem (Azadirachta indica)', 'Manjishha (Rubia cordifolia)', 'Guduchi (Tinospora cordifolia)', 'Sariva (Hemidesmus indicus)', 'Khadira (Acacia catechu)'],
    procedures: ['Raktamokshana (leech therapy)', 'Lepa (paste application)', 'Pitta-shamana Basti', 'Takradhara'],
    keywords: ['psoriasis', 'kitibha', 'kushtha', 'skin plaques', 'scaling', 'dry skin', 'autoimmune skin', 'skin disease'],
    formulations: ['Kaishore Guggulu', 'Arogyavardhini Vati', 'Manjishthadi Kashaya', 'Khadirarishta', 'Haridra Khanda'],
    diet: ['Bitter and astringent foods', 'Neem leaves and bitter gourd', 'Avoid red meat and processed foods', 'Avoid alcohol and fermented foods', 'Ghee and sesame oil in cooking', 'Fresh vegetables and whole grains'],
    lifestyle: ['Regular oil massage with medicated oils', 'Avoid stress and emotional disturbances', 'Moderate sun exposure', 'Keep skin moisturized', 'Wear cotton clothing', 'Avoid harsh soaps and chemicals'],
  },

  // ── 22. DERMATOLOGICAL — Eczema / Dermatitis ───────────────────
  'visarpakushtha': {
    diagnosis: 'Eczema / Dermatitis (Visarpa)',
    dosha: 'Pitta-Kapha (Rakta & Twak Dushti)',
    treatment: 'Pitta Shamana → Lepa → Rakta Prasadana',
    herbs: ['Neem (Azadirachta indica)', 'Haridra (Curcuma longa)', 'Khadira (Acacia catechu)', 'Manjishha (Rubia cordifolia)', 'Sariva (Hemidesmus indicus)', 'Chandana (Santalum album)'],
    procedures: ['Lepa (paste application)', 'Pitta-shamana Basti', 'Dhupana (fumigation)', 'Takradhara'],
    keywords: ['eczema', 'dermatitis', 'visarpa', 'skin rash', 'itchy skin', 'atopic dermatitis', 'contact dermatitis', 'skin inflammation'],
    formulations: ['Panchatikta Ghrita Guggulu', 'Kaishore Guggulu', 'Neem Churna', 'Chandanasava', 'Khadirarishta'],
    diet: ['Bitter, sweet, and astringent tastes', 'Avoid sour, salty, and spicy foods', 'Fresh fruits and vegetables', 'Avoid nightshades (potato, tomato)', 'Cooling foods: cucumber, melon', 'Avoid citrus fruits during flare-ups'],
    lifestyle: ['Keep skin cool and moisturized', 'Avoid excessive scratching', 'Use mild, natural soaps', 'Avoid synthetic clothing', 'Maintain cool body temperature', 'Practice stress-reduction techniques'],
  },

  // ── 23. DERMATOLOGICAL — Acne Vulgaris ──────────────────────────
  'yauvanpidikavyavastha': {
    diagnosis: 'Acne Vulgaris (Yauvan Pidika)',
    dosha: 'Pitta-Kapha (Rakta & Medo Dhatu Dushti)',
    treatment: 'Rakta Shodhana → Lepa → Pitta Shamana',
    herbs: ['Haridra (Curcuma longa)', 'Neem (Azadirachta indica)', 'Khadira (Acacia catechu)', 'Manjishha (Rubia cordifolia)', 'Sariva (Hemidesmus indicus)', 'Guduchi (Tinospora cordifolia)'],
    procedures: ['Lepa (face pack)', 'Raktamokshana (if severe)', 'Nasya', 'Virechana (in chronic cases)'],
    keywords: ['acne', 'pimples', 'yauvan pidika', 'pustules', 'blackheads', 'whiteheads', 'breakout', 'teen acne'],
    formulations: ['Kaishore Guggulu', 'Khadirarishta', 'Haridra Khanda', 'Neem Churna paste', 'Manjishthadi Kashaya'],
    diet: ['Avoid oily, fried, and junk foods', 'Avoid dairy products and sugar', 'Bitter vegetables: bitter gourd, fenugreek', 'Fresh fruits and green vegetables', 'Plenty of water and herbal teas', 'Avoid chocolate and processed foods'],
    lifestyle: ['Keep face clean with gentle cleanser', 'Avoid touching face frequently', 'Use non-comedogenic products', 'Regular exercise to detoxify', 'Adequate sleep (7-8 hours)', 'Manage stress through meditation'],
  },

  // ── 24. GYNECOLOGICAL — Menstrual Disorder ──────────────────────
  'artavadustivyavastha': {
    diagnosis: 'Menstrual Disorder (Artava Dushti)',
    dosha: 'Vata-Pitta (Artava Vaha Srotas)',
    treatment: 'Vata Shamana → Artava Janani → Rasayana',
    herbs: ['Shatavari (Asparagus racemosus)', 'Ashoka (Saraca asoca Lodhra (Symplocos racemosa)', 'Dashamula (Ten roots)', 'Guduchi (Tinospora cordifolia)', 'Kumari (Aloe vera)'],
    procedures: ['Basti (Pichcha Basti)', 'Kati Basti', 'Uttara Basti', 'Yonipichu'],
    keywords: ['menstrual disorder', 'artava dushti', 'irregular periods', 'dysmenorrhea', 'menstruation', 'period pain', 'heavy bleeding', 'amenorrhea'],
    formulations: ['Ashokarishta', 'Phalasarpya Kudineer', 'Kumaryasava', 'Lodhra Churna', 'Pushyanuga Churna'],
    diet: ['Warm, cooked foods', 'Ginger tea and cumin water', 'Avoid cold and frozen foods', 'Jaggery and sesame preparations', 'Iron-rich foods: spinach, dates', 'Avoid excessive caffeine and sugar'],
    lifestyle: ['Regular sleep schedule', 'Moderate exercise (yoga, walking)', 'Avoid stress and emotional disturbances', 'Keep abdomen warm during menstruation', 'Practice yoga: Supta Baddha Konasana, Balasana'],
  },

  // ── 25. GYNECOLOGICAL — PCOS ───────────────────────────────────
  'granthiartavadusti': {
    diagnosis: 'Polycystic Ovary Syndrome (Granthi Artava Dushti)',
    dosha: 'Kapha-Vata (Artava & Medo Dhatu Dushti)',
    treatment: 'Langhana → Kapha Shamana → Artava Janani',
    herbs: ['Shatavari (Asparagus racemosus)', 'Guduchi (Tinospora cordifolia)', 'Kumari (Aloe vera)', 'Dashamula (Ten roots)', 'Triphala', 'Ashwagandha (Withania somnifera)'],
    procedures: ['Virechana', 'Basti (Uttara Basti)', 'Kati Basti', 'Yonipichu'],
    keywords: ['pcos', 'pcod', 'polycystic', 'ovarian cyst', 'irregular ovulation', 'hormonal imbalance', 'granthi artava', 'cystic ovary'],
    formulations: ['Chandraprabha Vati', 'Kumaryasava', 'Phalasarpya Kudineer', 'Kokilaksha Kashaya', 'Ashwagandha Churna'],
    diet: ['Low glycemic index foods', 'Avoid refined sugars and processed foods', 'Plenty of vegetables and whole grains', 'Bitter gourd and bottle gourd', 'Avoid dairy and red meat', 'Spice-rich foods (cinnamon, fenugreek)'],
    lifestyle: ['Regular moderate exercise (30 min/day)', 'Weight management', 'Stress reduction through yoga', 'Adequate sleep (7-8 hours)', 'Avoid sedentary lifestyle', 'Practice Surya Namaskar daily'],
  },

  // ── 26. GYNECOLOGICAL — Female Infertility ──────────────────────
  'vandhyatvavyavastha': {
    diagnosis: 'Female Infertility (Vandhyatva)',
    dosha: 'Vata-Kapha (Artava & Garbhashaya Dushti)',
    treatment: 'Balya → Vata Shamana → Garbhashaya Bhrimhana',
    herbs: ['Shatavari (Asparagus racemosus)', 'Ashwagandha (Withania somnifera)', 'Kumari (Aloe vera)', 'Lodhra (Symplocos racemosa)', 'Guduchi (Tinospora cordifolia)', 'Dashamula (Ten roots)'],
    procedures: ['Basti (Pichcha Basti)', 'Yonipichu', 'Uttara Basti', 'Kati Basti'],
    keywords: ['infertility', 'vandhyatva', 'conception', 'fertility', 'unable to conceive', 'reproductive', 'garbhashaya'],
    formulations: ['Phalasarpya Kudineer', 'Ashokarishta', 'Kumaryasava', 'Chandraprabha Vati', 'Shatavari Kalpa'],
    diet: ['Nutritious, warm, and moist foods', 'Ghee and sesame oil in cooking', 'Milk with Ashwagandha or Shatavari', 'Fruits: pomegranate, dates, figs', 'Avoid excessive spicy and dry foods', 'Iron and folate-rich foods'],
    lifestyle: ['Maintain healthy body weight', 'Regular yoga and meditation', 'Adequate rest and sleep', 'Reduce stress and anxiety', 'Avoid excessive physical exertion', 'Practice calming pranayama'],
  },

  // ── 27. PSYCHIATRIC — Depression ────────────────────────────────
  'avaskandakavyavastha': {
    diagnosis: 'Depression (Avaskandaka)',
    dosha: 'Vata-Kapha (Manovaha Srotas)',
    treatment: 'Vata Shamana → Manas Roga Chikitsa → Rasayana',
    herbs: ['Brahmi (Bacopa monnieri)', 'Ashwagandha (Withania somnifera)', 'Shankhpushpi (Convolvulus pluricaulis)', 'Jatamansi (Nardostachys jatamansi)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Vacha (Acorus calamus)'],
    procedures: ['Shirodhara (with Brahmi Taila)', 'Nasya (Brahmi Ghrita)', 'Shirolepa (medicated paste)', 'Abhyanga'],
    keywords: ['depression', 'avaskandaka', 'sadness', 'low mood', 'hopelessness', 'melancholy', 'mental depression', 'low energy'],
    formulations: ['Brahmi Vati', 'Saraswatarishta', 'Ashwagandha Churna', 'Jatamansyadi Churna', 'Brahmi Ghrita'],
    diet: ['Warm, nourishing foods', 'Sweet, salty, and sour tastes', 'Ghee and sesame oil', 'Avoid bitter, pungent, and astringent excesses', 'Warm milk with turmeric at night', 'Fresh fruits and dates'],
    lifestyle: ['Regular morning sunlight exposure', 'Moderate exercise and walking', 'Social interaction and support', 'Yoga and meditation daily', 'Maintain regular sleep schedule', 'Engage in creative and enjoyable activities'],
  },

  // ── 28. PSYCHIATRIC — Anxiety ──────────────────────────────────
  'chittaunmadavyavastha': {
    diagnosis: 'Anxiety Disorder (Chittodwega)',
    dosha: 'Vata (Manovaha Srotas — Vata Prakopa)',
    treatment: 'Vata Shamana → Sattvavajaya → Rasayana',
    herbs: ['Brahmi (Bacopa monnieri)', 'Jatamansi (Nardostachys jatamansi)', 'Shankhpushpi (Convolvulus pluricaulis)', 'Tagar (Valeriana wallichii)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Ashwagandha (Withania somnifera)'],
    procedures: ['Shirodhara (with Brahmi Taila)', 'Pizhichil', 'Abhyanga', 'Nasya'],
    keywords: ['anxiety', 'anxious', 'chittodwega', 'worry', 'panic', 'nervousness', 'restlessness', 'fear', 'phobia'],
    formulations: ['Brahmi Vati', 'Saraswatarishta', 'Ashwagandha Churna', 'Tagaradi Churna', 'Jatamansyadi Kashaya'],
    diet: ['Warm, grounding foods', 'Sweet, salty, and sour tastes', 'Avoid caffeine and stimulants', 'Warm milk with nutmeg at night', 'Avoid excessive raw and cold foods', 'Dates and almonds'],
    lifestyle: ['Regular sleep schedule (early to bed)', 'Yoga: Shavasana, Balasana, Viparita Karani', 'Pranayama: Nadi Shodhana, Bhramari', 'Avoid overstimulation and screens at night', 'Grounding exercises and nature walks', 'Journaling and mindfulness practice'],
  },

  // ── 29. PEDIATRIC — Recurrent Infections ───────────────────────
  'abhisyandinyavyavastha': {
    diagnosis: 'Recurrent Infections in Children (Abhisyandini)',
    dosha: 'Kapha (Vyadhikshamatva Kshaya)',
    treatment: 'Kapha Shamana → Vyadhikshamatva Vardhana → Rasayana',
    herbs: ['Guduchi (Tinospora cordifolia)', 'Amalaki (Emblica officinalis)', 'Haridra (Curcuma longa)', 'Tulsi (Ocimum sanctum)', 'Pippali (Piper longum)', 'Shatavari (Asparagus racemosus)'],
    procedures: ['Nasya (medicated drops)', 'Lepa', 'Udvartana', 'Suvarna Prashana'],
    keywords: ['recurrent infections', 'childhood infections', 'abhisyandini', 'weak immunity', 'frequent cold', 'pediatric', 'children immunity', 'resistent infection'],
    formulations: ['Chyawanprash', 'Suvarna Prashana', 'Trikatu Churna (child dose)', 'Amalaki Churna', 'Guduchi Satva'],
    diet: ['Warm, freshly cooked meals', 'Ghee with rice and dal', 'Avoid junk food and processed items', 'Seasonal fruits and vegetables', 'Warm milk with turmeric', 'Avoid excessive sweets and cold drinks'],
    lifestyle: ['Regular outdoor play and exercise', 'Adequate sleep (10-12 hours)', 'Maintain personal hygiene', 'Avoid overcrowded places during epidemics', 'Sunlight exposure for Vitamin D'],
  },

  // ── 30. METABOLIC — Thyroid Disorder ────────────────────────────
  'galagandavyavastha': {
    diagnosis: 'Thyroid Disorder (Galaganda)',
    dosha: 'Kapha-Vata (Galavaha Srotas)',
    treatment: 'Kapha Shamana → Granthi Chedana → Rasayana',
    herbs: ['Guggulu (Commiphora mukul)', 'Kanchanara (Bauhinia variegata)', 'Guduchi (Tinospora cordifolia)', 'Shilajit (Asphaltum)', 'Haridra (Curcuma longa)', 'Pippali (Piper longum)'],
    procedures: ['Udvartana', 'Lepa over thyroid region', 'Nasya', 'Virechana'],
    keywords: ['thyroid', 'galaganda', 'hypothyroid', 'hyperthyroid', 'goitre', 'thyroid nodule', 'thyroid disorder', 'thyroid hormone'],
    formulations: ['Kanchanara Guggulu', 'Chandraprabha Vati', 'Guduchyadi Kashaya', 'Guggulu Churna', 'Shilajit Satva'],
    diet: ['Iodine-rich foods: sea vegetables, iodized salt', 'Avoid goitrogenic foods (raw cabbage, cauliflower)', 'Seaweed and sesame seeds', 'Avoid processed and refined foods', 'Coconut oil in cooking', 'Warm, light, and nutritious meals'],
    lifestyle: ['Regular yoga practice', 'Avoid excessive physical or mental stress', 'Moderate exercise (walking, swimming)', 'Adequate sleep', 'Avoid exposure to endocrine disruptors', 'Practice neck-stretching exercises'],
  },

  // ── 31. AUTOIMMUNE — Lupus / Autoimmune Conditions ──────────────
  'vyadkshamatvavyavastha': {
    diagnosis: 'Autoimmune Disorder (Vyadhi Kshamatva Dushti)',
    dosha: 'Tridosha (Vyadhi Kshamatva Kshaya)',
    treatment: 'Rasayana → Vyadhi Kshamatva Vardhana → Shamana',
    herbs: ['Guduchi (Tinospora cordifolia)', 'Ashwagandha (Withania somnifera)', 'Shatavari (Asparagus racemosus)', 'Amalaki (Emblica officinalis)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Guggulu (Commiphora mukul)'],
    procedures: ['Rasayana Basti', 'Pizhichil', 'Shirodhara', 'Abhyanga'],
    keywords: ['autoimmune', 'lupus', 'vyadhi kshamatva', 'autoimmune disease', 'immune dysfunction', 'systemic lupus', 'immunity disorder'],
    formulations: ['Chyawanprash', 'Guduchyadi Kashaya', 'Arogyavardhini Vati', 'Brahmi Vati', 'Amalaki Avaleha'],
    diet: ['Anti-inflammatory foods', 'Turmeric and ginger in cooking', 'Avoid processed and packaged foods', 'Fresh fruits and vegetables', 'Omega-3 rich foods (flax seeds)', 'Avoid nightshades and gluten if sensitive'],
    lifestyle: ['Gentle regular exercise', 'Adequate rest and stress management', 'Avoid extreme temperatures', 'Moderate sun exposure', 'Practice meditation and pranayama', 'Maintain healthy sleep cycle'],
  },

  // ── 32. OPHTHALMOLOGICAL — Dry Eye Syndrome ─────────────────────
  'shushkaakshipakavyavastha': {
    diagnosis: 'Dry Eye Syndrome (Shushka Akshipaka)',
    dosha: 'Vata-Pitta (Drishti Vaha Srotas)',
    treatment: 'Vata Shamana → Pitta Shamana → Netra Tarpana',
    herbs: ['Triphala', 'Amalaki (Emblica officinalis)', 'Yashtimadhu (Glycyrrhiza glabra)', 'Shatavari (Asparagus racemosus)', 'Chandana (Santalum album)', 'Haridra (Curcuma longa)'],
    procedures: ['Netra Tarpana (eye nourishment)', 'Shirodhara', 'Anjana (collyrium)', 'Pindi (eye poultice)'],
    keywords: ['dry eye', 'shushka akshipaka', 'eye dryness', 'xerophthalmia', 'eye irritation', 'burning eyes', 'eye strain', 'computer vision'],
    formulations: ['Triphala Churna (eye wash)', 'Rohtas Eye Drops', 'Maha Triphala Ghrita', 'Chandanasava', 'Amalaki Churna with honey'],
    diet: ['Ghee and warm milk daily', 'Carrot and Amla juice', 'Avoid excessive spicy and fried foods', 'Vitamin A rich foods: sweet potato, mango', 'Avoid excessive caffeine and alcohol', 'Omega-3 rich foods'],
    lifestyle: ['Follow 20-20-20 rule for screen use', 'Avoid prolonged screen time', 'Use humidifier in dry environments', 'Blink regularly and adequately', 'Wear sunglasses outdoors', 'Adequate hydration throughout the day'],
  },

  // ── 33. DENTAL — Gum Disease / Periodontitis ────────────────────
  'dantavibhramsavyavastha': {
    diagnosis: 'Gum Disease / Periodontitis (Danta Vibhramsa)',
    dosha: 'Vata-Pitta (Danta Vaha & Raktavaha Srotas)',
    treatment: 'Vata Shamana → Danta Roga Chikitsa → Rakta Shodhana',
    herbs: ['Khadira (Acacia catechu)', 'Babool (Acacia arabica)', 'Neem (Azadirachta indica)', 'Haridra (Curcuma longa)', 'Musta (Cyperus rotundus)', 'Lodhra (Symplocos racemosa)'],
    procedures: ['Danta Dhavana (medicated brushing)', 'Gandoosha (oil pulling)', 'Kavala (gargling)', 'Lepa over gums'],
    keywords: ['gum disease', 'periodontitis', 'gingivitis', 'danta vibhramsa', 'bleeding gums', 'gum recession', 'loose teeth', 'dental'],
    formulations: ['Khadiradi Vati', 'Neem Churna', 'Babool Churna', 'Haridra Khanda', 'Triphala Churna (for gargling)'],
    diet: ['Crunchy vegetables and fruits (natural cleansers)', 'Avoid excessive sweets and sugary drinks', 'Vitamin C rich foods: amla, citrus', 'Calcium-rich foods: sesame, milk', 'Avoid sticky and processed foods', 'Warm water with salt for rinsing'],
    lifestyle: ['Brush teeth twice daily with medicated tooth powder', 'Gandoosha (oil pulling) every morning', 'Avoid tobacco and smoking', 'Regular dental check-ups', 'Massage gums gently with finger', 'Avoid excessive alcohol'],
  },
};

const COMPLEXITY_INDICATORS = [
  'treatment protocol', 'management plan', 'chikitsa', 'samprapti',
  'shodhana', 'rasayana', 'panchakarma', 'contraindication', 'prognosis',
  'classical reference', 'clinical trial', 'research', 'evidence',
  'differential diagnosis', 'investigation', 'examination', 'pariksha',
  'pathogenesis', 'dravyaguna', 'rasa panchaka', 'virya', 'vipaka',
];

const MODERATE_INDICATORS = [
  'what is', 'how does', 'explain', 'describe', 'difference between',
  'comparison', 'herbs for', 'treatment for', 'cause', 'symptoms',
  'dosage', 'anupana', 'pathya', 'apathya', 'diet',
];

/**
 * Detect if the query is a follow-up to a previous clinical question.
 * Follow-ups typically: reference pronouns, short queries, ask for elaboration.
 */
export function isFollowUpQuery(query: string, history: Array<{ role: string; content: string }>): boolean {
  if (history.length < 2) return false;

  const lower = query.toLowerCase().trim();
  const followUpPatterns = [
    /^(yes|no|ok|okay|got it|understood|right|correct|proceed|continue|next|more|elaborate|explain more|tell me more|what else|and|also|plus|too|what about|how about)$/i,
    /^(can you|could you|please|would you) (elaborate|explain|clarify|detail|expand|continue)/i,
    /^(more|details|specifics|examples|example|reference|source|citation)/i,
    /^(why|how|when|where|who|what exactly|what specifically)/i,
  ];

  if (followUpPatterns.some(p => p.test(lower))) return true;

  // Short queries (< 4 words) are likely follow-ups if history exists
  const words = lower.split(/\s+/);
  if (words.length <= 4 && history.length >= 2) return true;

  // Pronoun-heavy queries reference previous context
  const pronouns = ['it', 'this', 'that', 'they', 'them', 'these', 'those', 'his', 'her', 'its'];
  if (pronouns.some(p => lower.includes(p)) && history.length >= 2) return true;

  return false;
}

/**
 * Rewrite follow-up queries to be self-contained by incorporating context from history.
 */
export function rewriteFollowUpQuery(
  query: string,
  history: Array<{ role: string; content: string }>
): string {
  if (!isFollowUpQuery(query, history)) return query;

  // Find the last user message to get context
  const lastUserMsg = history
    .filter(h => h.role === 'user')
    .pop()?.content || '';

  const lower = query.toLowerCase().trim();

  // Simple elaboration requests
  if (/^(more|details|specifics|elaborate|explain more|tell me more|what else)$/i.test(lower)) {
    return `Please provide more details and deeper analysis regarding: "${lastUserMsg}"`;
  }

  if (/^(yes|ok|okay|proceed|continue|right|correct)$/i.test(lower)) {
    return `Continue with the clinical analysis and recommendations for: "${lastUserMsg}"`;
  }

  // "What about X?" style follow-ups
  if (lower.startsWith('what about ') || lower.startsWith('how about ')) {
    return `Regarding the earlier discussion on "${lastUserMsg.slice(0, 100)}": ${query}`;
  }

  // Pronoun-heavy short queries
  const words = lower.split(/\s+/);
  if (words.length <= 4) {
    return `${query} (in the context of: ${lastUserMsg.slice(0, 150)})`;
  }

  return query;
}

export function classifyIntent(query: string): Intent {
  const lower = query.toLowerCase();
  let best: Intent = 'general';
  let bestScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'general') continue;
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = intent as Intent;
    }
  }
  return bestScore > 0 ? best : 'general';
}

export function extractEntities(query: string): string[] {
  const lower = query.toLowerCase();
  const entities: string[] = [];

  for (const [canonical, synonyms] of Object.entries(SANSKRIT_DISEASE_MAP)) {
    if (synonyms.some(s => lower.includes(s))) entities.push(canonical);
  }
  for (const [canonical, synonyms] of Object.entries(SANSKRIT_SYNONYMS)) {
    if (synonyms.some(s => lower.includes(s))) entities.push(canonical);
  }

  // Open entity matching: extract capitalized words and potential Sanskrit terms
  const sanskritPattern = /\b(vata|pitta|kapha|dosha|dhatu|agni|srotas|ama|prakriti|vikriti|chikitsa|shodhana|shamana|rasayana|panchakarma|vamana|virechana|basti|nasya|raktamokshana|abhyanga|pizhichil|shirodhara|nadi|pariksha|nidana|samprapti|dravya|rasa|guna|virya|vipaka|prabhava|anupana|pathya|apathya|dinacharya|ritucharya|vyadhi|roga|chikitsa|upakrama|karma|yoga)\b/gi;
  const matches = query.match(sanskritPattern);
  if (matches) {
    for (const m of matches) {
      const lower = m.toLowerCase();
      if (!entities.includes(lower)) entities.push(lower);
    }
  }

  return [...new Set(entities)];
}

export function extractPrimaryCondition(query: string): string {
  const lower = query.toLowerCase();
  for (const [canonical, synonyms] of Object.entries(SANSKRIT_DISEASE_MAP)) {
    if (synonyms.some(s => lower.includes(s))) return canonical;
  }
  const words = query.split(/\s+/).filter(w => w.length > 4);
  return words.slice(0, 3).join(' ') || query;
}

export function assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
  const lower = query.toLowerCase();

  let score = 0;
  for (const ind of COMPLEXITY_INDICATORS) if (lower.includes(ind)) score += 2;
  for (const ind of MODERATE_INDICATORS) if (lower.includes(ind)) score += 1;

  if (score >= 3) return 'complex';
  if (score >= 1) return 'moderate';
  return 'simple';
}

export function identifyClinicalPathway(entities: string[], rawQuery?: string): string | null {
  // 1. Exact match on pathway key
  for (const entity of entities) {
    const key = entity.toLowerCase();
    if (CLINICAL_PATHWAYS[key]) return key;
  }

  // 2. Match against keywords arrays using entities
  for (const entity of entities) {
    const lower = entity.toLowerCase();
    for (const [pathwayKey, pathway] of Object.entries(CLINICAL_PATHWAYS)) {
      if (pathway.keywords?.some(kw => lower.includes(kw) || kw.includes(lower))) {
        return pathwayKey;
      }
    }
  }

  // 3. Match keywords against raw query text (catches terms not in entity list)
  if (rawQuery) {
    const queryLower = rawQuery.toLowerCase();
    for (const [pathwayKey, pathway] of Object.entries(CLINICAL_PATHWAYS)) {
      if (pathway.keywords?.some(kw => queryLower.includes(kw))) {
        return pathwayKey;
      }
    }
  }

  // 4. Fuzzy match on pathway key
  for (const entity of entities) {
    const key = entity.toLowerCase();
    for (const pathwayKey of Object.keys(CLINICAL_PATHWAYS)) {
      if (key.includes(pathwayKey) || pathwayKey.includes(key)) return pathwayKey;
    }
  }

  return null;
}

export function expandQuery(query: string, intent: Intent, entities: string[]): string[] {
  const variants: string[] = [query];

  if (entities.length > 0) {
    for (const e of entities.slice(0, 3)) {
      variants.push(`${query} ${e}`);
      variants.push(`${e} ayurvedic treatment`);
    }
  }

  const intentSuffixes: Record<Intent, string[]> = {
    herb: ['ayurvedic herb medicinal uses', 'herb rasayana', 'dravyaguna'],
    disease: ['ayurvedic treatment', 'chikitsa', 'samprapti pathogenesis', 'vyadhi parichaya'],
    treatment: ['procedure indication', 'panchakarma therapy', 'upakrama', 'chikitsa vidhi'],
    diet: ['pathya apathya diet', 'ahara vidhi', 'dinacharya'],
    dosha: ['tridosha balance', 'dosha karma', 'dhatu samanya vishesha'],
    diagnosis: ['pariksha diagnosis', 'nadi pariksha', 'ashtavidha pariksha'],
    procedure: ['panchakarma procedure', 'karma vidhi', 'upakrama vidhi'],
    formulation: ['classical formulation', 'yoga kriyakalpa', 'bheshaj kalpana'],
    general: ['ayurveda', 'classical text', 'sutra sthana'],
  };

  for (const suffix of intentSuffixes[intent] ?? intentSuffixes.general) {
    if (!variants.some(v => v.toLowerCase().includes(suffix))) {
      variants.push(`${query} ${suffix}`);
    }
  }

  return [...new Set(variants)].slice(0, 6);
}

export function parseQuery(query: string, history?: Array<{ role: string; content: string }>): ParsedQuery {
  const intent = classifyIntent(query);
  const entities = extractEntities(query);
  const isFollowUp = history ? isFollowUpQuery(query, history) : false;
  const rewrittenQuery = history ? rewriteFollowUpQuery(query, history) : query;
  const clinicalPathway = identifyClinicalPathway(entities, rewrittenQuery);

  return {
    intent,
    entities,
    primaryCondition: extractPrimaryCondition(rewrittenQuery),
    complexity: assessComplexity(rewrittenQuery),
    sanskritTerms: entities,
    isFollowUp,
    rewrittenQuery,
    clinicalPathway,
  };
}
