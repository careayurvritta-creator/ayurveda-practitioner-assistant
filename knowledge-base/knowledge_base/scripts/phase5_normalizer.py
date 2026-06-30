"""
WHO ITA Knowledge Base - Phase 5: Data Normalization & Standardization
=======================================================================
This script implements all 10 sub-phases of Phase 5 to normalize and
standardize data for AI consumption.

Sub-phases:
5.1  Term ID Standardization
5.2  English Term Normalization
5.3  Description Cleaning
5.4  Sanskrit IAST Normalization
5.5  Devanagari Unicode Normalization
5.6  Hierarchical Category Assignment
5.7  Clinical Domain Tagging
5.8  Cross-Reference Linking
5.9  Abbreviation Expansion
5.10 Final Schema Definition
"""

import json
import re
import unicodedata
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple, Optional

# Configuration
PHASE4_DIR = Path("knowledge_base/phase4_correction_engine")
OUTPUT_DIR = Path("knowledge_base/phase5_normalized")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# 5.1 TERM ID STANDARDIZER
# ============================================================================

class TermIDStandardizer:
    """Standardize ITA Term IDs to consistent format."""
    
    # Pattern: ITA-X.X.X or ITA-X.X.X.X with optional text
    ID_PATTERN = re.compile(r'^(ITA-\d+(?:\.\d+)*)')
    
    def standardize(self, term_id: str) -> Tuple[str, str, bool]:
        """
        Standardize Term ID.
        Returns: (standardized_id, backup_id, was_modified)
        """
        if not term_id:
            return '', '', False
        
        original = term_id.strip()
        
        # Extract ITA code
        match = self.ID_PATTERN.match(original)
        if match:
            standardized = match.group(1)
            # Create backup ID (original without extra text)
            backup = standardized.replace('ITA-', '')
            return standardized, backup, standardized != original
        
        return original, '', False


# ============================================================================
# 5.2 ENGLISH TERM NORMALIZER
# ============================================================================

class EnglishNormalizer:
    """Normalize English term text."""
    
    # Words that should stay lowercase in Title Case
    LOWERCASE_WORDS = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 
                       'to', 'for', 'of', 'with', 'by', 'from', 'as'}
    
    def normalize(self, text: str) -> Tuple[str, List[str]]:
        """
        Normalize English text.
        Returns: (normalized, changes)
        """
        if not text:
            return '', []
        
        changes = []
        result = text.strip()
        
        # Remove leading/trailing whitespace
        if result != text:
            changes.append("Trimmed whitespace")
        
        # Fix multiple spaces
        if '  ' in result:
            result = re.sub(r'\s+', ' ', result)
            changes.append("Fixed multiple spaces")
        
        # Remove trailing punctuation artifacts
        if result.endswith(',') or result.endswith('-'):
            result = result.rstrip(',-')
            changes.append("Removed trailing punctuation")
        
        # Fix hyphen inconsistencies (but preserve legitimate hyphens)
        result = result.replace('–', '-').replace('—', '-')  # En/em dash to hyphen
        
        return result, changes


# ============================================================================
# 5.3 DESCRIPTION CLEANER
# ============================================================================

class DescriptionCleaner:
    """Clean description text from PDF artifacts."""
    
    # PDF artifact patterns
    ARTIFACT_PATTERNS = [
        (r'\d+\s*$', ''),  # Page numbers at end
        (r'^\d+\s*', ''),  # Page numbers at start
        (r'\s{3,}', ' '),  # Excessive whitespace
        (r'\.{3,}', '...'),  # Multiple dots
    ]
    
    # Medical abbreviation expansions
    ABBREVIATIONS = {
        'i.e.': 'that is',
        'e.g.': 'for example',
        'etc.': 'et cetera',
        'cf.': 'compare',
        'viz.': 'namely',
        'vs.': 'versus',
        'approx.': 'approximately',
    }
    
    def clean(self, text: str) -> Tuple[str, List[str]]:
        """
        Clean description text.
        Returns: (cleaned, changes)
        """
        if not text:
            return '', []
        
        changes = []
        result = text.strip()
        
        # Apply pattern fixes
        for pattern, replacement in self.ARTIFACT_PATTERNS:
            if re.search(pattern, result):
                result = re.sub(pattern, replacement, result)
                changes.append(f"Removed pattern: {pattern[:20]}")
        
        # Fix broken sentences (ends with lowercase letter)
        if result and result[-1].islower() and not result.endswith('etc'):
            result += '.'
            changes.append("Added missing period")
        
        return result, changes


# ============================================================================
# 5.4 IAST NORMALIZER
# ============================================================================

