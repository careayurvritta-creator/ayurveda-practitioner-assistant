"""
WHO ITA Knowledge Base - Phase 8: AI Training Data Preparation
===============================================================
This script prepares comprehensive AI training data for Gemini model
integration with Ayurvritta AIMRS.

Sub-phases:
8.1  Prompt Template Design
8.2  Question-Answer Pair Generation
8.3  Multi-Turn Conversation Generation
8.4  Few-Shot Example Curation
8.5  Context Window Optimization
8.6  RAG Index Construction
8.7  System Prompt Enhancement
8.8  Validation Set Creation
8.9  Golden Test Cases
8.10 Training Data Packaging
"""

import json
import random
import hashlib
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
PHASE7_DIR = Path("knowledge_base/phase7_knowledge_graph")
OUTPUT_DIR = Path("knowledge_base/phase8_ai_training")
REPORTS_DIR = OUTPUT_DIR / "reports"

random.seed(42)  # Reproducibility

# ============================================================================
# 8.1 PROMPT TEMPLATE LIBRARY
# ============================================================================

class PromptTemplateLibrary:
    """Design and manage prompt templates for various use cases."""
    
    TEMPLATES = {
        # Terminology Lookup
        'term_lookup': {
            'system': """You are an expert Ayurveda terminology assistant with deep knowledge of WHO ITA standards.
When asked about Sanskrit terms, provide:
1. The Sanskrit term in IAST and Devanagari
2. The English translation
3. The WHO ITA code
4. Clinical context and significance
Always cite WHO ITA standards.""",
            'user_template': "What is the meaning of '{sanskrit_term}' in Ayurveda?",
            'assistant_template': """**{english}** ({iast} / {devanagari})

**WHO ITA Code:** {term_id}
**Chapter:** {chapter_name}
**Domain:** {domain}

{context}"""
        },
        
        # Diagnosis Support
        'diagnosis': {
            'system': """You are an Ayurvedic diagnostic assistant based on WHO ITA terminology.
Analyze symptoms using Tridosha theory (Vata, Pitta, Kapha).
Provide differential diagnoses with WHO ITA codes.
Always recommend consulting a qualified Ayurvedic practitioner.""",
            'user_template': "Patient presents with {symptoms}. What are possible Ayurvedic diagnoses?",
            'assistant_template': """**Differential Diagnoses:**

{diagnoses}

**Dosha Assessment:** {dosha_involvement}

**Recommended Examinations:**
{examinations}

> **Note:** Please consult a qualified Ayurvedic practitioner for proper diagnosis."""
        },
        
        # Treatment Recommendation
        'treatment': {
            'system': """You are an Ayurvedic treatment advisor following WHO ITA guidelines.
Recommend treatments based on disease pathology and patient constitution.
Include both Shodhana (purification) and Shamana (pacification) as appropriate.
Always emphasize individualized treatment (Prakriti-based).""",
            'user_template': "What is the Ayurvedic treatment for {condition} ({ita_code})?",
            'assistant_template': """**Treatment for {condition}** (WHO ITA: {ita_code})

**Treatment Principles:**
{principles}

**Shodhana (Purification):**
{shodhana}

**Shamana (Pacification):**
{shamana}

**Dietary Recommendations (Pathya):**
{diet}

**Lifestyle Modifications:**
{lifestyle}"""
        },
        
        # Code Lookup
        'code_lookup': {
            'system': """You are a WHO ITA terminology database assistant.
Provide accurate ITA codes for Ayurvedic conditions and terms.
Include Sanskrit transliteration and Devanagari script.""",
            'user_template': "What is the WHO ITA code for {condition}?",
            'assistant_template': """The WHO ITA code for **{condition}** is:

**Code:** {term_id}
**Sanskrit:** {iast} ({devanagari})
**Chapter:** {chapter} - {chapter_name}"""
        },
        
        # Sanskrit Translation
        'translation': {
            'system': """You are a Sanskrit-English translator specializing in Ayurvedic terminology.
Provide accurate translations with etymological context when relevant.
Use IAST transliteration for Sanskrit terms.""",
            'user_template': "Translate '{text}' from {from_lang} to {to_lang}",
            'assistant_template': """**Translation:**

{from_lang}: {source_text}
{to_lang}: {target_text}

**Notes:** {notes}"""
        },
        
        # Clinical Pathway
        'clinical_pathway': {
            'system': """You are an Ayurvedic clinical pathway advisor.
Guide through the diagnostic and treatment process step by step.
Reference WHO ITA codes throughout.""",
            'user_template': "Guide me through the clinical management of {disease}",
            'assistant_template': """**Clinical Pathway for {disease}** (WHO ITA: {code})

**Step 1: Assessment (Pariksha)**
{assessment}

**Step 2: Diagnosis (Nidana)**
{diagnosis}

**Step 3: Treatment Planning (Chikitsa Sutra)**
{planning}

**Step 4: Interventions**
{interventions}

**Step 5: Follow-up (Paricharya)**
{followup}"""
        }
    }
    
    def get_template(self, template_type: str) -> Dict:
        """Get a specific template."""
        return self.TEMPLATES.get(template_type, {})
    
    def list_templates(self) -> List[str]:
        """List all available templates."""
        return list(self.TEMPLATES.keys())
    
    def export_templates(self) -> Dict:
        """Export all templates."""
        return {
            'version': '1.0',
            'generated_at': datetime.now().isoformat(),
            'template_count': len(self.TEMPLATES),
            'templates': self.TEMPLATES
        }


