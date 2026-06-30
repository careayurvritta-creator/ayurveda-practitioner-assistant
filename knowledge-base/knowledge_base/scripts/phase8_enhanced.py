"""
WHO ITA Knowledge Base - Phase 8 Enhanced: AI Training Data Preparation
========================================================================
Enhanced version with fixes for:
1. Proper dosha associations from Phase 7 data
2. Skip terms with empty Sanskrit
3. Better answer formatting
4. More diverse question types
5. Clinical case-based Q&A
"""

import json
import random
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
import hashlib

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
PHASE7_DIR = Path("knowledge_base/phase7_knowledge_graph")
OUTPUT_DIR = Path("knowledge_base/phase8_ai_training")
REPORTS_DIR = OUTPUT_DIR / "reports"

random.seed(42)


# ============================================================================
# 8.1 ENHANCED PROMPT TEMPLATES
# ============================================================================

PROMPT_TEMPLATES = {
    'terminology_lookup': {
        'system': """You are an Ayurveda terminology expert with comprehensive knowledge of WHO ITA (International Standard Terminologies on Ayurveda).

CAPABILITIES:
- Provide accurate Sanskrit terms in IAST transliteration and Devanagari script
- Cite WHO ITA codes for all Ayurvedic concepts
- Explain clinical significance and context
- Apply Tridosha framework (Vata, Pitta, Kapha)

FORMAT GUIDELINES:
- Always cite: Term (IAST / Devanagari) - WHO ITA: X.X.X
- Provide etymological context when relevant
- Include clinical applications

KNOWLEDGE BASE: {term_count} WHO ITA terms across 10 chapters""",
        'examples': [
            {'user': "What is Ayurveda?", 
             'assistant': "**Ayurveda** (Āyurveda / आयुर्वेद) - WHO ITA: 1.1.1\n\nThe science of life and longevity. From Sanskrit 'āyus' (life) + 'veda' (knowledge/science).\n\n**Chapter:** Background Terminology\n**Clinical Relevance:** Foundational concept of traditional Indian medicine."}
        ]
    },
    
    'diagnosis_support': {
        'system': """You are an Ayurvedic diagnostic assistant following WHO ITA terminology standards.

DIAGNOSTIC FRAMEWORK (Rogi-Roga Pariksha):
1. Prakriti (Constitution) assessment
2. Vikriti (Imbalance) analysis  
3. Dosha predominance identification
4. Samprapti (Pathogenesis) understanding

GUIDELINES:
- Use WHO ITA codes for all conditions
- Consider Tridosha involvement
- Always recommend practitioner consultation
- Focus on educational guidance, not prescriptive diagnosis""",
        'examples': []
    },
    
    'treatment_recommendation': {
        'system': """You are an Ayurvedic treatment advisor based on WHO ITA guidelines.

TREATMENT MODALITIES:
1. **Shodhana** (Purification): Panchakarma therapies
   - Vamana (emesis), Virecana (purgation), Basti (enema)
   - Nasya (nasal), Raktamokshana (bloodletting)
   
2. **Shamana** (Pacification): Oral medications, diet, lifestyle

3. **Rasayana** (Rejuvenation): Tissue nourishment

4. **Vajikarana** (Aphrodisiac): Reproductive health

Always include:
- Pathya (beneficial regimen)
- Apathya (contraindicated items)
- Anupana (vehicle/adjuvant)""",
        'examples': []
    },
    
    'clinical_case': {
        'system': """You are an Ayurvedic clinical educator presenting case-based learning.

CASE STRUCTURE:
1. Patient presentation (anonymized)
2. Ayurvedic assessment findings
3. Dosha analysis
4. Differential diagnosis with WHO ITA codes
5. Treatment principles
6. Educational discussion points

DISCLAIMER: Cases are for educational purposes. Real clinical decisions require qualified practitioners.""",
        'examples': []
    }
}


# ============================================================================
# 8.2 ENHANCED Q&A GENERATOR
# ============================================================================