class IASTNormalizer:
    """Normalize Sanskrit IAST text."""
    
    # Unicode NFC equivalents for IAST diacritics
    DIACRITIC_MAP = {
        # Combining characters to precomposed
        'a\u0304': 'ā', 'i\u0304': 'ī', 'u\u0304': 'ū',
        'r\u0323': 'ṛ', 'l\u0323': 'ḷ',
        'n\u0307': 'ṅ', 'n\u0303': 'ñ',
        't\u0323': 'ṭ', 'd\u0323': 'ḍ', 'n\u0323': 'ṇ',
        's\u0301': 'ś', 's\u0323': 'ṣ',
        'm\u0323': 'ṃ', 'h\u0323': 'ḥ',
    }
    
    def normalize(self, text: str) -> Tuple[str, List[str]]:
        """
        Normalize IAST text.
        Returns: (normalized, changes)
        """
        if not text:
            return '', []
        
        changes = []
        
        # Apply Unicode NFC normalization
        result = unicodedata.normalize('NFC', text)
        if result != text:
            changes.append("Applied Unicode NFC")
        
        # Remove zero-width characters
        original_len = len(result)
        result = result.replace('\u200b', '').replace('\u200c', '').replace('\u200d', '')
        if len(result) != original_len:
            changes.append("Removed zero-width characters")
        
        # Normalize trailing punctuation
        result = result.strip()
        
        return result, changes


# ============================================================================
# 5.5 DEVANAGARI NORMALIZER
# ============================================================================

class DevanagariNormalizer:
    """Normalize Devanagari Unicode text."""
    
    def normalize(self, text: str) -> Tuple[str, List[str]]:
        """
        Normalize Devanagari text.
        Returns: (normalized, changes)
        """
        if not text:
            return '', []
        
        changes = []
        
        # Apply Unicode NFC normalization
        result = unicodedata.normalize('NFC', text)
        if result != text:
            changes.append("Applied Unicode NFC")
        
        # Remove zero-width characters (except ZWJ/ZWNJ which are valid in Devanagari)
        result = result.replace('\u200b', '')  # Zero-width space only
        
        # Remove duplicate nuktas
        if '़़' in result:
            result = result.replace('़़', '़')
            changes.append("Removed duplicate nuktas")
        
        # Strip whitespace
        result = result.strip()
        
        return result, changes


# ============================================================================
# 5.6 CATEGORY HIERARCHY BUILDER
# ============================================================================

class CategoryHierarchyBuilder:
    """Build hierarchical category assignments."""
    
    # WHO ITA Chapter Names
    CHAPTERS = {
        '1': 'Background Terminology',
        '2': 'Core Concepts (Maulika Siddhanta)',
        '3': 'Anatomy (Rachana Sharira)',
        '4': 'Morbidity Terms (Vikriti Vijnana)',
        '5': 'Disorders (Roga Vijnana)',
        '6': 'Materia Medica (Dravya)',
        '7': 'Pharmaceutical Preparations',
        '8': 'Diet and Lifestyle',
        '9': 'Treatment Modalities (Chikitsa)',
        '10': 'Panchakarma and Rasayana',
    }
    
    def build_hierarchy(self, term_id: str) -> Dict:
        """Build category hierarchy for a term."""
        if not term_id or not term_id.startswith('ITA-'):
            return {'chapter': '', 'section': '', 'subsection': '', 'path': ''}
        
        parts = term_id.replace('ITA-', '').split('.')
        
        chapter = parts[0] if len(parts) > 0 else ''
        section = parts[1] if len(parts) > 1 else ''
        subsection = parts[2] if len(parts) > 2 else ''
        
        chapter_name = self.CHAPTERS.get(chapter, f'Chapter {chapter}')
        
        path = chapter_name
        if section:
            path += f' > Section {section}'
        if subsection:
            path += f' > {subsection}'
        
        return {
            'chapter': chapter,
            'chapter_name': chapter_name,
            'section': section,
            'subsection': subsection,
            'full_path': path
        }


# ============================================================================
# 5.7 CLINICAL DOMAIN TAGGER
# ============================================================================

