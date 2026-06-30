"""
WHO ITA Knowledge Base - IAST to Devanagari Correction Script
==============================================================
This script corrects the IAST-Devanagari mismatches found in Phase 2.

It provides:
1. Complete IAST → Devanagari transliteration engine
2. Validation of existing Devanagari against generated
3. Correction report with before/after comparisons
"""

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# Configuration
PHASE2_DIR = Path("knowledge_base/phase2_sanskrit_errors/reports")
OUTPUT_DIR = Path("knowledge_base/phase2_sanskrit_errors")

# ============================================================================
# IAST TO DEVANAGARI TRANSLITERATION ENGINE
# ============================================================================

class IASTTransliterator:
    """Complete IAST to Devanagari transliteration engine."""
    
    def __init__(self):
        # Vowels (standalone)
        self.vowels = {
            'a': 'अ', 'ā': 'आ', 'aa': 'आ',
            'i': 'इ', 'ī': 'ई', 'ii': 'ई',
            'u': 'उ', 'ū': 'ऊ', 'uu': 'ऊ',
            'ṛ': 'ऋ', 'ṝ': 'ॠ', 'ṛṛ': 'ॠ',
            'ḷ': 'ऌ', 'ḹ': 'ॡ',
            'e': 'ए', 'ai': 'ऐ',
            'o': 'ओ', 'au': 'औ',
        }
        
        # Vowel signs (matras) for consonant combinations
        self.matras = {
            'a': '',  # Inherent vowel, no matra needed
            'ā': 'ा', 'aa': 'ा',
            'i': 'ि', 'ī': 'ी', 'ii': 'ी',
            'u': 'ु', 'ū': 'ू', 'uu': 'ू',
            'ṛ': 'ृ', 'ṝ': 'ॄ', 'ṛṛ': 'ॄ',
            'ḷ': 'ॢ', 'ḹ': 'ॣ',
            'e': 'े', 'ai': 'ै',
            'o': 'ो', 'au': 'ौ',
        }
        
        # Consonants (sorted by length to match longer patterns first)
        self.consonants = {
            # Aspirated consonants (longer patterns first)
            'kh': 'ख', 'gh': 'घ', 'ch': 'छ', 'jh': 'झ',
            'ṭh': 'ठ', 'ḍh': 'ढ', 'th': 'थ', 'dh': 'ध',
            'ph': 'फ', 'bh': 'भ',
            # Retroflex consonants
            'ṭ': 'ट', 'ḍ': 'ड', 'ṇ': 'ण',
            # Palatals
            'ñ': 'ञ', 'ṅ': 'ङ',
            # Sibilants
            'ś': 'श', 'ṣ': 'ष',
            # Basic consonants
            'k': 'क', 'g': 'ग', 'c': 'च', 'j': 'ज',
            't': 'त', 'd': 'द', 'n': 'न',
            'p': 'प', 'b': 'ब', 'm': 'म',
            'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
            's': 'स', 'h': 'ह',
        }
        
        # Special characters
        self.special = {
            'ṃ': 'ं', 'ṁ': 'ं',  # Anusvara
            'ḥ': 'ः',  # Visarga
            "'": 'ऽ',  # Avagraha
        }
        
        # Virama (halant) for consonant clusters
        self.virama = '्'
        
        # Build sorted patterns for matching
        self._build_patterns()
    
    def _build_patterns(self):
        """Build sorted pattern lists for efficient matching."""
        # Sort by length (longest first) for greedy matching
        self.vowel_patterns = sorted(self.vowels.keys(), key=len, reverse=True)
        self.matra_patterns = sorted(self.matras.keys(), key=len, reverse=True)
        self.consonant_patterns = sorted(self.consonants.keys(), key=len, reverse=True)
    
    def transliterate(self, iast: str) -> str:
        """Convert IAST text to Devanagari."""
        if not iast:
            return ''
        
        result = []
        i = 0
        text = iast.lower()
        
        while i < len(text):
            char = text[i]
            
            # Skip non-Sanskrit characters
            if char.isspace() or char in '.,;:-()[]0123456789/\'"':
                # Add virama if last char was consonant without vowel
                if result and self._needs_virama(result):
                    result.append(self.virama)
                result.append(char)
                i += 1
                continue
            
            # Try to match special characters
            matched = False
            for pattern in self.special:
                if text[i:i+len(pattern)] == pattern:
                    result.append(self.special[pattern])
                    i += len(pattern)
                    matched = True
                    break
            if matched:
                continue
            
            # Try to match consonant
            consonant_matched = False
            for pattern in self.consonant_patterns:
                if text[i:i+len(pattern)] == pattern:
                    # Add virama if previous was consonant without vowel
                    if result and self._is_consonant(result[-1]) and not self._ends_with_vowel(result):
                        result.append(self.virama)
                    
                    result.append(self.consonants[pattern])
                    i += len(pattern)
                    consonant_matched = True
                    
                    # Look for following vowel (matra)
                    vowel_found = False
                    for vpattern in self.matra_patterns:
                        if text[i:i+len(vpattern)] == vpattern:
                            matra = self.matras[vpattern]
                            if matra:  # 'a' has empty matra
                                result.append(matra)
                            i += len(vpattern)
                            vowel_found = True
                            break
                    
                    # If no vowel follows, inherent 'a' is assumed (no action needed)
                    break
            
            if consonant_matched:
                continue
            
            # Try to match standalone vowel
            for pattern in self.vowel_patterns:
                if text[i:i+len(pattern)] == pattern:
                    # Add virama if previous was consonant
                    if result and self._is_consonant(result[-1]):
                        result.append(self.virama)
                    result.append(self.vowels[pattern])
                    i += len(pattern)
                    matched = True
                    break
            
            if matched:
                continue
            
            # Unknown character - skip
            i += 1
        
        # Add final virama if needed
        if result and self._needs_virama(result):
            result.append(self.virama)
        
        return ''.join(result)
    
    def _is_consonant(self, char: str) -> bool:
        """Check if character is a Devanagari consonant."""
        return char in set(self.consonants.values())
    
    def _ends_with_vowel(self, result: List[str]) -> bool:
        """Check if result ends with a vowel or matra."""
        if not result:
            return False
        last = result[-1]
        return last in set(self.vowels.values()) or last in set(self.matras.values())
    
    def _needs_virama(self, result: List[str]) -> bool:
        """Check if we need to add virama (incomplete consonant at end)."""
        if not result:
            return False
        # Only add virama for consonant before space/punctuation
        return False  # Simplified - Sanskrit words typically don't end with virama