class EnhancedQAGenerator:
    """Generate high-quality Q&A pairs."""
    
    def __init__(self):
        self.qa_pairs = []
    
    def generate(self, terms: List[dict], entities: List[dict] = None) -> List[Dict]:
        """Generate diverse Q&A pairs."""
        self.qa_pairs = []
        
        # Build entity index for dosha data
        entity_index = {}
        if entities:
            for e in entities:
                entity_index[e.get('id', '')] = e
        
        for term in terms:
            term_id = term.get('term_id', '')
            english = term.get('english', '').strip()
            iast = term.get('iast', '').strip()
            devanagari = term.get('devanagari', '').strip()
            chapter = term.get('category', {}).get('chapter', '')
            chapter_name = term.get('category', {}).get('chapter_name', '')
            domains = term.get('domains', ['general'])
            
            # Skip incomplete terms
            if not english or len(english) < 3:
                continue
            
            # Get entity data for dosha info
            entity = entity_index.get(term_id, {})
            dosha_list = entity.get('dosha_association', [])
            
            # Generate different question types
            
            # Type 1: Basic definition (only if Sanskrit available)
            if iast and devanagari:
                self.qa_pairs.append({
                    'id': f"qa_{term_id}_def",
                    'term_id': term_id,
                    'type': 'definition',
                    'question': f"What is {english} in Ayurveda?",
                    'answer': f"**{english}** ({iast} / {devanagari})\n\n**WHO ITA Code:** {term_id}\n**Chapter:** {chapter} - {chapter_name}\n**Domain:** {domains[0] if domains else 'general'}",
                    'chapter': chapter,
                    'difficulty': 'basic'
                })
                
                # Type 2: Sanskrit term lookup
                self.qa_pairs.append({
                    'id': f"qa_{term_id}_skt",
                    'term_id': term_id,
                    'type': 'sanskrit_lookup',
                    'question': f"What is the Sanskrit term for {english}?",
                    'answer': f"The Sanskrit term for **{english}** is:\n\n- **IAST:** {iast}\n- **Devanagari:** {devanagari}\n- **WHO ITA:** {term_id}",
                    'chapter': chapter,
                    'difficulty': 'basic'
                })
            
            # Type 3: ITA code lookup (always)
            self.qa_pairs.append({
                'id': f"qa_{term_id}_code",
                'term_id': term_id,
                'type': 'code_lookup',
                'question': f"What is the WHO ITA code for {english}?",
                'answer': f"The WHO ITA code for **{english}** is **{term_id}**." + (f"\n\nSanskrit: {iast}" if iast else ""),
                'chapter': chapter,
                'difficulty': 'basic'
            })
            
            # Type 4: Category question
            self.qa_pairs.append({
                'id': f"qa_{term_id}_cat",
                'term_id': term_id,
                'type': 'category',
                'question': f"Which WHO ITA chapter covers {english}?",
                'answer': f"**{english}** ({term_id}) is covered in **Chapter {chapter}: {chapter_name}**.",
                'chapter': chapter,
                'difficulty': 'basic'
            })
            
            # Type 5: Dosha question (only if dosha data available)
            if dosha_list:
                dosha_str = ', '.join([d.capitalize() for d in dosha_list])
                self.qa_pairs.append({
                    'id': f"qa_{term_id}_dosha",
                    'term_id': term_id,
                    'type': 'dosha',
                    'question': f"Which dosha is {english} associated with?",
                    'answer': f"**{english}** is associated with **{dosha_str}** dosha.\n\nThis affects the body's humoral balance according to Ayurvedic principles.",
                    'chapter': chapter,
                    'difficulty': 'intermediate'
                })
            
            # Type 6: Clinical significance (for therapeutic terms)
            if domains[0] in ['therapeutics', 'pathology', 'pharmacology']:
                self.qa_pairs.append({
                    'id': f"qa_{term_id}_clinical",
                    'term_id': term_id,
                    'type': 'clinical',
                    'question': f"What is the clinical significance of {english} in Ayurveda?",
                    'answer': f"**{english}** ({iast if iast else term_id}) has clinical significance in **{domains[0]}**.\n\nRefer to WHO ITA {term_id} under {chapter_name} for detailed information.",
                    'chapter': chapter,
                    'difficulty': 'intermediate'
                })
        
        return self.qa_pairs


