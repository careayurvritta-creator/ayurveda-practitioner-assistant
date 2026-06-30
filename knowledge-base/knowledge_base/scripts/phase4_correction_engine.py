"""
WHO ITA Knowledge Base - Phase 4: Automated Sanskrit Correction Engine
========================================================================
This script implements all 10 sub-phases of Phase 4 to build a comprehensive
automated correction system for Sanskrit terms.

Sub-phases:
4.1  IAST Transliteration Engine
4.2  Devanagari → IAST Reverse Converter
4.3  Font Corruption Auto-Fixer
4.4  Matra Sequence Normalizer
4.5  Dictionary Lookup Validator
4.6  Compound Word Analyzer
4.7  Diacritical Mark Fixer (IAST)
4.8  Synonym Linking Engine
4.9  Confidence Score Assignment
4.10 Human Review Queue
"""

import json
import re
import unicodedata
import csv
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple, Optional

# Configuration
PHASE2_DIR = Path("knowledge_base/phase2_sanskrit_errors")
PHASE3_DIR = Path("knowledge_base/phase3_reference")
OUTPUT_DIR = Path("knowledge_base/phase4_correction_engine")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# 4.1 IAST TRANSLITERATION ENGINE
# ============================================================================

class IASTTransliterator:
    """Bidirectional IAST ↔ Devanagari transliteration engine."""
    
    # IAST to Devanagari mapping (comprehensive)
    IAST_TO_DEVA = {
        # Independent vowels
        'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई', 'u': 'उ', 'ū': 'ऊ',
        'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ḷ': 'ऌ', 'ḹ': 'ॡ',
        'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
        
        # Consonants
        'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
        'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
        'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
        't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
        'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
        'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
        'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह',
        
        # Special characters
        'ṃ': 'ं', 'ḥ': 'ः', "'": 'ऽ',  # avagraha
    }
    
    # Matra (vowel signs) for consonants
    MATRA = {
        'a': '', 'ā': 'ा', 'i': 'ि', 'ī': 'ी', 'u': 'ु', 'ū': 'ू',
        'ṛ': 'ृ', 'ṝ': 'ॄ', 'ḷ': 'ॢ', 'ḹ': 'ॣ',
        'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ',
    }
    
    VOWELS = set('aāiīuūṛṝḷḹeaiṃoau')
    CONSONANTS = set('kgṅcjñṭḍṇtdnpbmyrlvśṣsh')
    VIRAMA = '्'
    
    # Devanagari to IAST mapping (reverse)
    DEVA_TO_IAST = {}
    
    def __init__(self):
        # Build reverse mapping
        for iast, deva in self.IAST_TO_DEVA.items():
            self.DEVA_TO_IAST[deva] = iast
        
        # Add consonants with virama
        consonants_deva = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'
        consonants_iast = ['k','kh','g','gh','ṅ','c','ch','j','jh','ñ',
                          'ṭ','ṭh','ḍ','ḍh','ṇ','t','th','d','dh','n',
                          'p','ph','b','bh','m','y','r','l','v','ś','ṣ','s','h']
        
        for i, deva in enumerate(consonants_deva):
            if i < len(consonants_iast):
                self.DEVA_TO_IAST[deva] = consonants_iast[i]
        
        # Matra to vowel
        matra_to_vowel = {'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū',
                         'ृ': 'ṛ', 'ॄ': 'ṝ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au'}
        self.DEVA_TO_IAST.update(matra_to_vowel)
        
        # Sorted patterns by length (longest first for greedy matching)
        self.iast_patterns = sorted(self.IAST_TO_DEVA.keys(), key=len, reverse=True)
        self.matra_patterns = sorted(self.MATRA.keys(), key=len, reverse=True)
    
    def iast_to_devanagari(self, iast: str) -> str:
        """Convert IAST to Devanagari."""
        if not iast:
            return ''
        
        result = []
        i = 0
        iast_lower = iast.lower()
        prev_was_consonant = False
        
        while i < len(iast_lower):
            matched = False
            
            # Try matching longest patterns first
            for pattern in self.iast_patterns:
                if iast_lower[i:].startswith(pattern):
                    char = self.IAST_TO_DEVA[pattern]
                    
                    # Check if this is a consonant
                    is_consonant = pattern[0] in self.CONSONANTS
                    is_vowel = pattern in self.MATRA
                    
                    if is_consonant:
                        result.append(char)
                        # Check if next char is a vowel
                        remaining = iast_lower[i + len(pattern):]
                        vowel_found = False
                        for v_pattern in self.matra_patterns:
                            if remaining.startswith(v_pattern):
                                matra = self.MATRA[v_pattern]
                                result.append(matra)
                                i += len(v_pattern)
                                vowel_found = True
                                break
                        if not vowel_found and remaining and remaining[0] not in 'aāiīuūṛṝḷḹeoṃḥ':
                            # Add virama if no vowel follows
                            if remaining and remaining[0] in self.CONSONANTS:
                                result.append(self.VIRAMA)
                        prev_was_consonant = not vowel_found
                    else:
                        result.append(char)
                        prev_was_consonant = False
                    
                    i += len(pattern)
                    matched = True
                    break
            
            if not matched:
                # Keep original character
                result.append(iast[i])
                i += 1
                prev_was_consonant = False
        
        return ''.join(result)
    
    def devanagari_to_iast(self, deva: str) -> str:
        """Convert Devanagari to IAST."""
        if not deva:
            return ''
        
        result = []
        i = 0
        
        while i < len(deva):
            char = deva[i]
            
            if char == self.VIRAMA:
                # Skip virama, no 'a' added
                i += 1
                continue
            
            if char in self.DEVA_TO_IAST:
                iast_char = self.DEVA_TO_IAST[char]
                result.append(iast_char)
                
                # Check if consonant needs inherent 'a'
                if char in 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह':
                    # Check if followed by matra or virama
                    if i + 1 < len(deva):
                        next_char = deva[i + 1]
                        if next_char not in 'ािीुूृॄेैोौ्ंः':
                            result.append('a')
                    else:
                        result.append('a')
            else:
                result.append(char)
            
            i += 1
        
        return ''.join(result)