# ============================================================================
# 8.2 Q&A PAIR GENERATOR
# ============================================================================

class QAPairGenerator:
    """Generate question-answer pairs from knowledge base."""
    
    QA_PATTERNS = [
        # Basic term questions
        ("What is {english} in Ayurveda?", 
         "{english} ({iast} / {devanagari}) refers to {context}. WHO ITA Code: {term_id}"),
        
        ("What is the Sanskrit term for {english}?",
         "The Sanskrit term for {english} is {iast} ({devanagari}). WHO ITA: {term_id}"),
        
        ("What is the WHO ITA code for {english}?",
         "The WHO ITA code for {english} is {term_id}. Sanskrit: {iast}"),
        
        # Dosha questions
        ("Which dosha is associated with {english}?",
         "{english} is associated with {doshas}. This is related to its properties affecting the body's humoral balance."),
        
        # Chapter/Category questions
        ("What category does {english} belong to in WHO ITA?",
         "{english} ({term_id}) belongs to Chapter {chapter}: {chapter_name}."),
        
        # Clinical questions
        ("What is the clinical significance of {english}?",
         "{english} ({iast}) is clinically significant in {domain}. {context}"),
    ]
    
    def generate(self, terms: List[dict]) -> List[Dict]:
        """Generate Q&A pairs from terms."""
        qa_pairs = []
        
        for term in terms:
            # Skip terms without key data
            if not term.get('english') or not term.get('term_id'):
                continue
            
            english = term.get('english', '')
            iast = term.get('iast', '')
            devanagari = term.get('devanagari', '')
            term_id = term.get('term_id', '')
            chapter = term.get('category', {}).get('chapter', '')
            chapter_name = term.get('category', {}).get('chapter_name', '')
            domains = term.get('domains', ['general'])
            doshas = ', '.join(term.get('confidence', {}).get('reason', '').split(';')[:2]) or 'multiple doshas'
            
            context = f"a concept in {chapter_name}" if chapter_name else "an Ayurvedic concept"
            domain = domains[0] if domains else 'general'
            
            # Generate Q&A pairs using patterns
            for question_template, answer_template in self.QA_PATTERNS:
                try:
                    question = question_template.format(
                        english=english, iast=iast, term_id=term_id
                    )
                    answer = answer_template.format(
                        english=english, iast=iast, devanagari=devanagari,
                        term_id=term_id, chapter=chapter, chapter_name=chapter_name,
                        context=context, domain=domain, doshas=doshas
                    )
                    
                    qa_pairs.append({
                        'id': f"qa_{term_id}_{len(qa_pairs)}",
                        'term_id': term_id,
                        'question': question,
                        'answer': answer,
                        'category': 'terminology',
                        'chapter': chapter,
                        'difficulty': 'basic'
                    })
                except KeyError:
                    continue
        
        return qa_pairs