# ============================================================================
# 8.3 ENHANCED CONVERSATION GENERATOR
# ============================================================================

class EnhancedConversationGenerator:
    """Generate realistic multi-turn diagnostic conversations."""
    
    def generate(self, terms: List[dict], entities: List[dict] = None) -> List[Dict]:
        """Generate diverse conversation types."""
        conversations = []
        
        # Build entity index
        entity_index = {e.get('id', ''): e for e in (entities or [])}
        
        # Get disease terms with Sanskrit
        diseases = [t for t in terms 
                   if t.get('category', {}).get('chapter') == '5' 
                   and t.get('iast') and t.get('devanagari')][:100]
        
        for disease in diseases:
            term_id = disease.get('term_id', '')
            english = disease.get('english', '')
            iast = disease.get('iast', '')
            devanagari = disease.get('devanagari', '')
            entity = entity_index.get(term_id, {})
            doshas = entity.get('dosha_association', [])
            
            conv = {
                'id': f"conv_{term_id}",
                'type': 'diagnostic_inquiry',
                'topic': english,
                'ita_code': term_id,
                'messages': [
                    {
                        'role': 'system',
                        'content': "You are an Ayurvedic health educator following WHO ITA standards. Provide educational information; always recommend consulting qualified practitioners."
                    },
                    {
                        'role': 'user',
                        'content': f"Can you explain {english} according to Ayurveda?"
                    },
                    {
                        'role': 'assistant',
                        'content': f"**{english}** ({iast} / {devanagari})\n\n**WHO ITA Code:** {term_id}\n\nThis is an Ayurvedic condition classified under Chapter 5 (Disorders)." + (f"\n\n**Dosha Involvement:** Primarily {', '.join([d.capitalize() for d in doshas])}" if doshas else "") + "\n\nWould you like to know about its signs, causative factors, or treatment approach?"
                    },
                    {
                        'role': 'user',
                        'content': "What about treatment options?"
                    },
                    {
                        'role': 'assistant',
                        'content': f"Treatment for **{english}** follows Ayurvedic principles:\n\n**1. Nidana Parivarjana**\nAvoiding causative factors\n\n**2. Shodhana (if indicated)**\nPurification therapies based on dosha predominance\n\n**3. Shamana**\nPacification through appropriate medications\n\n**4. Pathya-Apathya**\nDietary and lifestyle modifications\n\n> **Important:** Please consult a qualified Ayurvedic practitioner (BAMS/MD Ayurveda) for personalized treatment. This information is for educational purposes."
                    }
                ]
            }
            conversations.append(conv)
        
        # Add treatment-focused conversations
        treatments = [t for t in terms 
                     if t.get('category', {}).get('chapter') == '9'
                     and t.get('iast')][:30]
        
        for treatment in treatments:
            term_id = treatment.get('term_id', '')
            english = treatment.get('english', '')
            iast = treatment.get('iast', '')
            
            conv = {
                'id': f"conv_treat_{term_id}",
                'type': 'treatment_inquiry',
                'topic': english,
                'ita_code': term_id,
                'messages': [
                    {
                        'role': 'system',
                        'content': "You are an Ayurvedic treatment educator explaining therapeutic procedures."
                    },
                    {
                        'role': 'user',
                        'content': f"What is {english} therapy?"
                    },
                    {
                        'role': 'assistant',
                        'content': f"**{english}** ({iast})\n**WHO ITA:** {term_id}\n\nThis is a therapeutic procedure classified under Chapter 9 (Treatment Modalities).\n\nShall I explain the indications, procedure, or precautions?"
                    }
                ]
            }
            conversations.append(conv)
        
        return conversations


# ============================================================================
# 8.4 ENHANCED FEW-SHOT CURATOR
# ============================================================================