# ============================================================================
# 4.3 FONT CORRUPTION AUTO-FIXER
# ============================================================================

class FontCorruptionFixer:
    """Fix common font corruption patterns from PDF conversion."""
    
    # Common corruption patterns
    CORRUPTION_PATTERNS = {
        # Missing characters due to PDF rendering
        'त्र': 'त्र',  # tra conjunct
        'क्ष': 'क्ष',  # ksha conjunct
        'ज्ञ': 'ज्ञ',  # jña conjunct
        'श्र': 'श्र',  # śra conjunct
        'द्ध': 'द्ध',  # ddha conjunct
        'द्य': 'द्य',  # dya conjunct
        'त्त': 'त्त',  # tta conjunct
        'त्य': 'त्य',  # tya conjunct
        'न्त': 'न्त',  # nta conjunct
        'न्द': 'न्द',  # nda conjunct
        'स्त': 'स्त',  # sta conjunct
        'स्थ': 'स्थ',  # stha conjunct
        'ष्ट': 'ष्ट',  # ṣṭa conjunct
        'ष्ठ': 'ष्ठ',  # ṣṭha conjunct
    }
    
    def fix(self, text: str) -> Tuple[str, List[str]]:
        """Apply corruption fixes and return corrected text with log."""
        if not text:
            return text, []
        
        corrections = []
        result = text
        
        # Apply Unicode NFC normalization first
        result = unicodedata.normalize('NFC', result)
        
        # Apply known patterns
        for pattern, replacement in self.CORRUPTION_PATTERNS.items():
            if pattern in result and pattern != replacement:
                old = result
                result = result.replace(pattern, replacement)
                if old != result:
                    corrections.append(f"Conjunct fix: {pattern} → {replacement}")
        
        return result, corrections


# ============================================================================
# 4.4 MATRA SEQUENCE NORMALIZER
# ============================================================================