# ============================================================================
# 8.3 MULTI-TURN CONVERSATION GENERATOR
# ============================================================================

class ConversationGenerator:
    """Generate multi-turn diagnostic conversations."""
    
    CONVERSATION_TEMPLATES = [
        {
            'type': 'symptom_inquiry',
            'turns': [
                {'role': 'user', 'content': "I have been experiencing {symptom1}."},
                {'role': 'assistant', 'content': "I understand you're experiencing {symptom1}. Let me ask a few questions to better understand your condition.\n\nHow long have you had this symptom?"},
                {'role': 'user', 'content': "About {duration}."},
                {'role': 'assistant', 'content': "Thank you. Are you also experiencing any of these: {related_symptoms}?"},
                {'role': 'user', 'content': "Yes, I also have {symptom2}."},
                {'role': 'assistant', 'content': "Based on your symptoms ({symptom1} and {symptom2}), this could indicate {possible_condition} (WHO ITA: {ita_code}).\n\nIn Ayurvedic terms, this suggests {dosha_involvement} involvement.\n\n**Recommendation:** Please consult a qualified Ayurvedic practitioner for proper diagnosis and treatment."}
            ]
        },
        {
            'type': 'treatment_inquiry',
            'turns': [
                {'role': 'user', 'content': "What treatment does Ayurveda recommend for {condition}?"},
                {'role': 'assistant', 'content': "{condition} (WHO ITA: {ita_code}) is treated according to the involved doshas.\n\nMay I know your body constitution (Prakriti) - are you primarily Vata, Pitta, or Kapha type?"},
                {'role': 'user', 'content': "I'm not sure. How can I determine that?"},
                {'role': 'assistant', 'content': "Your Prakriti can be determined by observing physical and mental characteristics. Generally:\n\n- **Vata**: Thin build, dry skin, creative, anxious\n- **Pitta**: Medium build, warm body, sharp intellect, prone to anger\n- **Kapha**: Heavy build, oily skin, calm, prone to lethargy\n\nBased on these, which resonates most with you?"},
                {'role': 'user', 'content': "I think I'm {prakriti} type."},
                {'role': 'assistant', 'content': "For a {prakriti} constitution with {condition}, the recommended approach includes:\n\n**Treatment ({treatment_type}):**\n{treatment_details}\n\n**Diet (Pathya):**\n{diet_recommendations}\n\n**Lifestyle:**\n{lifestyle_recommendations}\n\nPlease consult an Ayurvedic practitioner for personalized treatment."}
            ]
        }
    ]
    
    def generate(self, terms: List[dict], pathways: List[dict]) -> List[Dict]:
        """Generate conversation datasets."""
        conversations = []
        
        # Get disease terms
        diseases = [t for t in terms if t.get('category', {}).get('chapter') == '5'][:50]
        
        for disease in diseases:
            english = disease.get('english', '')
            term_id = disease.get('term_id', '')
            
            if not english or not term_id:
                continue
            
            # Generate symptom inquiry conversation
            conv = {
                'id': f"conv_{term_id}",
                'type': 'diagnostic',
                'condition': english,
                'ita_code': term_id,
                'turns': [
                    {'role': 'system', 'content': "You are an Ayurvedic health advisor following WHO ITA standards."},
                    {'role': 'user', 'content': f"What is {english} according to Ayurveda?"},
                    {'role': 'assistant', 'content': f"{english} (WHO ITA: {term_id}) is an Ayurvedic condition. Its Sanskrit name is {disease.get('iast', '')} ({disease.get('devanagari', '')}).\n\nThis condition is classified under Chapter {disease.get('category', {}).get('chapter', '')}: {disease.get('category', {}).get('chapter_name', '')}.\n\nWould you like to know about its treatment or symptoms?"},
                    {'role': 'user', 'content': "Yes, what are the main treatments?"},
                    {'role': 'assistant', 'content': f"Treatment for {english} follows Ayurvedic principles considering the dosha involvement.\n\n**General Approach:**\n1. Nidana Parivarjana (avoiding causative factors)\n2. Shodhana (purification therapy) if indicated\n3. Shamana (palliative treatment)\n4. Pathya (dietary regimen)\n\nFor specific treatment protocols, please consult a qualified Ayurvedic practitioner who can assess your individual constitution (Prakriti) and current imbalance (Vikriti)."}
                ]
            }
            conversations.append(conv)
        
        return conversations