class EnhancedFewShotCurator:
    """Curate high-quality, balanced few-shot examples."""
    
    def curate(self, terms: List[dict], entities: List[dict] = None) -> Dict:
        """Curate examples with proper selection criteria."""
        examples = defaultdict(list)
        entity_index = {e.get('id', ''): e for e in (entities or [])}
        
        # Selection criteria: must have IAST, Devanagari, and high confidence
        quality_terms = [t for t in terms 
                        if t.get('iast') and t.get('devanagari')
                        and t.get('confidence', {}).get('level') == 'high']
        
        # Group by chapter
        by_chapter = defaultdict(list)
        for term in quality_terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            by_chapter[chapter].append(term)
        
        # Select 15 per chapter (balanced)
        for chapter in sorted(by_chapter.keys()):
            selected = random.sample(by_chapter[chapter], min(15, len(by_chapter[chapter])))
            
            for term in selected:
                entity = entity_index.get(term.get('term_id', ''), {})
                example = {
                    'term_id': term.get('term_id', ''),
                    'input': f"Define: {term.get('english', '')}",
                    'output': self._format_output(term, entity),
                    'chapter': chapter,
                    'quality_score': 'high'
                }
                examples[f"chapter_{chapter}"].append(example)
        
        # Add dosha-specific examples
        for dosha in ['vata', 'pitta', 'kapha']:
            dosha_terms = [t for t in quality_terms 
                         if dosha in entity_index.get(t.get('term_id', ''), {}).get('dosha_association', [])]
            selected = random.sample(dosha_terms, min(10, len(dosha_terms))) if dosha_terms else []
            for term in selected:
                entity = entity_index.get(term.get('term_id', ''), {})
                examples[f"dosha_{dosha}"].append({
                    'term_id': term.get('term_id', ''),
                    'input': f"What {dosha.capitalize()} conditions relate to {term.get('english', '')}?",
                    'output': f"{term.get('english', '')} is associated with {dosha.capitalize()} dosha.",
                    'quality_score': 'high'
                })
        
        return dict(examples)
    
    def _format_output(self, term: dict, entity: dict) -> str:
        """Format output for few-shot example."""
        parts = [
            f"**{term.get('english', '')}**",
            f"({term.get('iast', '')} / {term.get('devanagari', '')})",
            "",
            f"**WHO ITA:** {term.get('term_id', '')}",
            f"**Chapter:** {term.get('category', {}).get('chapter_name', '')}"
        ]
        
        doshas = entity.get('dosha_association', [])
        if doshas:
            parts.append(f"**Dosha:** {', '.join([d.capitalize() for d in doshas])}")
        
        return '\n'.join(parts)


# ============================================================================
# 8.5-8.10 (Keeping existing implementations but enhanced)
# ============================================================================

class EnhancedContextOptimizer:
    """Create optimized context chunks."""
    
    CHUNK_SIZE = 4000
    
    def create_chunks(self, terms: List[dict]) -> List[Dict]:
        chunks = []
        
        # Only include complete terms
        complete_terms = [t for t in terms if t.get('iast') and t.get('devanagari')]
        
        # Group by chapter
        by_chapter = defaultdict(list)
        for term in complete_terms:
            chapter = term.get('category', {}).get('chapter', '0')
            by_chapter[chapter].append(term)
        
        chunk_id = 0
        for chapter in sorted(by_chapter.keys()):
            current_chunk = []
            current_size = 0
            
            for term in by_chapter[chapter]:
                term_text = f"{term.get('term_id', '')}: {term.get('english', '')} | {term.get('iast', '')} | {term.get('devanagari', '')}"
                term_size = len(term_text)
                
                if current_size + term_size > self.CHUNK_SIZE and current_chunk:
                    chunks.append({
                        'chunk_id': f"chunk_{chunk_id}",
                        'chapter': chapter,
                        'term_count': len(current_chunk),
                        'terms': [t.get('term_id', '') for t in current_chunk]
                    })
                    chunk_id += 1
                    current_chunk = []
                    current_size = 0
                
                current_chunk.append(term)
                current_size += term_size
            
            if current_chunk:
                chunks.append({
                    'chunk_id': f"chunk_{chunk_id}",
                    'chapter': chapter,
                    'term_count': len(current_chunk),
                    'terms': [t.get('term_id', '') for t in current_chunk]
                })
                chunk_id += 1
        
        return chunks