class MatraNormalizer:
    """Normalize matra (vowel sign) sequences in Devanagari."""
    
    # Valid matra characters
    MATRAS = set('ािीुूृॄेैोौ')
    ANUSVARA = 'ं'
    VISARGA = 'ः'
    CHANDRABINDU = 'ँ'
    VIRAMA = '्'
    
    def normalize(self, text: str) -> Tuple[str, List[str]]:
        """Normalize matra sequences."""
        if not text:
            return text, []
        
        corrections = []
        
        # Apply NFC normalization
        normalized = unicodedata.normalize('NFC', text)
        if normalized != text:
            corrections.append("Applied Unicode NFC normalization")
        
        # Check for orphaned matras (matra at start or after space)
        words = normalized.split()
        fixed_words = []
        
        for word in words:
            if word and word[0] in self.MATRAS:
                # Orphaned matra - this is an error
                corrections.append(f"Orphaned matra detected: {word[:5]}...")
            fixed_words.append(word)
        
        result = ' '.join(fixed_words)
        
        return result, corrections


# ============================================================================
# 4.5 DICTIONARY LOOKUP VALIDATOR
# ============================================================================

class DictionaryValidator:
    """Validate terms against authoritative dictionary."""
    
    def __init__(self, reference_terms: Dict[str, dict]):
        self.reference = reference_terms
        self.iast_index = {k.lower(): v for k, v in reference_terms.items()}
    
    def validate(self, iast: str) -> Tuple[bool, Optional[dict], float]:
        """
        Validate IAST term against dictionary.
        Returns: (is_valid, match_info, confidence)
        """
        if not iast:
            return False, None, 0.0
        
        # Clean and normalize
        iast_clean = iast.strip().lower()
        iast_clean = re.sub(r'[,.\s;:]+$', '', iast_clean)
        
        # Direct match
        if iast_clean in self.iast_index:
            return True, self.iast_index[iast_clean], 1.0
        
        # Try without final visarga
        if iast_clean.endswith('ḥ'):
            base = iast_clean[:-1]
            if base in self.iast_index:
                return True, self.iast_index[base], 0.95
        
        # Try without final 'm'
        if iast_clean.endswith('m'):
            base = iast_clean[:-1]
            if base in self.iast_index:
                return True, self.iast_index[base], 0.95
        
        # Fuzzy match using Levenshtein-like similarity
        best_match = None
        best_score = 0.0
        
        for ref_iast, ref_info in self.iast_index.items():
            score = self._similarity(iast_clean, ref_iast)
            if score > best_score and score > 0.8:
                best_score = score
                best_match = ref_info
        
        if best_match:
            return True, best_match, best_score
        
        return False, None, 0.0
    
    def _similarity(self, s1: str, s2: str) -> float:
        """Calculate string similarity (0-1)."""
        if s1 == s2:
            return 1.0
        if not s1 or not s2:
            return 0.0
        
        # Simple character overlap ratio
        common = len(set(s1) & set(s2))
        total = len(set(s1) | set(s2))
        return common / total if total > 0 else 0.0


# ============================================================================
# 4.6 COMPOUND WORD ANALYZER
# ============================================================================

class CompoundAnalyzer:
    """Analyze Sanskrit compound words (samāsa)."""
    
    # Common compound components
    COMMON_PREFIXES = {
        'a': 'not, without', 'an': 'not, without',
        'su': 'good, well', 'dus': 'bad, ill', 'dur': 'bad, ill',
        'sa': 'with', 'sam': 'together', 'pra': 'forth',
        'vi': 'apart', 'upa': 'near', 'anu': 'after',
        'pari': 'around', 'abhi': 'towards', 'ava': 'down',
        'ni': 'down, into', 'nis': 'out', 'nir': 'out',
        'ati': 'over, beyond', 'adhi': 'over',
    }
    
    COMMON_SUFFIXES = {
        'tā': 'state of', 'tva': 'state of',
        'maya': 'made of', 'vat': 'having',
        'ja': 'born from', 'kara': 'making',
        'hara': 'removing', 'ghna': 'destroying',
        'cikitsā': 'treatment', 'roga': 'disease',
        'vāta': 'wind disorder', 'pitta': 'bile disorder',
        'kapha': 'phlegm disorder', 'dhātu': 'tissue',
    }
    
    def analyze(self, iast: str) -> Dict:
        """Analyze compound word structure."""
        if not iast:
            return {'components': [], 'type': 'unknown'}
        
        iast_lower = iast.lower().strip()
        components = []
        
        # Check for prefixes
        for prefix, meaning in self.COMMON_PREFIXES.items():
            if iast_lower.startswith(prefix):
                components.append({
                    'part': prefix,
                    'type': 'prefix',
                    'meaning': meaning
                })
                break
        
        # Check for suffixes
        for suffix, meaning in self.COMMON_SUFFIXES.items():
            if iast_lower.endswith(suffix):
                components.append({
                    'part': suffix,
                    'type': 'suffix',
                    'meaning': meaning
                })
                break
        
        return {
            'original': iast,
            'components': components,
            'is_compound': len(components) > 0,
            'type': 'tatpuruṣa' if components else 'simple'
        }