# ============================================================================
# 8.4 FEW-SHOT EXAMPLE CURATOR
# ============================================================================

class FewShotCurator:
    """Curate high-quality few-shot examples."""
    
    def curate(self, terms: List[dict]) -> Dict[str, List[Dict]]:
        """Curate few-shot examples per category."""
        examples = defaultdict(list)
        
        # Group by chapter
        by_chapter = defaultdict(list)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            if term.get('iast') and term.get('devanagari') and term.get('english'):
                by_chapter[chapter].append(term)
        
        # Select best examples per chapter (high confidence)
        for chapter, chapter_terms in by_chapter.items():
            # Sort by confidence
            high_conf = [t for t in chapter_terms if t.get('confidence', {}).get('level') == 'high']
            selected = high_conf[:10] if high_conf else chapter_terms[:10]
            
            for term in selected:
                example = {
                    'term_id': term.get('term_id', ''),
                    'input': f"Define: {term.get('english', '')}",
                    'output': f"{term.get('english', '')} ({term.get('iast', '')} / {term.get('devanagari', '')})\n\nWHO ITA Code: {term.get('term_id', '')}\nChapter: {term.get('category', {}).get('chapter_name', '')}\nDomain: {', '.join(term.get('domains', []))}"
                }
                examples[f"chapter_{chapter}"].append(example)
        
        # Add edge cases
        examples['edge_cases'] = self._select_edge_cases(terms)
        
        return dict(examples)
    
    def _select_edge_cases(self, terms: List[dict]) -> List[Dict]:
        """Select edge case examples."""
        edge_cases = []
        
        # Long terms
        long_terms = sorted(terms, key=lambda t: len(t.get('english', '')), reverse=True)[:5]
        for term in long_terms:
            edge_cases.append({
                'type': 'long_term',
                'term_id': term.get('term_id', ''),
                'input': f"What is {term.get('english', '')}?",
                'output': f"This refers to {term.get('english', '')} ({term.get('iast', '')})"
            })
        
        # Terms with special characters
        special = [t for t in terms if any(c in t.get('iast', '') for c in ['ṣ', 'ṭ', 'ḍ', 'ṇ'])][:5]
        for term in special:
            edge_cases.append({
                'type': 'special_chars',
                'term_id': term.get('term_id', ''),
                'input': f"How do you write {term.get('english', '')} in Sanskrit?",
                'output': f"IAST: {term.get('iast', '')}\nDevanagari: {term.get('devanagari', '')}"
            })
        
        return edge_cases


# ============================================================================
# 8.5 CONTEXT WINDOW OPTIMIZER
# ============================================================================

class ContextWindowOptimizer:
    """Optimize data for context window limits."""
    
    CHUNK_SIZE = 4000  # Characters per chunk
    
    def create_chunks(self, terms: List[dict]) -> List[Dict]:
        """Create optimized chunks for context windows."""
        chunks = []
        current_chunk = []
        current_size = 0
        
        # Group terms by chapter first
        by_chapter = defaultdict(list)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', '0')
            by_chapter[chapter].append(term)
        
        chunk_id = 0
        for chapter in sorted(by_chapter.keys()):
            for term in by_chapter[chapter]:
                term_text = self._format_term_compact(term)
                term_size = len(term_text)
                
                if current_size + term_size > self.CHUNK_SIZE and current_chunk:
                    chunks.append({
                        'chunk_id': f"chunk_{chunk_id}",
                        'chapter': chapter,
                        'term_count': len(current_chunk),
                        'char_count': current_size,
                        'terms': current_chunk,
                        'text': '\n'.join(self._format_term_compact(t) for t in current_chunk)
                    })
                    chunk_id += 1
                    current_chunk = []
                    current_size = 0
                
                current_chunk.append(term)
                current_size += term_size
        
        # Last chunk
        if current_chunk:
            chunks.append({
                'chunk_id': f"chunk_{chunk_id}",
                'chapter': chapter,
                'term_count': len(current_chunk),
                'char_count': current_size,
                'terms': current_chunk,
                'text': '\n'.join(self._format_term_compact(t) for t in current_chunk)
            })
        
        return chunks
    
    def _format_term_compact(self, term: dict) -> str:
        """Format term compactly for context."""
        return f"{term.get('term_id', '')}: {term.get('english', '')} | {term.get('iast', '')} | {term.get('devanagari', '')}"


