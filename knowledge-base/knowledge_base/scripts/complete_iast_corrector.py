"""
WHO ITA Knowledge Base - Complete IAST to Devanagari Correction
================================================================
This script processes ALL terms from the raw CSV and:
1. Validates IAST against Devanagari for every term
2. Generates corrected Devanagari from IAST using transliteration
3. Creates a corrected knowledge base with all terms
4. Exports detailed before/after comparison for review
"""

import csv
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import Counter

# Configuration
CSV_PATH = Path("Reference Documents/WHO international standard terminologies on ayurveda.csv")
OUTPUT_DIR = Path("knowledge_base/phase2_sanskrit_errors")

# ============================================================================
# IMPROVED IAST TO DEVANAGARI TRANSLITERATION ENGINE
# ============================================================================

class IASTTransliterator:
    """Complete, improved IAST to Devanagari transliteration engine."""
    
    def __init__(self):
        # Vowels (standalone) - sorted by length for greedy matching
        self.vowels = {
            'ai': 'ऐ', 'au': 'औ',  # Diphthongs first
            'ā': 'आ', 'aa': 'आ',
            'ī': 'ई', 'ii': 'ई',
            'ū': 'ऊ', 'uu': 'ऊ',
            'ṝ': 'ॠ', 'ṛṛ': 'ॠ', 'ṛ': 'ऋ', 'r̥': 'ऋ',
            'ḹ': 'ॡ', 'ḷ': 'ऌ', 'l̥': 'ऌ',
            'a': 'अ', 'i': 'इ', 'u': 'उ', 'e': 'ए', 'o': 'ओ',
        }
        
        # Vowel signs (matras) - for after consonants
        self.matras = {
            'ai': 'ै', 'au': 'ौ',
            'ā': 'ा', 'aa': 'ा',
            'ī': 'ी', 'ii': 'ी',
            'ū': 'ू', 'uu': 'ू',
            'ṝ': 'ॄ', 'ṛṛ': 'ॄ', 'ṛ': 'ृ', 'r̥': 'ृ',
            'ḹ': 'ॣ', 'ḷ': 'ॢ', 'l̥': 'ॢ',
            'a': '',  # Inherent vowel
            'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो',
        }
        
        # Consonants - sorted by length for greedy matching
        self.consonants = {
            # Multi-character patterns first
            'kṣ': 'क्ष', 'jñ': 'ज्ञ', 'tr': 'त्र',
            'kh': 'ख', 'gh': 'घ', 'ṅ': 'ङ', 'ng': 'ङ',
            'ch': 'छ', 'jh': 'झ', 'ñ': 'ञ', 'ny': 'ञ',
            'ṭh': 'ठ', 'ḍh': 'ढ', 'ṇ': 'ण',
            'th': 'थ', 'dh': 'ध',
            'ph': 'फ', 'bh': 'भ',
            'ś': 'श', 'sh': 'श', 'ṣ': 'ष', 'ḥ': 'ः',
            # Single character consonants
            'ṭ': 'ट', 'ḍ': 'ड',
            'k': 'क', 'g': 'ग', 'c': 'च', 'j': 'ज',
            't': 'त', 'd': 'द', 'n': 'न',
            'p': 'प', 'b': 'ब', 'm': 'म',
            'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
            's': 'स', 'h': 'ह',
        }
        
        # Special marks
        self.specials = {
            'ṃ': 'ं', 'ṁ': 'ं', 'ṅ': 'ं',  # Anusvara
            'ḥ': 'ः',  # Visarga
            "'": 'ऽ',  # Avagraha
        }
        
        self.virama = '्'
        
        # Sort patterns by length (longest first)
        self.vowel_patterns = sorted(self.vowels.keys(), key=len, reverse=True)
        self.matra_patterns = sorted(self.matras.keys(), key=len, reverse=True)
        self.consonant_patterns = sorted(self.consonants.keys(), key=len, reverse=True)
    
    def transliterate(self, iast: str) -> str:
        """Convert IAST text to Devanagari with proper handling."""
        if not iast:
            return ''
        
        result = []
        i = 0
        text = iast.lower().strip()
        last_was_consonant = False
        
        while i < len(text):
            char = text[i]
            matched = False
            
            # Skip whitespace and punctuation
            if char.isspace() or char in '.,;:-()[]0123456789/\'"':
                if last_was_consonant:
                    # Don't add virama before punctuation - inherent 'a' assumed
                    pass
                result.append(char)
                last_was_consonant = False
                i += 1
                continue
            
            # Check for special marks (anusvara, visarga)
            for pattern, devanagari in self.specials.items():
                if text[i:].startswith(pattern):
                    result.append(devanagari)
                    i += len(pattern)
                    last_was_consonant = False
                    matched = True
                    break
            if matched:
                continue
            
            # Check for consonants
            for pattern in self.consonant_patterns:
                if text[i:].startswith(pattern):
                    # Add virama if previous was consonant (conjunct)
                    if last_was_consonant:
                        result.append(self.virama)
                    
                    result.append(self.consonants[pattern])
                    i += len(pattern)
                    last_was_consonant = True
                    matched = True
                    
                    # Check for following vowel (matra)
                    for vpattern in self.matra_patterns:
                        if text[i:].startswith(vpattern):
                            matra = self.matras[vpattern]
                            if matra:  # 'a' has empty matra (inherent)
                                result.append(matra)
                            i += len(vpattern)
                            last_was_consonant = False
                            break
                    break
            
            if matched:
                continue
            
            # Check for standalone vowels (at word start or after vowel)
            for pattern in self.vowel_patterns:
                if text[i:].startswith(pattern):
                    if last_was_consonant:
                        # Vowel after consonant - use matra form
                        matra = self.matras.get(pattern, '')
                        if matra:
                            result.append(matra)
                        last_was_consonant = False
                    else:
                        # Standalone vowel
                        result.append(self.vowels[pattern])
                    i += len(pattern)
                    matched = True
                    break
            
            if matched:
                continue
            
            # Unknown character - skip
            i += 1
            last_was_consonant = False
        
        return ''.join(result)
    
    def validate_devanagari(self, original: str, generated: str) -> Dict:
        """Compare original and generated Devanagari."""
        if not original or not generated:
            return {'match': False, 'reason': 'empty'}
        
        # Normalize for comparison
        orig_clean = original.strip()
        gen_clean = generated.strip()
        
        if orig_clean == gen_clean:
            return {'match': True, 'reason': 'exact'}
        
        # Check if generated is longer (likely more complete)
        if len(gen_clean) > len(orig_clean):
            return {
                'match': False,
                'reason': 'original_truncated',
                'length_diff': len(gen_clean) - len(orig_clean)
            }
        
        return {'match': False, 'reason': 'different'}