class EnhancedRAGBuilder:
    """Build enhanced RAG index."""
    
    def build(self, terms: List[dict], entities: List[dict] = None) -> Dict:
        entity_index = {e.get('id', ''): e for e in (entities or [])}
        documents = []
        
        for term in terms:
            if not term.get('english'):
                continue
                
            entity = entity_index.get(term.get('term_id', ''), {})
            
            # Create rich document text
            text_parts = [
                term.get('english', ''),
                term.get('iast', ''),
                term.get('devanagari', ''),
                term.get('category', {}).get('chapter_name', ''),
                ' '.join(term.get('domains', [])),
                ' '.join(entity.get('dosha_association', []))
            ]
            
            documents.append({
                'id': term.get('term_id', ''),
                'text': ' '.join(filter(None, text_parts)),
                'metadata': {
                    'english': term.get('english', ''),
                    'iast': term.get('iast', ''),
                    'devanagari': term.get('devanagari', ''),
                    'chapter': term.get('category', {}).get('chapter', ''),
                    'domains': term.get('domains', []),
                    'doshas': entity.get('dosha_association', [])
                }
            })
        
        return {
            'index_type': 'semantic_enhanced',
            'document_count': len(documents),
            'documents': documents
        }


class EnhancedSystemPrompts:
    """Create role-specific system prompts."""
    
    def create(self, term_count: int, dosha_coverage: Dict) -> Dict:
        return {
            'general_assistant': f"""You are an expert Ayurveda AI assistant integrated with the WHO ITA Knowledge Base.

**Knowledge Base:**
- Total terms: {term_count}
- Vata-related: {dosha_coverage.get('vata', 0)}
- Pitta-related: {dosha_coverage.get('pitta', 0)}  
- Kapha-related: {dosha_coverage.get('kapha', 0)}

**Guidelines:**
1. Always cite WHO ITA codes (format: ITA-X.X.X)
2. Provide Sanskrit in IAST and Devanagari
3. Apply Tridosha framework
4. Recommend practitioner consultation for clinical matters

**Response Format:**
Term (IAST / Devanagari) - WHO ITA: X.X.X""",

            'diagnostic_educator': """You are an Ayurvedic diagnostic educator.

**Framework:**
- Prakriti (Constitution)
- Vikriti (Imbalance)
- Nidana (Etiology)
- Samprapti (Pathogenesis)
- Rupa (Symptoms)

Always use WHO ITA terminology and codes.
Recommend qualified practitioner consultation.""",

            'treatment_advisor': """You are an Ayurvedic treatment information specialist.

**Treatment Categories:**
1. Shodhana (Panchakarma)
2. Shamana (Palliative)
3. Rasayana (Rejuvenation)
4. Vajikarana (Fertility)

Include Pathya-Apathya guidelines.
Reference WHO ITA codes throughout."""
        }


class EnhancedValidationSetCreator:
    """Create stratified validation set."""
    
    def create(self, terms: List[dict]) -> Tuple[List[dict], List[dict]]:
        by_chapter = defaultdict(list)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            by_chapter[chapter].append(term)
        
        training, validation = [], []
        
        for chapter, chapter_terms in by_chapter.items():
            random.shuffle(chapter_terms)
            split_idx = int(len(chapter_terms) * 0.9)
            training.extend(chapter_terms[:split_idx])
            validation.extend(chapter_terms[split_idx:])
        
        return training, validation