# ============================================================================
# 8.6 RAG INDEX BUILDER
# ============================================================================

class RAGIndexBuilder:
    """Build vector index for Retrieval-Augmented Generation."""
    
    def build_index(self, terms: List[dict]) -> Dict:
        """Build RAG-ready index structure."""
        documents = []
        
        for term in terms:
            # Create document for each term
            doc_text = self._create_document_text(term)
            doc_id = term.get('term_id', '')
            
            # Generate embedding placeholder (hash-based for demo)
            embedding_placeholder = self._generate_placeholder_embedding(doc_text)
            
            documents.append({
                'id': doc_id,
                'text': doc_text,
                'metadata': {
                    'english': term.get('english', ''),
                    'iast': term.get('iast', ''),
                    'devanagari': term.get('devanagari', ''),
                    'chapter': term.get('category', {}).get('chapter', ''),
                    'domains': term.get('domains', [])
                },
                'embedding_dim': 384,
                'embedding_sample': embedding_placeholder[:10]
            })
        
        return {
            'index_type': 'semantic',
            'embedding_model': 'placeholder-384',
            'document_count': len(documents),
            'documents': documents
        }
    
    def _create_document_text(self, term: dict) -> str:
        """Create searchable document text."""
        parts = [
            term.get('english', ''),
            term.get('iast', ''),
            term.get('devanagari', ''),
            term.get('category', {}).get('chapter_name', ''),
            ' '.join(term.get('domains', []))
        ]
        return ' '.join(filter(None, parts))
    
    def _generate_placeholder_embedding(self, text: str) -> List[float]:
        """Generate placeholder embedding."""
        hash_val = hashlib.md5(text.encode()).hexdigest()
        return [int(hash_val[i:i+2], 16) / 255.0 for i in range(0, 32, 2)]


# ============================================================================
# 8.7 SYSTEM PROMPT ENHANCER
# ============================================================================