class ClinicalDomainTagger:
    """Tag terms with clinical domain categories."""
    
    # Domain keywords mapping
    DOMAIN_KEYWORDS = {
        'anatomy': ['aṅga', 'śarīra', 'asthi', 'māṃsa', 'srotas', 'marma', 
                    'koṣṭha', 'dhātu', 'sirā', 'snāyu', 'sandhi'],
        'physiology': ['doṣa', 'vāta', 'pitta', 'kapha', 'agni', 'ojas',
                       'prāṇa', 'dhātu', 'mala', 'srotas'],
        'pathology': ['roga', 'vyādhi', 'vikāra', 'nidāna', 'saṃprāpti',
                      'lakṣaṇa', 'prameha', 'jvara', 'kuṣṭha', 'śotha'],
        'pharmacology': ['dravya', 'auṣadha', 'rasa', 'vīrya', 'vipāka',
                        'guṇa', 'karma', 'prabhāva', 'yoga', 'kalpa'],
        'therapeutics': ['cikitsā', 'śodhana', 'śamana', 'bṛṃhaṇa',
                        'laṅghana', 'pañcakarma', 'vamana', 'virecana'],
        'dietetics': ['āhāra', 'anna', 'pāna', 'pathya', 'apathya',
                     'vihāra', 'nidrā', 'vyāyāma'],
        'diagnostics': ['parīkṣā', 'nāḍī', 'mūtra', 'mala', 'jihvā',
                       'netra', 'sparśa', 'praśna'],
    }
    
    # Chapter-based domain defaults
    CHAPTER_DOMAINS = {
        '1': ['general'],
        '2': ['physiology', 'philosophy'],
        '3': ['anatomy'],
        '4': ['pathology', 'diagnostics'],
        '5': ['pathology'],
        '6': ['pharmacology'],
        '7': ['pharmacology'],
        '8': ['dietetics'],
        '9': ['therapeutics'],
        '10': ['therapeutics'],
    }
    
    def tag(self, term: dict) -> List[str]:
        """Tag term with clinical domains."""
        domains = set()
        
        iast = term.get('iast', '').lower()
        english = term.get('english', '').lower()
        term_id = term.get('term_id', '')
        
        # Check keyword matches
        for domain, keywords in self.DOMAIN_KEYWORDS.items():
            for kw in keywords:
                if kw in iast or kw in english:
                    domains.add(domain)
                    break
        
        # Add chapter-based defaults if no specific domains found
        if not domains and term_id.startswith('ITA-'):
            chapter = term_id.replace('ITA-', '').split('.')[0]
            domains.update(self.CHAPTER_DOMAINS.get(chapter, ['general']))
        
        return sorted(list(domains)) if domains else ['general']


# ============================================================================
# 5.8 CROSS-REFERENCE LINKER
# ============================================================================

class CrossReferenceLinker:
    """Build cross-references between related terms."""
    
    # Relationship patterns
    RELATIONSHIPS = {
        'treats': [
            ('cikitsā', 'roga'), ('cikitsā', 'vyādhi'),
            ('auṣadha', 'roga'), ('yoga', 'vikāra')
        ],
        'causes': [
            ('nidāna', 'roga'), ('hetu', 'vyādhi')
        ],
        'part_of': [
            ('dhātu', 'śarīra'), ('aṅga', 'śarīra'),
            ('srotas', 'śarīra')
        ],
        'type_of': [
            ('vātaroga', 'roga'), ('pittaroga', 'roga'),
            ('kapharoga', 'roga')
        ],
    }
    
    def find_related(self, term: dict, all_terms: List[dict]) -> List[dict]:
        """Find related terms."""
        related = []
        current_iast = term.get('iast', '').lower()
        current_id = term.get('term_id', '')
        
        if not current_iast or not current_id:
            return related
        
        # Find terms in same section
        if current_id.startswith('ITA-'):
            parts = current_id.replace('ITA-', '').split('.')
            if len(parts) >= 2:
                section_prefix = f"ITA-{parts[0]}.{parts[1]}"
                for other in all_terms:
                    other_id = other.get('term_id', '')
                    if other_id != current_id and other_id.startswith(section_prefix):
                        related.append({
                            'term_id': other_id,
                            'relationship': 'same_section'
                        })
                        if len(related) >= 5:
                            break
        
        return related[:5]  # Limit to 5 related terms


# ============================================================================
# 5.9 ABBREVIATION EXPANDER
# ============================================================================