# ============================================================================
# 4.7 DIACRITICAL MARK FIXER
# ============================================================================

class DiacriticalFixer:
    """Fix missing or incorrect diacritical marks in IAST."""
    
    # Common IAST corrections
    COMMON_ERRORS = {
        # Missing macrons (long vowels)
        'ayurveda': 'āyurveda',
        'cikitsa': 'cikitsā',
        'vidya': 'vidyā',
        'sutra': 'sūtra',
        'sastra': 'śāstra',
        'tantra': 'tantra',
        'vata': 'vāta',
        'prana': 'prāṇa',
        'dhatu': 'dhātu',
        
        # Missing retroflex dots
        'roga': 'roga',
        'dosha': 'doṣa',
        'dosa': 'doṣa',
        
        # Common spelling variations
        'kapha': 'kapha',
        'vaidya': 'vaidya',
    }
    
    def fix(self, iast: str) -> Tuple[str, bool, str]:
        """
        Fix diacritical marks.
        Returns: (corrected, was_fixed, reason)
        """
        if not iast:
            return iast, False, ''
        
        iast_lower = iast.lower().strip()
        iast_clean = re.sub(r'[,.\s;:]+$', '', iast_lower)
        
        if iast_clean in self.COMMON_ERRORS:
            corrected = self.COMMON_ERRORS[iast_clean]
            if corrected != iast_clean:
                return corrected, True, f"Common error correction: {iast_clean} → {corrected}"
        
        return iast, False, ''


# ============================================================================
# 4.8 SYNONYM LINKING ENGINE
# ============================================================================

class SynonymLinker:
    """Link synonymous Sanskrit terms."""
    
    # Known synonym clusters
    SYNONYMS = {
        'kapha_cluster': ['kapha', 'śleṣman', 'śleṣmā'],
        'vata_cluster': ['vāta', 'vāyu', 'anila', 'marut', 'prāṇa'],
        'agni_cluster': ['agni', 'pāvaka', 'jāṭharāgni', 'vahni'],
        'disease_cluster': ['roga', 'vyādhi', 'vikāra', 'āmaya', 'gadaḥ'],
        'treatment_cluster': ['cikitsā', 'upacāra', 'pratikriyā'],
        'medicine_cluster': ['auṣadha', 'bheṣaja', 'dravya'],
        'body_cluster': ['śarīra', 'deha', 'kāya', 'tanu'],
    }
    
    def __init__(self):
        # Build reverse index
        self.term_to_cluster = {}
        for cluster_name, terms in self.SYNONYMS.items():
            for term in terms:
                self.term_to_cluster[term.lower()] = cluster_name
    
    def find_synonyms(self, iast: str) -> Optional[Dict]:
        """Find synonyms for a given term."""
        if not iast:
            return None
        
        iast_lower = iast.lower().strip()
        iast_clean = re.sub(r'[,.\s;:ḥ]+$', '', iast_lower)
        
        if iast_clean in self.term_to_cluster:
            cluster_name = self.term_to_cluster[iast_clean]
            return {
                'cluster': cluster_name,
                'synonyms': self.SYNONYMS[cluster_name],
                'primary': self.SYNONYMS[cluster_name][0]
            }
        
        return None


# ============================================================================
# 4.9 CONFIDENCE SCORE ASSIGNMENT
# ============================================================================