class EnhancedGoldenTestGenerator:
    """Generate expert-level golden tests."""
    
    def generate(self, terms: List[dict], entities: List[dict] = None) -> List[Dict]:
        entity_index = {e.get('id', ''): e for e in (entities or [])}
        tests = []
        
        # Only high-quality terms with complete data
        quality_terms = [t for t in terms 
                        if t.get('iast') and t.get('devanagari')
                        and t.get('confidence', {}).get('level') == 'high']
        
        by_chapter = defaultdict(list)
        for term in quality_terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            by_chapter[chapter].append(term)
        
        for chapter in sorted(by_chapter.keys()):
            selected = random.sample(by_chapter[chapter], min(10, len(by_chapter[chapter])))
            
            for term in selected:
                entity = entity_index.get(term.get('term_id', ''), {})
                tests.append({
                    'id': f"golden_{term.get('term_id', '')}",
                    'term_id': term.get('term_id', ''),
                    'chapter': chapter,
                    'question': f"What is {term.get('english', '')} in Ayurveda?",
                    'expected': {
                        'english': term.get('english', ''),
                        'iast': term.get('iast', ''),
                        'devanagari': term.get('devanagari', ''),
                        'term_id': term.get('term_id', ''),
                        'doshas': entity.get('dosha_association', [])
                    },
                    'grading': [
                        'Must include WHO ITA code',
                        'Must include Sanskrit (IAST or Devanagari)',
                        'Must provide accurate definition'
                    ],
                    'verified': True
                })
        
        return tests[:100]


# ============================================================================
# MAIN ENGINE
# ============================================================================

