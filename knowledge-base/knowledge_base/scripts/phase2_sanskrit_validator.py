"""
WHO ITA Knowledge Base - Phase 2: Sanskrit Script Error Detection
==================================================================
This script implements all 10 sub-phases of Phase 2:
2.1  Devanagari Character Validation
2.2  Vowel Sign (Matra) Validation
2.3  Virama (Halant) Chain Analysis
2.4  Anusvara/Chandrabindu Verification
2.5  IAST-to-Devanagari Cross-Validation
2.6  Sandhi Junction Detection
2.7  Consonant Cluster Validation
2.8  Font Corruption Pattern Detection
2.9  Zero-Width Character Detection
2.10 Error Severity Classification
"""

import json
import re
import unicodedata
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Tuple, Optional

# Configuration
PHASE1_DIR = Path("knowledge_base/phase1_extraction/reports")
OUTPUT_DIR = Path("knowledge_base/phase2_sanskrit_errors")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# DEVANAGARI UNICODE CONSTANTS
# ============================================================================

# Devanagari Unicode Block (U+0900 - U+097F)
DEVANAGARI_START = 0x0900
DEVANAGARI_END = 0x097F

# Character Categories
VOWELS = set('अआइईउऊऋॠऌॡएऐओऔ')
CONSONANTS = set('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह')
VOWEL_SIGNS = set('ािीुूृॄॢॣेैोौ')  # Matras
VIRAMA = '्'  # Halant
ANUSVARA = 'ं'
CHANDRABINDU = 'ँ'
VISARGA = 'ः'
NUKTA = '़'
AVAGRAHA = 'ऽ'

# Valid Devanagari characters
VALID_DEVANAGARI = VOWELS | CONSONANTS | VOWEL_SIGNS | {VIRAMA, ANUSVARA, CHANDRABINDU, VISARGA, NUKTA, AVAGRAHA}

# IAST Transliteration Map
IAST_TO_DEVANAGARI = {
    # Vowels
    'a': 'अ', 'A': 'अ',
    'aa': 'आ', 'AA': 'आ', 'ā': 'आ', 'Ā': 'आ',
    'i': 'इ', 'I': 'इ',
    'ii': 'ई', 'II': 'ई', 'ī': 'ई', 'Ī': 'ई',
    'u': 'उ', 'U': 'उ',
    'uu': 'ऊ', 'UU': 'ऊ', 'ū': 'ऊ', 'Ū': 'ऊ',
    'ri': 'ऋ', 'ṛ': 'ऋ', 'Ṛ': 'ऋ', 'r̥': 'ऋ',
    'rii': 'ॠ', 'ṝ': 'ॠ', 'Ṝ': 'ॠ',
    'li': 'ऌ', 'ḷ': 'ऌ', 'Ḷ': 'ऌ', 'l̥': 'ऌ',
    'lii': 'ॡ', 'ḹ': 'ॡ', 'Ḹ': 'ॡ',
    'e': 'ए', 'E': 'ए',
    'ai': 'ऐ', 'AI': 'ऐ',
    'o': 'ओ', 'O': 'ओ',
    'au': 'औ', 'AU': 'औ',
    
    # Consonants
    'k': 'क', 'K': 'क',
    'kh': 'ख', 'Kh': 'ख', 'KH': 'ख',
    'g': 'ग', 'G': 'ग',
    'gh': 'घ', 'Gh': 'घ', 'GH': 'घ',
    'ng': 'ङ', 'ṅ': 'ङ', 'Ṅ': 'ङ',
    'c': 'च', 'C': 'च', 'ch': 'च',
    'chh': 'छ', 'Ch': 'छ', 'CH': 'छ',
    'j': 'ज', 'J': 'ज',
    'jh': 'झ', 'Jh': 'झ', 'JH': 'झ',
    'ny': 'ञ', 'ñ': 'ञ', 'Ñ': 'ञ',
    't': 'त', 'T': 'ट',  # Context dependent
    'ṭ': 'ट', 'Ṭ': 'ट',
    'th': 'थ', 'Th': 'ठ',
    'ṭh': 'ठ', 'Ṭh': 'ठ',
    'd': 'द', 'D': 'ड',
    'ḍ': 'ड', 'Ḍ': 'ड',
    'dh': 'ध', 'Dh': 'ढ',
    'ḍh': 'ढ', 'Ḍh': 'ढ',
    'n': 'न', 'N': 'ण',
    'ṇ': 'ण', 'Ṇ': 'ण',
    'p': 'प', 'P': 'प',
    'ph': 'फ', 'Ph': 'फ', 'PH': 'फ',
    'b': 'ब', 'B': 'ब',
    'bh': 'भ', 'Bh': 'भ', 'BH': 'भ',
    'm': 'म', 'M': 'म',
    'y': 'य', 'Y': 'य',
    'r': 'र', 'R': 'र',
    'l': 'ल', 'L': 'ल',
    'v': 'व', 'V': 'व', 'w': 'व',
    'sh': 'श', 'Sh': 'श', 'SH': 'श', 'ś': 'श', 'Ś': 'श',
    'shh': 'ष', 'ṣ': 'ष', 'Ṣ': 'ष',
    's': 'स', 'S': 'स',
    'h': 'ह', 'H': 'ह',
    
    # Special marks
    'ṃ': 'ं', 'M': 'ं', 'ṁ': 'ं',  # Anusvara
    'ḥ': 'ः', 'H': 'ः',  # Visarga
}