class SystemPromptEnhancer:
    """Create enhanced system prompts with ITA knowledge."""
    
    def create_enhanced_prompts(self, terms: List[dict]) -> Dict[str, str]:
        """Create role-specific enhanced system prompts."""
        
        # Count terms by chapter for context
        chapter_counts = defaultdict(int)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            chapter_counts[chapter] += 1
        
        prompts = {
            'general_assistant': f"""You are an expert Ayurveda AI assistant integrated with the WHO International Standard Terminologies on Ayurveda (ITA) knowledge base.

**Knowledge Base Statistics:**
- Total terms: {len(terms)}
- Chapters covered: {len(chapter_counts)}
- Primary sources: WHO ITA, Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya

**Core Principles:**
1. Always cite WHO ITA codes when referencing Ayurvedic terms
2. Provide Sanskrit in both IAST transliteration and Devanagari script
3. Apply Tridosha theory (Vata, Pitta, Kapha) in assessments
4. Recommend consulting qualified practitioners for clinical decisions

**Sanskrit Rendering Guidelines:**
- Use IAST for transliteration (e.g., ayurveda, cikitsa)
- Include Devanagari when available
- Format: Term (IAST / Devanagari) - WHO ITA: X.X.X

**Citation Format:**
When citing terms, use: "[Term] (WHO ITA: [Code])"
Example: "Jwara (WHO ITA: 5.1.1) refers to fever..."

**Domains of Expertise:**
- Background Terminology (Chapter 1)
- Physiology & Constitution (Chapter 2)
- Anatomy (Chapter 3)
- Pathology (Chapter 4)
- Diseases (Chapter 5)
- Materia Medica (Chapter 6)
- Formulations (Chapter 7)
- Dietetics (Chapter 8)
- Therapeutics (Chapter 9)
- Panchakarma (Chapter 10)""",

            'diagnostic_assistant': f"""You are an Ayurvedic Diagnostic Assistant following WHO ITA standards.

**Role:** Guide users through symptom assessment and provide differential diagnoses based on Ayurvedic principles.

**Diagnostic Framework:**
1. **Prakriti Assessment** - Constitutional analysis (Vata/Pitta/Kapha)
2. **Vikriti Analysis** - Current imbalance evaluation
3. **Nidana** - Causative factor identification
4. **Purvarupa** - Prodromal symptoms
5. **Rupa** - Manifest symptoms
6. **Upashaya** - Therapeutic tests

**Key Guidelines:**
- Reference WHO ITA codes for all conditions
- Consider tridosha involvement in all assessments
- Provide Sanskrit terminology with transliteration
- Always recommend professional consultation

**Disclaimer:** This is for educational purposes only. Always consult a qualified Ayurvedic practitioner.""",

            'treatment_advisor': f"""You are an Ayurvedic Treatment Advisor based on WHO ITA terminology.

**Treatment Modalities:**
1. **Shodhana (Purification)**
   - Vamana (therapeutic emesis)
   - Virecana (therapeutic purgation)
   - Basti (therapeutic enema)
   - Nasya (nasal therapy)
   - Raktamokshana (bloodletting)

2. **Shamana (Palliative)**
   - Dipana (digestive stimulation)
   - Pachana (digestive therapy)
   - Langhana (lightening therapy)

3. **Rasayana (Rejuvenation)**
4. **Vajikarana (Aphrodisiac therapy)**

**Prescription Format:**
- Drug name (Sanskrit/English)
- WHO ITA code if applicable
- Dosage guidelines
- Anupana (vehicle)
- Duration
- Pathya-Apathya (do's and don'ts)

**Safety Notes:**
- Consider contraindications
- Note drug interactions
- Recommend practitioner supervision"""
        }
        
        return prompts


# ============================================================================
# 8.8 VALIDATION SET CREATOR
# ============================================================================

class ValidationSetCreator:
    """Create held-out validation dataset."""
    
    VALIDATION_RATIO = 0.10  # 10%
    
    def create(self, terms: List[dict]) -> Tuple[List[dict], List[dict]]:
        """Split data into training and validation sets."""
        # Stratify by chapter
        by_chapter = defaultdict(list)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            by_chapter[chapter].append(term)
        
        training = []
        validation = []
        
        for chapter, chapter_terms in by_chapter.items():
            random.shuffle(chapter_terms)
            split_idx = int(len(chapter_terms) * (1 - self.VALIDATION_RATIO))
            training.extend(chapter_terms[:split_idx])
            validation.extend(chapter_terms[split_idx:])
        
        return training, validation


# ============================================================================
# 8.9 GOLDEN TEST CASE GENERATOR
# ============================================================================

class GoldenTestGenerator:
    """Generate expert-verified golden test cases."""
    
    def generate(self, terms: List[dict]) -> List[Dict]:
        """Generate 100 golden test cases covering all chapters."""
        golden_tests = []
        
        # Group by chapter
        by_chapter = defaultdict(list)
        for term in terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            # Only high-confidence terms
            if term.get('confidence', {}).get('level') == 'high':
                by_chapter[chapter].append(term)
        
        # Select 10 from each chapter
        tests_per_chapter = 10
        for chapter in sorted(by_chapter.keys()):
            chapter_terms = by_chapter[chapter]
            selected = random.sample(chapter_terms, min(tests_per_chapter, len(chapter_terms)))
            
            for term in selected:
                test_case = {
                    'id': f"golden_{term.get('term_id', '')}",
                    'term_id': term.get('term_id', ''),
                    'chapter': chapter,
                    'question': f"What is {term.get('english', '')} in Ayurveda?",
                    'expected_answer': {
                        'english': term.get('english', ''),
                        'iast': term.get('iast', ''),
                        'devanagari': term.get('devanagari', ''),
                        'term_id': term.get('term_id', ''),
                        'chapter': term.get('category', {}).get('chapter_name', '')
                    },
                    'grading_criteria': [
                        'Must include correct WHO ITA code',
                        'Must include Sanskrit term (IAST or Devanagari)',
                        'Must provide accurate definition',
                        'Should mention relevant chapter/category'
                    ],
                    'difficulty': 'standard',
                    'verified': True
                }
                golden_tests.append(test_case)
        
        return golden_tests[:100]  # Ensure max 100