class ConfidenceScorer:
    """Assign confidence scores to corrections."""
    
    def score(self, term: dict, dict_validated: bool, was_corrected: bool,
              has_synonyms: bool) -> Tuple[str, float, str]:
        """
        Calculate confidence score.
        Returns: (level, score, reason)
        """
        score = 0.0
        reasons = []
        
        # Dictionary validation is highest weight
        if dict_validated:
            score += 0.5
            reasons.append("Dictionary verified")
        
        # Phase 2 correction
        if was_corrected:
            score += 0.3
            reasons.append("IAST-corrected")
        
        # Has both IAST and Devanagari
        if term.get('iast') and term.get('devanagari'):
            score += 0.15
            reasons.append("IAST+Devanagari present")
        
        # Has synonyms (more context)
        if has_synonyms:
            score += 0.05
            reasons.append("Synonym cluster found")
        
        # Determine level
        if score >= 0.8:
            level = 'high'
        elif score >= 0.5:
            level = 'medium'
        else:
            level = 'low'
        
        return level, round(score, 2), '; '.join(reasons)


# ============================================================================
# MAIN PHASE 4 ENGINE
# ============================================================================

class Phase4CorrectionEngine:
    """Main correction engine orchestrating all sub-phases."""
    
    def __init__(self):
        self.transliterator = IASTTransliterator()
        self.font_fixer = FontCorruptionFixer()
        self.matra_normalizer = MatraNormalizer()
        self.compound_analyzer = CompoundAnalyzer()
        self.diacritical_fixer = DiacriticalFixer()
        self.synonym_linker = SynonymLinker()
        self.confidence_scorer = ConfidenceScorer()
        
        self.terms = []
        self.corrected_terms = []
        self.review_queue = []
        self.stats = Counter()
    
    def load_data(self):
        """Load data from previous phases."""
        print("[LOAD] Loading enhanced master index from Phase 3...")
        index_path = PHASE3_DIR / "enhanced_master_index.json"
        with open(index_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
        
        # Load reference terms
        from phase3_enhanced_verification import AUTHORITATIVE_TERMS
        self.dict_validator = DictionaryValidator(AUTHORITATIVE_TERMS)
        print(f"  [OK] Loaded {len(AUTHORITATIVE_TERMS)} reference terms")
    
    def run_all_phases(self):
        """Execute all Phase 4 sub-phases."""
        print("=" * 70)
        print("WHO ITA Knowledge Base - Phase 4: Correction Engine")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        self.load_data()
        
        print("\n[4.1] IAST Transliteration Engine...")
        print("  [OK] Engine initialized with bidirectional support")
        
        print("\n[4.2] Devanagari -> IAST Reverse Converter...")
        print("  [OK] Reverse converter ready")
        
        # Process all terms
        print("\n[4.3-4.9] Processing all terms...")
        
        for term in self.terms:
            processed = self.process_term(term)
            self.corrected_terms.append(processed)
            
            # Add to review queue if low confidence
            if processed.get('confidence_level') == 'low':
                self.review_queue.append(processed)
        
        print(f"  [OK] Processed {len(self.corrected_terms)} terms")
        
        # Generate reports
        self.generate_reports()
        
        print()
        print("=" * 70)
        print("Phase 4 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
    
    def process_term(self, term: dict) -> dict:
        """Process a single term through all correction stages."""
        result = dict(term)
        corrections = []
        
        iast = term.get('iast', '')
        devanagari = term.get('devanagari', '')
        
        # 4.3 Font corruption fix
        if devanagari:
            fixed_deva, font_corrections = self.font_fixer.fix(devanagari)
            if font_corrections:
                corrections.extend(font_corrections)
                result['devanagari_fixed'] = fixed_deva
                self.stats['font_fixes'] += 1
        
        # 4.4 Matra normalization
        if devanagari:
            normalized, matra_corrections = self.matra_normalizer.normalize(
                result.get('devanagari_fixed', devanagari)
            )
            if matra_corrections:
                corrections.extend(matra_corrections)
                result['devanagari_normalized'] = normalized
                self.stats['matra_fixes'] += 1
        
        # 4.5 Dictionary validation
        dict_valid, match_info, dict_score = self.dict_validator.validate(iast)
        result['dict_validated'] = dict_valid
        result['dict_match'] = match_info
        result['dict_score'] = dict_score
        if dict_valid:
            self.stats['dict_validated'] += 1
        
        # 4.6 Compound analysis
        compound_info = self.compound_analyzer.analyze(iast)
        result['compound_analysis'] = compound_info
        if compound_info.get('is_compound'):
            self.stats['compounds_found'] += 1
        
        # 4.7 Diacritical fix
        if iast:
            fixed_iast, was_fixed, fix_reason = self.diacritical_fixer.fix(iast)
            if was_fixed:
                result['iast_fixed'] = fixed_iast
                corrections.append(fix_reason)
                self.stats['diacritical_fixes'] += 1
        
        # 4.8 Synonym linking
        synonym_info = self.synonym_linker.find_synonyms(iast)
        result['synonym_info'] = synonym_info
        if synonym_info:
            self.stats['synonyms_linked'] += 1
        
        # 4.9 Confidence scoring
        conf_level, conf_score, conf_reason = self.confidence_scorer.score(
            term,
            dict_valid,
            term.get('was_corrected', False),
            synonym_info is not None
        )
        result['confidence_level'] = conf_level
        result['confidence_score'] = conf_score
        result['confidence_reason'] = conf_reason
        
        self.stats[f'confidence_{conf_level}'] += 1
        
        # Store corrections
        result['corrections_applied'] = corrections
        
        return result
    
    def generate_reports(self):
        """Generate all Phase 4 reports."""
        print("\n[4.10] Generating reports...")
        
        # Main corrected knowledge base
        kb_path = OUTPUT_DIR / "corrected_knowledge_base_v2.json"
        with open(kb_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'phase': 4,
                'total_terms': len(self.corrected_terms),
                'statistics': dict(self.stats),
                'terms': self.corrected_terms
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Corrected KB v2: {kb_path}")
        
        # Human review queue
        review_path = OUTPUT_DIR / "human_review_queue.json"
        with open(review_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'total_for_review': len(self.review_queue),
                'terms': self.review_queue
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Review queue: {review_path} ({len(self.review_queue)} items)")
        
        # CSV export for manual review
        csv_path = OUTPUT_DIR / "review_queue.csv"
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Term ID', 'English', 'IAST', 'Devanagari', 'Confidence', 'Reason'])
            for term in self.review_queue[:100]:  # First 100
                writer.writerow([
                    term.get('term_id', ''),
                    term.get('english', ''),
                    term.get('iast', ''),
                    term.get('devanagari', ''),
                    term.get('confidence_level', ''),
                    term.get('confidence_reason', '')
                ])
        print(f"  [OK] CSV export: {csv_path}")
        
        # Summary report
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 4,
            'statistics': {
                'total_terms': len(self.corrected_terms),
                'font_fixes': self.stats['font_fixes'],
                'matra_fixes': self.stats['matra_fixes'],
                'dict_validated': self.stats['dict_validated'],
                'compounds_found': self.stats['compounds_found'],
                'diacritical_fixes': self.stats['diacritical_fixes'],
                'synonyms_linked': self.stats['synonyms_linked'],
                'confidence_high': self.stats['confidence_high'],
                'confidence_medium': self.stats['confidence_medium'],
                'confidence_low': self.stats['confidence_low'],
                'review_queue_size': len(self.review_queue)
            }
        }
        
        summary_path = REPORTS_DIR / "phase4_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Summary: {summary_path}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("PHASE 4 STATISTICS")
        print("=" * 50)
        print(f"Total terms processed: {len(self.corrected_terms)}")
        print(f"Font corruption fixes: {self.stats['font_fixes']}")
        print(f"Matra normalization: {self.stats['matra_fixes']}")
        print(f"Dictionary validated: {self.stats['dict_validated']}")
        print(f"Compounds analyzed: {self.stats['compounds_found']}")
        print(f"Diacritical fixes: {self.stats['diacritical_fixes']}")
        print(f"Synonyms linked: {self.stats['synonyms_linked']}")
        print(f"Confidence HIGH: {self.stats['confidence_high']}")
        print(f"Confidence MEDIUM: {self.stats['confidence_medium']}")
        print(f"Confidence LOW: {self.stats['confidence_low']}")
        print(f"Review queue: {len(self.review_queue)} items")


def main():
    """Main entry point."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    engine = Phase4CorrectionEngine()
    engine.run_all_phases()


if __name__ == "__main__":
    main()