class AbbreviationExpander:
    """Expand abbreviations in text."""
    
    ABBREVIATIONS = {
        'i.e.': 'that is',
        'e.g.': 'for example',
        'etc.': 'et cetera',
        'cf.': 'compare',
        'viz.': 'namely',
        'vs.': 'versus',
        'no.': 'number',
        'nos.': 'numbers',
        'approx.': 'approximately',
        'esp.': 'especially',
        'incl.': 'including',
        'excl.': 'excluding',
        'lit.': 'literally',
        'syn.': 'synonym',
        'pl.': 'plural',
        'sg.': 'singular',
        'masc.': 'masculine',
        'fem.': 'feminine',
        'neut.': 'neuter',
    }
    
    def expand(self, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Expand abbreviations in text.
        Returns: (expanded_text, abbreviations_found)
        """
        if not text:
            return '', {}
        
        found = {}
        result = text
        
        for abbr, expansion in self.ABBREVIATIONS.items():
            if abbr in result.lower():
                # Case-insensitive replacement
                pattern = re.compile(re.escape(abbr), re.IGNORECASE)
                if pattern.search(result):
                    found[abbr] = expansion
                    # Only expand in internal text, not at end
                    result = pattern.sub(f'{abbr} ({expansion})', result)
        
        return result, found


# ============================================================================
# 5.10 JSON SCHEMA DEFINITION
# ============================================================================

ITA_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "WHO ITA Term",
    "type": "object",
    "required": ["term_id", "english"],
    "properties": {
        "term_id": {
            "type": "string",
            "description": "WHO ITA standard term identifier",
            "pattern": "^ITA-\\d+(?:\\.\\d+)*$"
        },
        "backup_id": {
            "type": "string",
            "description": "Numeric backup ID without ITA prefix"
        },
        "english": {
            "type": "string",
            "description": "English term name"
        },
        "description": {
            "type": "string",
            "description": "Full description of the term"
        },
        "iast": {
            "type": "string",
            "description": "Sanskrit term in IAST transliteration"
        },
        "devanagari": {
            "type": "string",
            "description": "Sanskrit term in Devanagari script"
        },
        "category": {
            "type": "object",
            "properties": {
                "chapter": {"type": "string"},
                "chapter_name": {"type": "string"},
                "section": {"type": "string"},
                "subsection": {"type": "string"},
                "full_path": {"type": "string"}
            }
        },
        "domains": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Clinical domain tags"
        },
        "related_terms": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "term_id": {"type": "string"},
                    "relationship": {"type": "string"}
                }
            }
        },
        "confidence": {
            "type": "object",
            "properties": {
                "level": {"type": "string", "enum": ["high", "medium", "low"]},
                "score": {"type": "number"},
                "reason": {"type": "string"}
            }
        },
        "metadata": {
            "type": "object",
            "properties": {
                "source": {"type": "string"},
                "was_corrected": {"type": "boolean"},
                "last_updated": {"type": "string"}
            }
        }
    }
}


# ============================================================================
# MAIN PHASE 5 NORMALIZER
# ============================================================================

class Phase5Normalizer:
    """Main normalizer orchestrating all Phase 5 sub-phases."""
    
    def __init__(self):
        self.term_id_std = TermIDStandardizer()
        self.english_norm = EnglishNormalizer()
        self.desc_cleaner = DescriptionCleaner()
        self.iast_norm = IASTNormalizer()
        self.deva_norm = DevanagariNormalizer()
        self.category_builder = CategoryHierarchyBuilder()
        self.domain_tagger = ClinicalDomainTagger()
        self.xref_linker = CrossReferenceLinker()
        self.abbr_expander = AbbreviationExpander()
        
        self.terms = []
        self.normalized_terms = []
        self.stats = Counter()
    
    def load_data(self):
        """Load enhanced data from Phase 4."""
        print("[LOAD] Loading Phase 4 enhanced knowledge base...")
        kb_path = PHASE4_DIR / "corrected_knowledge_base_v3_enhanced.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run_all_phases(self):
        """Execute all Phase 5 sub-phases."""
        print("=" * 70)
        print("WHO ITA Knowledge Base - Phase 5: Normalization")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        self.load_data()
        
        print("\n[5.1-5.9] Normalizing all terms...")
        
        for term in self.terms:
            normalized = self.normalize_term(term)
            self.normalized_terms.append(normalized)
        
        # 5.8 Cross-reference linking (needs all terms)
        print("[5.8] Building cross-references...")
        for norm_term in self.normalized_terms:
            related = self.xref_linker.find_related(norm_term, self.normalized_terms)
            norm_term['related_terms'] = related
            if related:
                self.stats['cross_refs'] += 1
        
        print(f"  [OK] Normalized {len(self.normalized_terms)} terms")
        
        # Save results
        self.save_results()
        
        print()
        print("=" * 70)
        print("Phase 5 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
    
    def normalize_term(self, term: dict) -> dict:
        """Normalize a single term through all stages."""
        result = {}
        
        # 5.1 Term ID Standardization
        std_id, backup_id, id_changed = self.term_id_std.standardize(term.get('term_id', ''))
        result['term_id'] = std_id
        result['backup_id'] = backup_id
        if id_changed:
            self.stats['term_id_fixed'] += 1
        
        # 5.2 English Normalization
        eng_norm, eng_changes = self.english_norm.normalize(term.get('english', ''))
        result['english'] = eng_norm
        if eng_changes:
            self.stats['english_fixed'] += 1
        
        # 5.3 Description Cleaning
        desc_clean, desc_changes = self.desc_cleaner.clean(term.get('description', ''))
        result['description'] = desc_clean
        if desc_changes:
            self.stats['description_fixed'] += 1
        
        # 5.4 IAST Normalization
        iast_norm, iast_changes = self.iast_norm.normalize(term.get('iast', ''))
        result['iast'] = iast_norm
        if iast_changes:
            self.stats['iast_fixed'] += 1
        
        # 5.5 Devanagari Normalization
        deva_norm, deva_changes = self.deva_norm.normalize(term.get('devanagari', ''))
        result['devanagari'] = deva_norm
        if deva_changes:
            self.stats['deva_fixed'] += 1
        
        # 5.6 Category Hierarchy
        result['category'] = self.category_builder.build_hierarchy(std_id)
        
        # 5.7 Domain Tagging
        result['domains'] = self.domain_tagger.tag(term)
        
        # 5.9 Abbreviation expansion in description
        if result['description']:
            expanded, abbrs = self.abbr_expander.expand(result['description'])
            result['description_expanded'] = expanded
            if abbrs:
                self.stats['abbrs_expanded'] += 1
        
        # Preserve confidence from Phase 4
        result['confidence'] = {
            'level': term.get('confidence_level', 'unknown'),
            'score': term.get('confidence_score', 0),
            'reason': term.get('confidence_reason', '')
        }
        
        # Metadata
        result['metadata'] = {
            'source': 'WHO ITA Standard',
            'was_corrected': term.get('was_corrected', False),
            'last_updated': datetime.now().isoformat()
        }
        
        return result
    
    def save_results(self):
        """Save normalized results."""
        print("\n[5.10] Saving normalized knowledge base...")
        
        # Save normalized KB
        kb_path = OUTPUT_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'phase': 5,
                'schema_version': '1.0',
                'total_terms': len(self.normalized_terms),
                'statistics': dict(self.stats),
                'terms': self.normalized_terms
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Normalized KB: {kb_path}")
        
        # Save schema
        schema_path = OUTPUT_DIR / "ita_schema.json"
        with open(schema_path, 'w', encoding='utf-8') as f:
            json.dump(ITA_SCHEMA, f, indent=2)
        print(f"  [OK] Schema: {schema_path}")
        
        # Save summary
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 5,
            'statistics': {
                'total_terms': len(self.normalized_terms),
                'term_id_standardized': self.stats['term_id_fixed'],
                'english_normalized': self.stats['english_fixed'],
                'description_cleaned': self.stats['description_fixed'],
                'iast_normalized': self.stats['iast_fixed'],
                'devanagari_normalized': self.stats['deva_fixed'],
                'cross_references_built': self.stats['cross_refs'],
                'abbreviations_expanded': self.stats['abbrs_expanded']
            },
            'domain_distribution': self._count_domains(),
            'chapter_distribution': self._count_chapters()
        }
        
        summary_path = REPORTS_DIR / "phase5_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Summary: {summary_path}")
        
        # Print statistics
        print("\n" + "=" * 50)
        print("PHASE 5 STATISTICS")
        print("=" * 50)
        print(f"Total terms normalized: {len(self.normalized_terms)}")
        print(f"Term IDs standardized: {self.stats['term_id_fixed']}")
        print(f"English terms fixed: {self.stats['english_fixed']}")
        print(f"Descriptions cleaned: {self.stats['description_fixed']}")
        print(f"IAST normalized: {self.stats['iast_fixed']}")
        print(f"Devanagari normalized: {self.stats['deva_fixed']}")
        print(f"Cross-references built: {self.stats['cross_refs']}")
        print(f"Abbreviations expanded: {self.stats['abbrs_expanded']}")
    
    def _count_domains(self) -> Dict[str, int]:
        """Count terms per domain."""
        counts = Counter()
        for term in self.normalized_terms:
            for domain in term.get('domains', []):
                counts[domain] += 1
        return dict(counts)
    
    def _count_chapters(self) -> Dict[str, int]:
        """Count terms per chapter."""
        counts = Counter()
        for term in self.normalized_terms:
            chapter = term.get('category', {}).get('chapter', 'unknown')
            counts[chapter] += 1
        return dict(counts)


def main():
    """Main entry point."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    normalizer = Phase5Normalizer()
    normalizer.run_all_phases()


if __name__ == "__main__":
    main()