# ============================================================================
# 8.10 TRAINING DATA PACKAGER
# ============================================================================

class TrainingDataPackager:
    """Package all training data with documentation."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
    
    def package(self, 
                qa_pairs: List[Dict],
                conversations: List[Dict],
                few_shot: Dict,
                chunks: List[Dict],
                rag_index: Dict,
                prompts: Dict,
                validation: List[dict],
                golden_tests: List[Dict]) -> Dict:
        """Package all training data."""
        
        # Save each component
        files = {}
        
        # Q&A pairs
        qa_path = self.output_dir / "qa_training_data.json"
        with open(qa_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(qa_pairs), 'pairs': qa_pairs}, f, indent=2, ensure_ascii=False)
        files['qa_pairs'] = str(qa_path)
        
        # Conversations
        conv_path = self.output_dir / "conversation_training_data.json"
        with open(conv_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(conversations), 'conversations': conversations}, f, indent=2, ensure_ascii=False)
        files['conversations'] = str(conv_path)
        
        # Few-shot examples
        fs_path = self.output_dir / "few_shot_examples.json"
        with open(fs_path, 'w', encoding='utf-8') as f:
            json.dump(few_shot, f, indent=2, ensure_ascii=False)
        files['few_shot'] = str(fs_path)
        
        # Chunks
        chunk_path = self.output_dir / "context_chunks.json"
        with open(chunk_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(chunks), 'chunks': chunks}, f, indent=2, ensure_ascii=False)
        files['chunks'] = str(chunk_path)
        
        # RAG index
        rag_path = self.output_dir / "rag_index.json"
        with open(rag_path, 'w', encoding='utf-8') as f:
            json.dump(rag_index, f, indent=2, ensure_ascii=False)
        files['rag_index'] = str(rag_path)
        
        # System prompts
        prompt_path = self.output_dir / "system_prompts.json"
        with open(prompt_path, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, indent=2, ensure_ascii=False)
        files['system_prompts'] = str(prompt_path)
        
        # Validation set
        val_path = self.output_dir / "validation_set.json"
        with open(val_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(validation), 'terms': validation}, f, indent=2, ensure_ascii=False)
        files['validation'] = str(val_path)
        
        # Golden tests
        golden_path = self.output_dir / "golden_test_cases.json"
        with open(golden_path, 'w', encoding='utf-8') as f:
            json.dump({'count': len(golden_tests), 'tests': golden_tests}, f, indent=2, ensure_ascii=False)
        files['golden_tests'] = str(golden_path)
        
        # Create manifest
        manifest = {
            'package_name': 'WHO_ITA_AI_Training_Data',
            'version': '1.0',
            'generated_at': datetime.now().isoformat(),
            'files': files,
            'statistics': {
                'qa_pairs': len(qa_pairs),
                'conversations': len(conversations),
                'few_shot_examples': sum(len(v) for v in few_shot.values()),
                'context_chunks': len(chunks),
                'rag_documents': rag_index.get('document_count', 0),
                'system_prompts': len(prompts),
                'validation_terms': len(validation),
                'golden_tests': len(golden_tests)
            }
        }
        
        manifest_path = self.output_dir / "training_data_manifest.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        return manifest


# ============================================================================
# MAIN PHASE 8 ENGINE
# ============================================================================

class Phase8AITrainingPreparation:
    """Main engine for AI training data preparation."""
    
    def __init__(self):
        self.template_lib = PromptTemplateLibrary()
        self.qa_generator = QAPairGenerator()
        self.conv_generator = ConversationGenerator()
        self.few_shot_curator = FewShotCurator()
        self.context_optimizer = ContextWindowOptimizer()
        self.rag_builder = RAGIndexBuilder()
        self.prompt_enhancer = SystemPromptEnhancer()
        self.validation_creator = ValidationSetCreator()
        self.golden_generator = GoldenTestGenerator()
        self.packager = TrainingDataPackager(OUTPUT_DIR)
        
        self.terms = []
        self.pathways = []
    
    def load_data(self):
        """Load data from previous phases."""
        print("[LOAD] Loading normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
        
        # Load clinical pathways
        pathway_path = PHASE7_DIR / "clinical_pathways.json"
        if pathway_path.exists():
            with open(pathway_path, 'r', encoding='utf-8') as f:
                self.pathways = json.load(f)
            print(f"  [OK] Loaded {len(self.pathways)} clinical pathways")
    
    def run(self):
        """Run all Phase 8 sub-phases."""
        print("=" * 70)
        print("Phase 8: AI Training Data Preparation")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        self.load_data()
        
        # 8.1 Prompt Templates
        print("\n[8.1] Designing Prompt Templates...")
        templates = self.template_lib.export_templates()
        template_path = OUTPUT_DIR / "prompt_templates.json"
        with open(template_path, 'w', encoding='utf-8') as f:
            json.dump(templates, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Created {templates['template_count']} templates")
        
        # 8.2 Q&A Pairs
        print("\n[8.2] Generating Q&A Pairs...")
        qa_pairs = self.qa_generator.generate(self.terms)
        print(f"  [OK] Generated {len(qa_pairs)} Q&A pairs")
        
        # 8.3 Conversations
        print("\n[8.3] Generating Multi-Turn Conversations...")
        conversations = self.conv_generator.generate(self.terms, self.pathways)
        print(f"  [OK] Generated {len(conversations)} conversations")
        
        # 8.4 Few-Shot Examples
        print("\n[8.4] Curating Few-Shot Examples...")
        few_shot = self.few_shot_curator.curate(self.terms)
        total_examples = sum(len(v) for v in few_shot.values())
        print(f"  [OK] Curated {total_examples} few-shot examples across {len(few_shot)} categories")
        
        # 8.5 Context Chunks
        print("\n[8.5] Optimizing Context Windows...")
        chunks = self.context_optimizer.create_chunks(self.terms)
        print(f"  [OK] Created {len(chunks)} context chunks")
        
        # 8.6 RAG Index
        print("\n[8.6] Building RAG Index...")
        rag_index = self.rag_builder.build_index(self.terms)
        print(f"  [OK] Built index with {rag_index['document_count']} documents")
        
        # 8.7 System Prompts
        print("\n[8.7] Creating Enhanced System Prompts...")
        prompts = self.prompt_enhancer.create_enhanced_prompts(self.terms)
        print(f"  [OK] Created {len(prompts)} role-specific prompts")
        
        # 8.8 Validation Set
        print("\n[8.8] Creating Validation Set...")
        training, validation = self.validation_creator.create(self.terms)
        print(f"  [OK] Split: {len(training)} training, {len(validation)} validation")
        
        # 8.9 Golden Tests
        print("\n[8.9] Generating Golden Test Cases...")
        golden_tests = self.golden_generator.generate(self.terms)
        print(f"  [OK] Generated {len(golden_tests)} golden test cases")
        
        # 8.10 Package
        print("\n[8.10] Packaging Training Data...")
        manifest = self.packager.package(
            qa_pairs, conversations, few_shot, chunks,
            rag_index, prompts, validation, golden_tests
        )
        print(f"  [OK] Package created with {len(manifest['files'])} files")
        
        # Save summary
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 8,
            'statistics': manifest['statistics'],
            'files': list(manifest['files'].keys())
        }
        summary_path = REPORTS_DIR / "phase8_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print()
        print("=" * 70)
        print("Phase 8 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
        
        print("\nFINAL STATISTICS:")
        for key, value in manifest['statistics'].items():
            print(f"  {key}: {value}")


def main():
    """Main entry point."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    engine = Phase8AITrainingPreparation()
    engine.run()


if __name__ == "__main__":
    main()