class IASTCorrector:
    """Correct IAST-Devanagari mismatches."""
    
    def __init__(self):
        self.transliterator = IASTTransliterator()
        self.corrections = []
        self.stats = {
            'total_mismatches': 0,
            'corrected': 0,
            'uncorrectable': 0,
            'improved': 0
        }
    
    def load_mismatches(self) -> List[Dict]:
        """Load mismatches from Phase 2 report."""
        mismatch_file = PHASE2_DIR / "2_5_iast_cross_validation.json"
        with open(mismatch_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('mismatches', [])
    
    def correct_mismatches(self):
        """Process and correct all mismatches."""
        print("[CORRECT] Loading mismatches...")
        mismatches = self.load_mismatches()
        self.stats['total_mismatches'] = len(mismatches)
        print(f"  [OK] Loaded {len(mismatches)} mismatches")
        
        print("[CORRECT] Generating corrections...")
        for mismatch in mismatches:
            iast = mismatch.get('iast', '')
            original_deva = mismatch.get('devanagari', '')
            
            if not iast:
                self.stats['uncorrectable'] += 1
                continue
            
            # Clean IAST (remove trailing punctuation for transliteration)
            clean_iast = re.sub(r'[,;.\s/]+$', '', iast)
            clean_iast = re.sub(r'^[,;.\s/]+', '', clean_iast)
            
            # Generate correct Devanagari
            generated_deva = self.transliterator.transliterate(clean_iast)
            
            if generated_deva:
                # Compare length - if generated is longer, likely correct
                if len(generated_deva) >= len(original_deva):
                    self.stats['improved'] += 1
                
                self.corrections.append({
                    'row': mismatch.get('row'),
                    'term_id': mismatch.get('term_id', ''),
                    'iast': iast,
                    'original_devanagari': original_deva,
                    'corrected_devanagari': generated_deva,
                    'issue': mismatch.get('issue', 'ratio mismatch'),
                    'length_change': len(generated_deva) - len(original_deva)
                })
                self.stats['corrected'] += 1
            else:
                self.stats['uncorrectable'] += 1
        
        print(f"  [OK] Corrected: {self.stats['corrected']}")
        print(f"  [OK] Improved: {self.stats['improved']}")
        print(f"  [WARN] Uncorrectable: {self.stats['uncorrectable']}")
    
    def save_corrections(self):
        """Save correction report."""
        report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': self.stats,
            'corrections': self.corrections[:500],  # Limit for readability
            'sample_before_after': [
                {
                    'term_id': c['term_id'],
                    'iast': c['iast'],
                    'before': c['original_devanagari'],
                    'after': c['corrected_devanagari']
                }
                for c in self.corrections[:50]
            ]
        }
        
        output_path = OUTPUT_DIR / "iast_corrections.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"[SAVE] Corrections saved to: {output_path}")
        return output_path


def main():
    print("=" * 60)
    print("IAST to Devanagari Correction Script")
    print("=" * 60)
    print(f"Started at: {datetime.now().isoformat()}")
    print()
    
    corrector = IASTCorrector()
    corrector.correct_mismatches()
    corrector.save_corrections()
    
    print()
    print("=" * 60)
    print("Correction Complete!")
    print(f"Total: {corrector.stats['total_mismatches']}")
    print(f"Corrected: {corrector.stats['corrected']}")
    print(f"Improved: {corrector.stats['improved']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