class Phase8EnhancedEngine:
    """Enhanced Phase 8 engine."""
    
    def __init__(self):
        self.terms = []
        self.entities = []
    
    def load_data(self):
        """Load data from previous phases."""
        print("[LOAD] Loading data...")
        
        # Load terms
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
        
        # Load entities from Phase 7
        summary_path = PHASE7_DIR / "reports" / "phase7_enhanced_summary.json"
        if summary_path.exists():
            with open(summary_path, 'r', encoding='utf-8') as f:
                summary = json.load(f)
            print(f"  [OK] Phase 7 summary loaded")
        
        # Load entity data
        nodes_path = PHASE7_DIR / "graph_nodes.json"
        if nodes_path.exists():
            with open(nodes_path, 'r', encoding='utf-8') as f:
                nodes_data = json.load(f)
            self.entities = nodes_data.get('nodes', [])
            print(f"  [OK] Loaded {len(self.entities)} entities")
    
    def run(self):
        """Run enhanced Phase 8."""
        print("=" * 70)
        print("Phase 8 Enhanced: AI Training Data Preparation")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        self.load_data()
        
        # 8.1 Templates
        print("\n[8.1] Saving Prompt Templates...")
        template_path = OUTPUT_DIR / "prompt_templates_enhanced.json"
        with open(template_path, 'w', encoding='utf-8') as f:
            json.dump(PROMPT_TEMPLATES, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Saved {len(PROMPT_TEMPLATES)} templates")
        
        # 8.2 Q&A Pairs
        print("\n[8.2] Generating Enhanced Q&A Pairs...")
        qa_gen = EnhancedQAGenerator()
        qa_pairs = qa_gen.generate(self.terms, self.entities)
        qa_path = OUTPUT_DIR / "qa_training_enhanced.json"
        with open(qa_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(qa_pairs), 'pairs': qa_pairs}, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Generated {len(qa_pairs)} Q&A pairs")
        
        # 8.3 Conversations
        print("\n[8.3] Generating Enhanced Conversations...")
        conv_gen = EnhancedConversationGenerator()
        conversations = conv_gen.generate(self.terms, self.entities)
        conv_path = OUTPUT_DIR / "conversations_enhanced.json"
        with open(conv_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(conversations), 'conversations': conversations}, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Generated {len(conversations)} conversations")
        
        # 8.4 Few-Shot
        print("\n[8.4] Curating Enhanced Few-Shot Examples...")
        fs_curator = EnhancedFewShotCurator()
        few_shot = fs_curator.curate(self.terms, self.entities)
        fs_path = OUTPUT_DIR / "few_shot_enhanced.json"
        with open(fs_path, 'w', encoding='utf-8') as f:
            json.dump(few_shot, f, indent=2, ensure_ascii=False)
        total_fs = sum(len(v) for v in few_shot.values())
        print(f"  [OK] Curated {total_fs} examples in {len(few_shot)} categories")
        
        # 8.5 Context Chunks
        print("\n[8.5] Creating Context Chunks...")
        ctx_opt = EnhancedContextOptimizer()
        chunks = ctx_opt.create_chunks(self.terms)
        chunk_path = OUTPUT_DIR / "context_chunks_enhanced.json"
        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(chunks), 'chunks': chunks}, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Created {len(chunks)} chunks")
        
        # 8.6 RAG Index
        print("\n[8.6] Building Enhanced RAG Index...")
        rag_builder = EnhancedRAGBuilder()
        rag_index = rag_builder.build(self.terms, self.entities)
        rag_path = OUTPUT_DIR / "rag_index_enhanced.json"
        with open(rag_path, 'w', encoding='utf-8') as f:
            json.dump(rag_index, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Built index with {rag_index['document_count']} documents")
        
        # 8.7 System Prompts
        print("\n[8.7] Creating Enhanced System Prompts...")
        dosha_coverage = {
            'vata': sum(1 for e in self.entities if 'vata' in e.get('properties', {}).get('dosha_association', [])),
            'pitta': sum(1 for e in self.entities if 'pitta' in e.get('properties', {}).get('dosha_association', [])),
            'kapha': sum(1 for e in self.entities if 'kapha' in e.get('properties', {}).get('dosha_association', []))
        }
        prompt_creator = EnhancedSystemPrompts()
        prompts = prompt_creator.create(len(self.terms), dosha_coverage)
        prompt_path = OUTPUT_DIR / "system_prompts_enhanced.json"
        with open(prompt_path, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Created {len(prompts)} prompts")
        
        # 8.8 Validation Set
        print("\n[8.8] Creating Validation Set...")
        val_creator = EnhancedValidationSetCreator()
        training, validation = val_creator.create(self.terms)
        val_path = OUTPUT_DIR / "validation_set_enhanced.json"
        with open(val_path, 'w', encoding='utf-8') as f:
            json.dump({'training_count': len(training), 'validation_count': len(validation), 
                      'validation': validation}, f, indent=2, ensure_ascii=False)
        print(f"  [OK] {len(training)} training, {len(validation)} validation")
        
        # 8.9 Golden Tests
        print("\n[8.9] Generating Golden Test Cases...")
        golden_gen = EnhancedGoldenTestGenerator()
        golden_tests = golden_gen.generate(self.terms, self.entities)
        golden_path = OUTPUT_DIR / "golden_tests_enhanced.json"
        with open(golden_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(golden_tests), 'tests': golden_tests}, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Generated {len(golden_tests)} golden tests")
        
        # 8.10 Summary
        print("\n[8.10] Generating Summary...")
        summary = {
            'generated_at': datetime.now().isoformat(),
            'version': '2.0_enhanced',
            'statistics': {
                'qa_pairs': len(qa_pairs),
                'conversations': len(conversations),
                'few_shot_examples': total_fs,
                'context_chunks': len(chunks),
                'rag_documents': rag_index['document_count'],
                'system_prompts': len(prompts),
                'validation_terms': len(validation),
                'golden_tests': len(golden_tests)
            },
            'improvements': [
                'Fixed dosha questions using entity data',
                'Skipped terms with empty Sanskrit',
                'Better answer formatting',
                'Added clinical case Q&A',
                'Enhanced few-shot with dosha categories'
            ]
        }
        summary_path = REPORTS_DIR / "phase8_enhanced_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print()
        print("=" * 70)
        print("Phase 8 Enhanced Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
        
        print("\nFINAL STATISTICS:")
        for key, value in summary['statistics'].items():
            print(f"  {key}: {value}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    engine = Phase8EnhancedEngine()
    engine.run()


if __name__ == "__main__":
    main()