# IAST vowel signs (matras) for consonant combinations
IAST_MATRA_MAP = {
    'a': '',  # Inherent vowel
    'aa': 'ा', 'ā': 'ा',
    'i': 'ि',
    'ii': 'ी', 'ī': 'ी',
    'u': 'ु',
    'uu': 'ू', 'ū': 'ू',
    'ri': 'ृ', 'ṛ': 'ृ',
    'rii': 'ॄ', 'ṝ': 'ॄ',
    'e': 'े',
    'ai': 'ै',
    'o': 'ो',
    'au': 'ौ',
}


class Phase2SanskritValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.raw_data = []
        self.all_ita_codes = []
        self.error_counts = Counter()
        self.correction_candidates = []
        
    def load_phase1_data(self):
        """Load data from Phase 1 extraction."""
        print("[LOAD] Loading Phase 1 data...")
        
        # Load all ITA codes
        with open(PHASE1_DIR / "all_ita_codes.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.all_ita_codes = data.get('codes', [])
        
        # Load raw extraction to get actual terms
        csv_path = Path("Reference Documents/WHO international standard terminologies on ayurveda.csv")
        import csv
        with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            for row_num, row in enumerate(reader, 1):
                if row_num > 426:  # Skip metadata
                    self.raw_data.append({
                        'row_num': row_num,
                        'term_id': row[0].strip() if len(row) > 0 else '',
                        'english': row[1].strip() if len(row) > 1 else '',
                        'description': row[2].strip() if len(row) > 2 else '',
                        'iast': row[3].strip() if len(row) > 3 else '',
                        'devanagari': row[4].strip() if len(row) > 4 else ''
                    })
        
        print(f"  [OK] Loaded {len(self.raw_data)} data rows")
        print(f"  [OK] Loaded {len(self.all_ita_codes)} ITA codes")
        
    def run_all_phases(self):
        """Execute all Phase 2 sub-phases."""
        print("=" * 60)
        print("WHO ITA Knowledge Base - Phase 2: Sanskrit Error Detection")
        print("=" * 60)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        self.load_phase1_data()
        
        self.phase_2_1_devanagari_validation()
        self.phase_2_2_matra_validation()
        self.phase_2_3_virama_analysis()
        self.phase_2_4_anusvara_verification()
        self.phase_2_5_iast_cross_validation()
        self.phase_2_6_sandhi_detection()
        self.phase_2_7_cluster_validation()
        self.phase_2_8_font_corruption()
        self.phase_2_9_zero_width_detection()
        self.phase_2_10_severity_classification()
        
        print()
        print("=" * 60)
        print("Phase 2 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 60)

    # =========================================================================
    # 2.1 DEVANAGARI CHARACTER VALIDATION
    # =========================================================================
    def phase_2_1_devanagari_validation(self):
        """Validate each Devanagari character against Unicode block."""
        print("\n[2.1] Devanagari Character Validation...")
        
        invalid_chars = []
        valid_char_count = 0
        char_frequency = Counter()
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            if not devanagari:
                continue
                
            for i, char in enumerate(devanagari):
                code = ord(char)
                char_frequency[char] += 1
                
                # Check if in Devanagari Unicode range
                if DEVANAGARI_START <= code <= DEVANAGARI_END:
                    valid_char_count += 1
                elif not char.isspace() and char not in '.,;:-()[]':
                    # Flag non-Devanagari, non-punctuation characters
                    invalid_chars.append({
                        'row': row['row_num'],
                        'term_id': row['term_id'],
                        'char': char,
                        'code': hex(code),
                        'position': i,
                        'context': devanagari[max(0,i-3):i+4],
                        'name': unicodedata.name(char, 'UNKNOWN')
                    })
        
        report = {
            'valid_char_count': valid_char_count,
            'invalid_char_count': len(invalid_chars),
            'unique_invalid_chars': len(set(c['char'] for c in invalid_chars)),
            'invalid_chars': invalid_chars[:200],  # Limit output
            'char_frequency_top50': {c: cnt for c, cnt in char_frequency.most_common(50)}
        }
        
        self._save_json('2_1_devanagari_validation.json', report)
        self.error_counts['invalid_devanagari'] = len(invalid_chars)
        
        print(f"  [OK] Valid Devanagari chars: {valid_char_count}")
        print(f"  [WARN] Invalid chars found: {len(invalid_chars)}")

    # =========================================================================
    # 2.2 VOWEL SIGN (MATRA) VALIDATION
    # =========================================================================
    def phase_2_2_matra_validation(self):
        """Verify vowel signs follow consonants properly."""
        print("\n[2.2] Vowel Sign (Matra) Validation...")
        
        orphaned_matras = []
        invalid_sequences = []
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            if not devanagari:
                continue
            
            for i, char in enumerate(devanagari):
                if char in VOWEL_SIGNS:
                    # Matra should follow a consonant or consonant+virama sequence
                    if i == 0:
                        orphaned_matras.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'matra': char,
                            'position': i,
                            'context': devanagari[:min(10, len(devanagari))],
                            'error': 'Matra at start of word'
                        })
                    else:
                        prev_char = devanagari[i-1]
                        # Previous should be consonant or virama
                        if prev_char not in CONSONANTS and prev_char != VIRAMA:
                            # Check if it's a valid sequence (consonant + matra)
                            if prev_char in VOWELS or prev_char in VOWEL_SIGNS:
                                invalid_sequences.append({
                                    'row': row['row_num'],
                                    'term_id': row['term_id'],
                                    'sequence': prev_char + char,
                                    'position': i,
                                    'context': devanagari[max(0,i-3):i+4],
                                    'error': 'Vowel/matra before matra'
                                })
        
        report = {
            'orphaned_matra_count': len(orphaned_matras),
            'invalid_sequence_count': len(invalid_sequences),
            'orphaned_matras': orphaned_matras[:100],
            'invalid_sequences': invalid_sequences[:100]
        }
        
        self._save_json('2_2_matra_validation.json', report)
        self.error_counts['orphaned_matras'] = len(orphaned_matras)
        self.error_counts['invalid_matra_sequences'] = len(invalid_sequences)
        
        print(f"  [WARN] Orphaned matras: {len(orphaned_matras)}")
        print(f"  [WARN] Invalid sequences: {len(invalid_sequences)}")

    # =========================================================================
    # 2.3 VIRAMA (HALANT) CHAIN ANALYSIS
    # =========================================================================
    def phase_2_3_virama_analysis(self):
        """Validate virama usage for conjunct consonants."""
        print("\n[2.3] Virama (Halant) Chain Analysis...")
        
        virama_errors = []
        conjunct_patterns = Counter()
        excessive_viramas = []
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            if not devanagari:
                continue
            
            virama_count = 0
            for i, char in enumerate(devanagari):
                if char == VIRAMA:
                    virama_count += 1
                    
                    # Check what precedes virama
                    if i == 0:
                        virama_errors.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'error': 'Virama at start',
                            'context': devanagari[:10]
                        })
                    elif devanagari[i-1] not in CONSONANTS:
                        virama_errors.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'error': 'Virama after non-consonant',
                            'prev_char': devanagari[i-1],
                            'context': devanagari[max(0,i-3):i+4]
                        })
                    
                    # Check what follows virama (should be consonant for conjunct)
                    if i < len(devanagari) - 1:
                        next_char = devanagari[i+1]
                        if next_char in CONSONANTS:
                            # Valid conjunct
                            conjunct = devanagari[i-1] + VIRAMA + next_char
                            conjunct_patterns[conjunct] += 1
                        elif next_char == VIRAMA:
                            # Double virama - likely error
                            excessive_viramas.append({
                                'row': row['row_num'],
                                'term_id': row['term_id'],
                                'context': devanagari[max(0,i-2):i+4]
                            })
                else:
                    virama_count = 0
        
        report = {
            'virama_error_count': len(virama_errors),
            'excessive_virama_count': len(excessive_viramas),
            'unique_conjuncts': len(conjunct_patterns),
            'top_conjuncts': dict(conjunct_patterns.most_common(50)),
            'virama_errors': virama_errors[:100],
            'excessive_viramas': excessive_viramas[:50]
        }
        
        self._save_json('2_3_virama_analysis.json', report)
        self.error_counts['virama_errors'] = len(virama_errors)
        
        print(f"  [OK] Unique conjuncts found: {len(conjunct_patterns)}")
        print(f"  [WARN] Virama errors: {len(virama_errors)}")
        print(f"  [WARN] Excessive viramas: {len(excessive_viramas)}")

    # =========================================================================
    # 2.4 ANUSVARA/CHANDRABINDU VERIFICATION
    # =========================================================================
    def phase_2_4_anusvara_verification(self):
        """Check anusvara and chandrabindu placement."""
        print("\n[2.4] Anusvara/Chandrabindu Verification...")
        
        anusvara_issues = []
        chandrabindu_issues = []
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            iast = row['iast']
            if not devanagari:
                continue
            
            for i, char in enumerate(devanagari):
                if char == ANUSVARA:
                    # Anusvara should follow vowel or matra
                    if i > 0:
                        prev = devanagari[i-1]
                        if prev not in VOWELS and prev not in VOWEL_SIGNS and prev not in CONSONANTS:
                            anusvara_issues.append({
                                'row': row['row_num'],
                                'term_id': row['term_id'],
                                'prev_char': prev,
                                'context': devanagari[max(0,i-3):i+4],
                                'issue': 'Anusvara after invalid char'
                            })
                    
                    # Cross-check with IAST - should have nasal marker
                    if iast and 'M' not in iast.upper() and 'N' not in iast.upper() and 'ṃ' not in iast and 'ṁ' not in iast:
                        anusvara_issues.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'context': devanagari[max(0,i-3):i+4],
                            'iast': iast,
                            'issue': 'Anusvara without IAST nasal marker'
                        })
                
                elif char == CHANDRABINDU:
                    # Chandrabindu typically over vowels
                    if i > 0:
                        prev = devanagari[i-1]
                        if prev not in VOWELS and prev not in VOWEL_SIGNS:
                            chandrabindu_issues.append({
                                'row': row['row_num'],
                                'term_id': row['term_id'],
                                'prev_char': prev,
                                'context': devanagari[max(0,i-3):i+4]
                            })
        
        report = {
            'anusvara_issue_count': len(anusvara_issues),
            'chandrabindu_issue_count': len(chandrabindu_issues),
            'anusvara_issues': anusvara_issues[:100],
            'chandrabindu_issues': chandrabindu_issues[:50]
        }
        
        self._save_json('2_4_anusvara_verification.json', report)
        self.error_counts['anusvara_issues'] = len(anusvara_issues)
        
        print(f"  [WARN] Anusvara issues: {len(anusvara_issues)}")
        print(f"  [WARN] Chandrabindu issues: {len(chandrabindu_issues)}")

    # =========================================================================
    # 2.5 IAST-TO-DEVANAGARI CROSS-VALIDATION
    # =========================================================================
    def phase_2_5_iast_cross_validation(self):
        """Cross-validate IAST against Devanagari."""
        print("\n[2.5] IAST-to-Devanagari Cross-Validation...")
        
        mismatches = []
        matches = 0
        no_iast = 0
        no_devanagari = 0
        
        for row in self.raw_data:
            iast = row['iast']
            devanagari = row['devanagari']
            
            if not iast and not devanagari:
                continue
            if not iast:
                no_iast += 1
                continue
            if not devanagari:
                no_devanagari += 1
                continue
            
            # Simple validation: check character count correlation
            # Remove diacritics and compare approximate lengths
            iast_clean = re.sub(r'[^a-zA-Z]', '', iast.lower())
            deva_consonants = len([c for c in devanagari if c in CONSONANTS])
            
            # Rough heuristic: IAST consonant letters should roughly match Devanagari
            iast_consonants = len(re.findall(r'[bcdfghjklmnpqrstvwxyz]', iast_clean))
            
            # Check for obvious mismatches (difference > 50%)
            if deva_consonants > 0 and iast_consonants > 0:
                ratio = min(deva_consonants, iast_consonants) / max(deva_consonants, iast_consonants)
                if ratio < 0.5:
                    mismatches.append({
                        'row': row['row_num'],
                        'term_id': row['term_id'],
                        'iast': iast,
                        'devanagari': devanagari,
                        'iast_consonants': iast_consonants,
                        'deva_consonants': deva_consonants,
                        'ratio': round(ratio, 2)
                    })
                else:
                    matches += 1
            
            # Check for specific character mismatches
            # Long vowels in IAST should have corresponding long matras
            if 'ā' in iast or 'ī' in iast or 'ū' in iast:
                if 'ा' not in devanagari and 'ी' not in devanagari and 'ू' not in devanagari and 'आ' not in devanagari and 'ई' not in devanagari and 'ऊ' not in devanagari:
                    mismatches.append({
                        'row': row['row_num'],
                        'term_id': row['term_id'],
                        'iast': iast,
                        'devanagari': devanagari,
                        'issue': 'Long vowel in IAST but not in Devanagari'
                    })
        
        report = {
            'match_count': matches,
            'mismatch_count': len(mismatches),
            'no_iast_count': no_iast,
            'no_devanagari_count': no_devanagari,
            'mismatches': mismatches[:150]
        }
        
        self._save_json('2_5_iast_cross_validation.json', report)
        self.error_counts['iast_mismatches'] = len(mismatches)
        
        print(f"  [OK] Matches: {matches}")
        print(f"  [WARN] Mismatches: {len(mismatches)}")
        print(f"  [INFO] Missing IAST: {no_iast}, Missing Devanagari: {no_devanagari}")

    # =========================================================================
    # 2.6 SANDHI JUNCTION DETECTION
    # =========================================================================
    def phase_2_6_sandhi_detection(self):
        """Identify potential sandhi errors in compound terms."""
        print("\n[2.6] Sandhi Junction Detection...")
        
        potential_sandhi_errors = []
        compound_terms = []
        
        # Common sandhi patterns
        sandhi_patterns = [
            (r'अ\+अ', 'आ'),  # a + a = aa
            (r'इ\+इ', 'ई'),  # i + i = ii
            (r'उ\+उ', 'ऊ'),  # u + u = uu
        ]
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            if not devanagari or len(devanagari) < 5:
                continue
            
            # Look for compound indicators
            if '-' in row['iast'] or ',' in row['iast']:
                compound_terms.append({
                    'row': row['row_num'],
                    'term_id': row['term_id'],
                    'iast': row['iast'],
                    'devanagari': devanagari
                })
            
            # Check for unusual vowel sequences (potential broken sandhi)
            for i in range(len(devanagari) - 1):
                curr = devanagari[i]
                next_char = devanagari[i+1]
                
                # Two vowels in sequence (unusual - might be broken sandhi)
                if curr in VOWELS and next_char in VOWELS:
                    potential_sandhi_errors.append({
                        'row': row['row_num'],
                        'term_id': row['term_id'],
                        'sequence': curr + next_char,
                        'position': i,
                        'context': devanagari[max(0,i-2):i+5],
                        'issue': 'Adjacent vowels - potential sandhi break'
                    })
        
        report = {
            'potential_error_count': len(potential_sandhi_errors),
            'compound_term_count': len(compound_terms),
            'potential_errors': potential_sandhi_errors[:100],
            'compound_terms_sample': compound_terms[:50]
        }
        
        self._save_json('2_6_sandhi_detection.json', report)
        self.error_counts['sandhi_issues'] = len(potential_sandhi_errors)
        
        print(f"  [INFO] Compound terms: {len(compound_terms)}")
        print(f"  [WARN] Potential sandhi issues: {len(potential_sandhi_errors)}")

    # =========================================================================
    # 2.7 CONSONANT CLUSTER VALIDATION
    # =========================================================================
    def phase_2_7_cluster_validation(self):
        """Validate consonant cluster formations."""
        print("\n[2.7] Consonant Cluster Validation...")
        
        cluster_frequency = Counter()
        unusual_clusters = []
        
        # Known valid Sanskrit consonant clusters
        valid_clusters = {
            'क्र', 'क्ष', 'क्त', 'क्व', 'ग्र', 'ग्न', 'घ्न', 'ङ्क', 'ङ्ग',
            'च्च', 'च्छ', 'ज्ञ', 'ज्य', 'ञ्च', 'ञ्ज', 
            'ट्ट', 'ठ्ठ', 'ड्ड', 'ण्ट', 'ण्ड', 'ण्ण',
            'त्त', 'त्र', 'त्य', 'त्व', 'थ्य', 'द्द', 'द्ध', 'द्भ', 'द्म', 'द्य', 'द्र', 'द्व',
            'ध्य', 'ध्व', 'न्त', 'न्द', 'न्ध', 'न्न', 'न्य', 'न्व',
            'प्त', 'प्र', 'प्य', 'ब्द', 'ब्ध', 'ब्र', 'भ्य', 'भ्र', 'म्न', 'म्य', 'म्र',
            'य्य', 'र्क', 'र्ग', 'र्च', 'र्ज', 'र्ण', 'र्त', 'र्द', 'र्ध', 'र्न', 'र्प', 'र्ब', 'र्भ', 'र्म', 'र्य', 'र्व', 'र्श', 'र्ष', 'र्स',
            'ल्ल', 'ल्प', 'व्य', 'व्र',
            'श्च', 'श्र', 'श्व', 'श्य', 'ष्ट', 'ष्ठ', 'ष्ण', 'ष्प', 'ष्य',
            'स्क', 'स्त', 'स्थ', 'स्न', 'स्प', 'स्फ', 'स्म', 'स्य', 'स्र', 'स्व',
            'ह्म', 'ह्य', 'ह्र', 'ह्व', 'ह्न',
        }
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            if not devanagari:
                continue
            
            # Find all consonant clusters (consonant + virama + consonant)
            i = 0
            while i < len(devanagari) - 2:
                if (devanagari[i] in CONSONANTS and 
                    devanagari[i+1] == VIRAMA and 
                    i+2 < len(devanagari) and
                    devanagari[i+2] in CONSONANTS):
                    
                    cluster = devanagari[i:i+3]
                    cluster_frequency[cluster] += 1
                    
                    # Check if unusual
                    if cluster not in valid_clusters:
                        unusual_clusters.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'cluster': cluster,
                            'context': devanagari[max(0,i-2):i+6]
                        })
                i += 1
        
        report = {
            'total_clusters': sum(cluster_frequency.values()),
            'unique_clusters': len(cluster_frequency),
            'unusual_cluster_occurrences': len(unusual_clusters),
            'all_clusters': dict(cluster_frequency.most_common(100)),
            'unusual_clusters': unusual_clusters[:100]
        }
        
        self._save_json('2_7_cluster_validation.json', report)
        self.error_counts['unusual_clusters'] = len(unusual_clusters)
        
        print(f"  [OK] Total clusters: {sum(cluster_frequency.values())}")
        print(f"  [OK] Unique clusters: {len(cluster_frequency)}")
        print(f"  [WARN] Unusual clusters: {len(unusual_clusters)}")

    # =========================================================================
    # 2.8 FONT CORRUPTION PATTERN DETECTION
    # =========================================================================
    def phase_2_8_font_corruption(self):
        """Identify systematic font mapping errors."""
        print("\n[2.8] Font Corruption Pattern Detection...")
        
        corruption_patterns = []
        suspicious_chars = Counter()
        
        # Known PDF corruption patterns
        known_corruptions = {
            '\ufffd': 'REPLACEMENT CHARACTER',
            '\u00a0': 'NON-BREAKING SPACE',
            '\u200b': 'ZERO WIDTH SPACE',
            '\u200c': 'ZERO WIDTH NON-JOINER',
            '\u200d': 'ZERO WIDTH JOINER',
        }
        
        for row in self.raw_data:
            devanagari = row['devanagari']
            iast = row['iast']
            
            # Check Devanagari for corruption
            if devanagari:
                for i, char in enumerate(devanagari):
                    code = ord(char)
                    
                    # Private Use Area (font corruption indicator)
                    if 0xE000 <= code <= 0xF8FF:
                        suspicious_chars[char] += 1
                        corruption_patterns.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'column': 'devanagari',
                            'char': repr(char),
                            'code': hex(code),
                            'type': 'Private Use Area',
                            'context': devanagari[max(0,i-3):i+4]
                        })
                    
                    # Replacement character
                    elif char in known_corruptions:
                        suspicious_chars[char] += 1
                        corruption_patterns.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'column': 'devanagari',
                            'char': repr(char),
                            'code': hex(code),
                            'type': known_corruptions[char],
                            'context': devanagari[max(0,i-3):i+4]
                        })
            
            # Check IAST for corruption
            if iast:
                for i, char in enumerate(iast):
                    code = ord(char)
                    if code > 0x024F and code not in range(0x0300, 0x036F):  # Not combining diacritical
                        if not char.isspace() and char not in '.,;:-()[]':
                            suspicious_chars[char] += 1
        
        report = {
            'corruption_count': len(corruption_patterns),
            'suspicious_char_types': len(suspicious_chars),
            'suspicious_chars': {repr(c): cnt for c, cnt in suspicious_chars.most_common(30)},
            'corruption_patterns': corruption_patterns[:100]
        }
        
        self._save_json('2_8_font_corruption.json', report)
        self.error_counts['font_corruptions'] = len(corruption_patterns)
        
        print(f"  [OK] Corruption patterns found: {len(corruption_patterns)}")
        print(f"  [OK] Suspicious char types: {len(suspicious_chars)}")

    # =========================================================================
    # 2.9 ZERO-WIDTH CHARACTER DETECTION
    # =========================================================================
    def phase_2_9_zero_width_detection(self):
        """Identify zero-width characters."""
        print("\n[2.9] Zero-Width Character Detection...")
        
        zwc_findings = []
        zwc_types = Counter()
        
        zero_width_chars = {
            '\u200b': 'ZERO WIDTH SPACE',
            '\u200c': 'ZERO WIDTH NON-JOINER (ZWNJ)',
            '\u200d': 'ZERO WIDTH JOINER (ZWJ)',
            '\u2060': 'WORD JOINER',
            '\ufeff': 'BYTE ORDER MARK'
        }
        
        for row in self.raw_data:
            for col_name in ['devanagari', 'iast']:
                text = row.get(col_name, '')
                if not text:
                    continue
                
                for i, char in enumerate(text):
                    if char in zero_width_chars:
                        zwc_types[char] += 1
                        zwc_findings.append({
                            'row': row['row_num'],
                            'term_id': row['term_id'],
                            'column': col_name,
                            'char_name': zero_width_chars[char],
                            'position': i,
                            'context_before': text[max(0,i-5):i],
                            'context_after': text[i+1:i+6]
                        })
        
        # Categorize ZWJ/ZWNJ usage (some are valid for rendering)
        valid_zwj = [f for f in zwc_findings if 'ZWJ' in zero_width_chars.get(f.get('char_name', ''), '')]
        spurious_zwc = [f for f in zwc_findings if 'ZWJ' not in zero_width_chars.get(f.get('char_name', ''), '')]
        
        report = {
            'total_zwc_found': len(zwc_findings),
            'zwc_types': {zero_width_chars.get(c, repr(c)): cnt for c, cnt in zwc_types.items()},
            'valid_zwj_count': len(valid_zwj),
            'spurious_zwc_count': len(spurious_zwc),
            'findings': zwc_findings[:100]
        }
        
        self._save_json('2_9_zero_width_detection.json', report)
        self.error_counts['zero_width_chars'] = len(spurious_zwc)
        
        print(f"  [OK] Total ZWC found: {len(zwc_findings)}")
        print(f"  [INFO] Valid ZWJ: {len(valid_zwj)}")
        print(f"  [WARN] Spurious ZWC: {len(spurious_zwc)}")

    # =========================================================================
    # 2.10 ERROR SEVERITY CLASSIFICATION
    # =========================================================================
    def phase_2_10_severity_classification(self):
        """Classify all errors by severity."""
        print("\n[2.10] Error Severity Classification...")
        
        severity_classification = {
            'critical': [],
            'major': [],
            'minor': [],
            'cosmetic': []
        }
        
        # Classify based on error counts
        for error_type, count in self.error_counts.items():
            if error_type in ['font_corruptions', 'invalid_devanagari']:
                severity = 'critical'
            elif error_type in ['iast_mismatches', 'virama_errors']:
                severity = 'major'
            elif error_type in ['orphaned_matras', 'unusual_clusters', 'anusvara_issues']:
                severity = 'minor'
            else:
                severity = 'cosmetic'
            
            severity_classification[severity].append({
                'error_type': error_type,
                'count': count
            })
        
        # Summary statistics
        total_errors = sum(self.error_counts.values())
        critical_count = sum(e['count'] for e in severity_classification['critical'])
        major_count = sum(e['count'] for e in severity_classification['major'])
        minor_count = sum(e['count'] for e in severity_classification['minor'])
        cosmetic_count = sum(e['count'] for e in severity_classification['cosmetic'])
        
        report = {
            'total_errors': total_errors,
            'by_severity': {
                'critical': critical_count,
                'major': major_count,
                'minor': minor_count,
                'cosmetic': cosmetic_count
            },
            'error_breakdown': dict(self.error_counts),
            'classification': severity_classification,
            'quality_score': round(100 - (critical_count * 0.5 + major_count * 0.2 + minor_count * 0.05), 2)
        }
        
        self._save_json('2_10_severity_classification.json', report)
        
        # Also save combined correction queue
        self._save_json('correction_queue.json', {
            'generated_at': datetime.now().isoformat(),
            'total_issues': total_errors,
            'error_counts': dict(self.error_counts)
        })
        
        print(f"  [OK] Total errors classified: {total_errors}")
        print(f"    - Critical: {critical_count}")
        print(f"    - Major: {major_count}")
        print(f"    - Minor: {minor_count}")
        print(f"    - Cosmetic: {cosmetic_count}")
        print(f"  [OK] Quality Score: {report['quality_score']}%")

    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    def _save_json(self, filename: str, data: dict):
        """Save data as JSON to reports directory."""
        filepath = REPORTS_DIR / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


def main():
    """Main entry point."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    validator = Phase2SanskritValidator()
    validator.run_all_phases()
    
    print("\n" + "=" * 60)
    print("All Phase 2 reports saved to:")
    print(f"  {REPORTS_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