class CompleteIASTCorrector:
    """Process ALL terms from CSV and generate complete corrections."""
    
    def __init__(self):
        self.transliterator = IASTTransliterator()
        self.all_terms = []
        self.corrections = []
        self.stats = {
            'total_rows': 0,
            'rows_with_iast': 0,
            'rows_with_devanagari': 0,
            'matches': 0,
            'mismatches': 0,
            'corrected': 0,
            'improved': 0,
            'no_iast': 0,
            'no_devanagari': 0
        }
    
    def load_csv(self):
        """Load all data from CSV."""
        print("[LOAD] Reading CSV file...")
        
        with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.reader(f)
            for row_num, row in enumerate(reader, 1):
                if row_num <= 426:  # Skip metadata
                    continue
                
                self.stats['total_rows'] += 1
                
                # Extract columns
                term_id = row[0].strip() if len(row) > 0 else ''
                english = row[1].strip() if len(row) > 1 else ''
                description = row[2].strip() if len(row) > 2 else ''
                iast = row[3].strip() if len(row) > 3 else ''
                devanagari = row[4].strip() if len(row) > 4 else ''
                
                # Skip header rows
                if term_id == 'Term ID' or 'English term' in english:
                    continue
                
                # Track stats
                if iast:
                    self.stats['rows_with_iast'] += 1
                if devanagari:
                    self.stats['rows_with_devanagari'] += 1
                
                self.all_terms.append({
                    'row_num': row_num,
                    'term_id': term_id,
                    'english': english,
                    'description': description,
                    'iast': iast,
                    'devanagari': devanagari
                })
        
        print(f"  [OK] Loaded {len(self.all_terms)} terms")
        print(f"  [OK] With IAST: {self.stats['rows_with_iast']}")
        print(f"  [OK] With Devanagari: {self.stats['rows_with_devanagari']}")
    
    def process_all_terms(self):
        """Process every term and generate corrections."""
        print("\n[PROCESS] Analyzing and correcting all terms...")
        
        for term in self.all_terms:
            iast = term['iast']
            original_deva = term['devanagari']
            
            if not iast:
                self.stats['no_iast'] += 1
                continue
            
            if not original_deva:
                self.stats['no_devanagari'] += 1
            
            # Clean IAST for transliteration
            # Handle multiple terms separated by comma
            iast_parts = [p.strip() for p in iast.split(',')]
            generated_parts = []
            
            for part in iast_parts:
                # Remove trailing punctuation
                clean_part = re.sub(r'[.\s]+$', '', part)
                if clean_part:
                    generated = self.transliterator.transliterate(clean_part)
                    if generated:
                        generated_parts.append(generated)
            
            generated_deva = ', '.join(generated_parts) if generated_parts else ''
            
            if not generated_deva:
                continue
            
            # Compare
            validation = self.transliterator.validate_devanagari(original_deva, generated_deva)
            
            if validation['match']:
                self.stats['matches'] += 1
            else:
                self.stats['mismatches'] += 1
                
                # Check if improvement
                is_improved = len(generated_deva) >= len(original_deva) if original_deva else True
                if is_improved:
                    self.stats['improved'] += 1
                
                self.corrections.append({
                    'row': term['row_num'],
                    'term_id': term['term_id'],
                    'english': term['english'],
                    'iast': iast,
                    'original_devanagari': original_deva,
                    'corrected_devanagari': generated_deva,
                    'is_improved': is_improved,
                    'length_change': len(generated_deva) - len(original_deva) if original_deva else len(generated_deva),
                    'validation': validation['reason']
                })
                self.stats['corrected'] += 1
        
        print(f"  [OK] Matches: {self.stats['matches']}")
        print(f"  [OK] Mismatches: {self.stats['mismatches']}")
        print(f"  [OK] Corrected: {self.stats['corrected']}")
        print(f"  [OK] Improved: {self.stats['improved']}")
    
    def create_corrected_knowledge_base(self):
        """Create a complete corrected knowledge base."""
        print("\n[CREATE] Building corrected knowledge base...")
        
        # Build correction lookup
        correction_map = {c['row']: c['corrected_devanagari'] for c in self.corrections}
        
        corrected_kb = []
        for term in self.all_terms:
            row = term['row_num']
            corrected_deva = correction_map.get(row, term['devanagari'])
            
            if term['term_id'] and term['term_id'].startswith('ITA-'):
                corrected_kb.append({
                    'term_id': term['term_id'],
                    'english': term['english'],
                    'description': term['description'],
                    'iast': term['iast'],
                    'devanagari': corrected_deva,
                    'original_devanagari': term['devanagari'],
                    'was_corrected': row in correction_map
                })
        
        print(f"  [OK] Knowledge base entries: {len(corrected_kb)}")
        return corrected_kb
    
    def save_results(self):
        """Save all correction results."""
        print("\n[SAVE] Saving results...")
        
        # 1. Full corrections report
        corrections_report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': self.stats,
            'total_corrections': len(self.corrections),
            'corrections': self.corrections
        }
        
        corrections_path = OUTPUT_DIR / "complete_iast_corrections.json"
        with open(corrections_path, 'w', encoding='utf-8') as f:
            json.dump(corrections_report, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Corrections: {corrections_path}")
        
        # 2. Corrected knowledge base
        corrected_kb = self.create_corrected_knowledge_base()
        kb_path = OUTPUT_DIR / "corrected_knowledge_base.json"
        with open(kb_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'total_terms': len(corrected_kb),
                'corrected_count': self.stats['corrected'],
                'terms': corrected_kb
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Knowledge base: {kb_path}")
        
        # 3. Summary by chapter
        chapter_stats = Counter()
        for c in self.corrections:
            if c['term_id'] and c['term_id'].startswith('ITA-'):
                chapter = c['term_id'].split('.')[0].replace('ITA-', '')
                chapter_stats[chapter] += 1
        
        summary_path = OUTPUT_DIR / "correction_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'statistics': self.stats,
                'by_chapter': dict(chapter_stats),
                'sample_corrections': [
                    {
                        'term_id': c['term_id'],
                        'english': c['english'][:50],
                        'iast': c['iast'],
                        'before': c['original_devanagari'],
                        'after': c['corrected_devanagari']
                    }
                    for c in self.corrections[:100]
                ]
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Summary: {summary_path}")
        
        return corrections_path, kb_path, summary_path


def main():
    print("=" * 70)
    print("Complete IAST to Devanagari Correction")
    print("Processing ALL 1,899+ mismatches")
    print("=" * 70)
    print(f"Started at: {datetime.now().isoformat()}")
    print()
    
    corrector = CompleteIASTCorrector()
    corrector.load_csv()
    corrector.process_all_terms()
    corrector.save_results()
    
    print()
    print("=" * 70)
    print("COMPLETE CORRECTION FINISHED")
    print("=" * 70)
    print(f"Total terms processed: {corrector.stats['total_rows']}")
    print(f"Total corrections: {corrector.stats['corrected']}")
    print(f"Improved: {corrector.stats['improved']} ({corrector.stats['improved']*100//max(1,corrector.stats['corrected'])}%)")
    print()


if __name__ == "__main__":
    main()
