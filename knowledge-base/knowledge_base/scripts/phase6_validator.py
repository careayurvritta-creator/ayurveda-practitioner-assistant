"""
WHO ITA Knowledge Base - Phase 6: Data Validation & Quality Assurance
======================================================================
This script implements all 10 sub-phases of Phase 6 to ensure
zero-error data quality.

Sub-phases:
6.1  Schema Validation
6.2  IAST-Devanagari Parity Check
6.3  Term ID Uniqueness Validation
6.4  Description Completeness Check
6.5  Sanskrit Character Set Validation
6.6  Cross-Reference Integrity
6.7  Category Hierarchy Validation
6.8  Statistical Anomaly Detection
6.9  Expert Review Sampling
6.10 Quality Metrics Dashboard
"""

import json
import re
import random
import unicodedata
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple, Optional

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
OUTPUT_DIR = Path("knowledge_base/phase6_validation")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# 6.1 SCHEMA VALIDATOR
# ============================================================================

class SchemaValidator:
    """Validate terms against JSON schema."""
    
    REQUIRED_FIELDS = ['term_id', 'english']
    EXPECTED_FIELDS = ['term_id', 'backup_id', 'english', 'description', 
                       'iast', 'devanagari', 'category', 'domains',
                       'confidence', 'metadata', 'related_terms']
    
    def validate(self, term: dict) -> Tuple[bool, List[str]]:
        """
        Validate a term against schema.
        Returns: (is_valid, errors)
        """
        errors = []
        
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if field not in term or not term[field]:
                errors.append(f"Missing required field: {field}")
        
        # Check term_id format
        term_id = term.get('term_id', '')
        if term_id and not re.match(r'^ITA-\d+(?:\.\d+)*$', term_id):
            errors.append(f"Invalid term_id format: {term_id}")
        
        # Check type consistency
        if 'domains' in term and not isinstance(term['domains'], list):
            errors.append("domains should be a list")
        
        if 'confidence' in term and not isinstance(term['confidence'], dict):
            errors.append("confidence should be an object")
        
        if 'category' in term and not isinstance(term['category'], dict):
            errors.append("category should be an object")
        
        return len(errors) == 0, errors


# ============================================================================
# 6.2 IAST-DEVANAGARI PARITY CHECKER
# ============================================================================

class IASTDevanagariParityChecker:
    """Check that IAST and Devanagari are in parity."""
    
    def check(self, term: dict) -> Tuple[str, str]:
        """
        Check IAST-Devanagari parity.
        Returns: (status, note)
        """
        iast = term.get('iast', '').strip()
        devanagari = term.get('devanagari', '').strip()
        
        if iast and devanagari:
            return 'complete', 'Both IAST and Devanagari present'
        elif iast and not devanagari:
            return 'iast_only', 'IAST present but Devanagari missing'
        elif devanagari and not iast:
            return 'deva_only', 'Devanagari present but IAST missing'
        else:
            return 'empty', 'Both IAST and Devanagari empty'


# ============================================================================
# 6.3 TERM ID UNIQUENESS VALIDATOR
# ============================================================================

class TermIDUniquenessValidator:
    """Validate Term ID uniqueness and format."""
    
    def validate_all(self, terms: List[dict]) -> Dict:
        """Validate all term IDs for uniqueness."""
        seen_ids = {}
        duplicates = []
        format_errors = []
        all_ids = set()
        
        for term in terms:
            term_id = term.get('term_id', '')
            
            if not term_id:
                format_errors.append({'term': term.get('english', 'unknown'), 'error': 'Empty term_id'})
                continue
            
            # Check for duplicates
            if term_id in seen_ids:
                duplicates.append({
                    'term_id': term_id,
                    'first_english': seen_ids[term_id],
                    'duplicate_english': term.get('english', '')
                })
            else:
                seen_ids[term_id] = term.get('english', '')
            
            # Check format
            if not re.match(r'^ITA-\d+(?:\.\d+)*$', term_id):
                format_errors.append({'term_id': term_id, 'error': 'Invalid format'})
            
            all_ids.add(term_id)
        
        return {
            'total_ids': len(terms),
            'unique_ids': len(seen_ids),
            'duplicates': duplicates,
            'format_errors': format_errors,
            'is_valid': len(duplicates) == 0 and len(format_errors) == 0
        }


# ============================================================================
# 6.4 DESCRIPTION COMPLETENESS CHECKER
# ============================================================================

class DescriptionCompletenessChecker:
    """Check description completeness."""
    
    MIN_DESCRIPTION_LENGTH = 10
    
    def check_all(self, terms: List[dict]) -> Dict:
        """Check all descriptions for completeness."""
        empty = []
        truncated = []
        complete = 0
        
        for term in terms:
            desc = term.get('description', '')
            term_id = term.get('term_id', '')
            
            if not desc or len(desc.strip()) == 0:
                empty.append(term_id)
            elif len(desc) < self.MIN_DESCRIPTION_LENGTH:
                truncated.append({'term_id': term_id, 'length': len(desc)})
            else:
                complete += 1
        
        return {
            'total': len(terms),
            'complete': complete,
            'empty_count': len(empty),
            'truncated_count': len(truncated),
            'empty_sample': empty[:20],
            'truncated_sample': truncated[:20],
            'completeness_rate': round(complete / len(terms) * 100, 2) if terms else 0
        }


# ============================================================================
# 6.5 SANSKRIT CHARACTER SET VALIDATOR
# ============================================================================

class SanskritCharacterValidator:
    """Validate Sanskrit characters are in valid Unicode range."""
    
    # Valid Devanagari Unicode range: 0900-097F
    DEVANAGARI_START = 0x0900
    DEVANAGARI_END = 0x097F
    
    # Extended Devanagari: 0A8E0-0A8FF
    EXT_START = 0xA8E0
    EXT_END = 0xA8FF
    
    # Allowed non-Devanagari characters
    ALLOWED_NON_DEVA = set(' ,.-;:/()[]0123456789')
    
    def validate(self, devanagari: str) -> Tuple[bool, List[str]]:
        """
        Validate Devanagari text.
        Returns: (is_valid, invalid_chars)
        """
        if not devanagari:
            return True, []
        
        invalid_chars = []
        for char in devanagari:
            if char in self.ALLOWED_NON_DEVA:
                continue
            
            code = ord(char)
            is_devanagari = (self.DEVANAGARI_START <= code <= self.DEVANAGARI_END or
                            self.EXT_START <= code <= self.EXT_END)
            
            if not is_devanagari and char.strip():
                invalid_chars.append({
                    'char': char,
                    'code': hex(code),
                    'name': unicodedata.name(char, 'UNKNOWN')
                })
        
        return len(invalid_chars) == 0, invalid_chars
    
    def validate_all(self, terms: List[dict]) -> Dict:
        """Validate all terms."""
        valid_count = 0
        invalid_terms = []
        
        for term in terms:
            deva = term.get('devanagari', '')
            is_valid, invalid_chars = self.validate(deva)
            
            if is_valid:
                valid_count += 1
            else:
                invalid_terms.append({
                    'term_id': term.get('term_id', ''),
                    'devanagari': deva[:50],
                    'invalid_chars': invalid_chars[:5]
                })
        
        return {
            'total': len(terms),
            'valid': valid_count,
            'invalid': len(invalid_terms),
            'invalid_sample': invalid_terms[:20],
            'validity_rate': round(valid_count / len(terms) * 100, 2) if terms else 100
        }


# ============================================================================
# 6.6 CROSS-REFERENCE INTEGRITY CHECKER
# ============================================================================

class CrossReferenceIntegrityChecker:
    """Check cross-reference integrity."""
    
    def check_all(self, terms: List[dict]) -> Dict:
        """Check all cross-references."""
        # Build term ID index
        all_term_ids = {term.get('term_id', '') for term in terms}
        
        total_refs = 0
        valid_refs = 0
        orphaned_refs = []
        
        for term in terms:
            related = term.get('related_terms', [])
            for ref in related:
                ref_id = ref.get('term_id', '')
                total_refs += 1
                
                if ref_id in all_term_ids:
                    valid_refs += 1
                else:
                    orphaned_refs.append({
                        'from_term': term.get('term_id', ''),
                        'to_term': ref_id
                    })
        
        return {
            'total_references': total_refs,
            'valid_references': valid_refs,
            'orphaned_references': len(orphaned_refs),
            'orphaned_sample': orphaned_refs[:20],
            'integrity_rate': round(valid_refs / total_refs * 100, 2) if total_refs else 100
        }


# ============================================================================
# 6.7 CATEGORY HIERARCHY VALIDATOR
# ============================================================================

class CategoryHierarchyValidator:
    """Validate category hierarchy consistency."""
    
    VALID_CHAPTERS = {'1', '2', '3', '4', '5', '6', '7', '8', '9', '10'}
    
    def validate_all(self, terms: List[dict]) -> Dict:
        """Validate all category hierarchies."""
        valid = 0
        missing_category = []
        invalid_chapter = []
        
        for term in terms:
            category = term.get('category', {})
            term_id = term.get('term_id', '')
            
            if not category or not category.get('chapter'):
                missing_category.append(term_id)
                continue
            
            chapter = category.get('chapter', '')
            if chapter not in self.VALID_CHAPTERS:
                invalid_chapter.append({'term_id': term_id, 'chapter': chapter})
                continue
            
            valid += 1
        
        return {
            'total': len(terms),
            'valid': valid,
            'missing_category': len(missing_category),
            'invalid_chapter': len(invalid_chapter),
            'missing_sample': missing_category[:10],
            'invalid_sample': invalid_chapter[:10],
            'validity_rate': round(valid / len(terms) * 100, 2) if terms else 100
        }


# ============================================================================
# 6.8 STATISTICAL ANOMALY DETECTOR
# ============================================================================

class StatisticalAnomalyDetector:
    """Detect statistical anomalies in data."""
    
    def detect(self, terms: List[dict]) -> Dict:
        """Detect anomalies in terms."""
        anomalies = {
            'very_long_english': [],
            'very_short_english': [],
            'very_long_iast': [],
            'unusual_domains': []
        }
        
        # Calculate statistics
        english_lengths = [len(t.get('english', '')) for t in terms if t.get('english')]
        iast_lengths = [len(t.get('iast', '')) for t in terms if t.get('iast')]
        
        avg_english = sum(english_lengths) / len(english_lengths) if english_lengths else 0
        avg_iast = sum(iast_lengths) / len(iast_lengths) if iast_lengths else 0
        
        for term in terms:
            english = term.get('english', '')
            iast = term.get('iast', '')
            term_id = term.get('term_id', '')
            
            # Very long English (>3x average)
            if len(english) > avg_english * 3 and len(english) > 50:
                anomalies['very_long_english'].append({
                    'term_id': term_id,
                    'length': len(english)
                })
            
            # Very short English (<3 chars)
            if english and len(english) < 3:
                anomalies['very_short_english'].append({
                    'term_id': term_id,
                    'english': english
                })
            
            # Very long IAST (>3x average)
            if len(iast) > avg_iast * 3 and len(iast) > 50:
                anomalies['very_long_iast'].append({
                    'term_id': term_id,
                    'length': len(iast)
                })
        
        return {
            'statistics': {
                'avg_english_length': round(avg_english, 2),
                'avg_iast_length': round(avg_iast, 2),
                'total_terms': len(terms)
            },
            'anomalies': {k: {'count': len(v), 'sample': v[:10]} for k, v in anomalies.items()},
            'total_anomalies': sum(len(v) for v in anomalies.values())
        }


# ============================================================================
# 6.9 EXPERT REVIEW SAMPLING
# ============================================================================

class ExpertReviewSampler:
    """Generate random sample for expert review."""
    
    SAMPLE_PERCENTAGE = 5  # 5% of total
    
    def generate_sample(self, terms: List[dict]) -> Dict:
        """Generate expert review sample."""
        sample_size = max(10, int(len(terms) * self.SAMPLE_PERCENTAGE / 100))
        
        # Random sample
        sample = random.sample(terms, min(sample_size, len(terms)))
        
        # Format for review
        review_items = []
        for term in sample:
            review_items.append({
                'term_id': term.get('term_id', ''),
                'english': term.get('english', ''),
                'iast': term.get('iast', ''),
                'devanagari': term.get('devanagari', ''),
                'confidence': term.get('confidence', {}).get('level', ''),
                'review_status': 'pending',
                'reviewer_notes': ''
            })
        
        return {
            'sample_size': len(review_items),
            'sample_percentage': round(len(review_items) / len(terms) * 100, 2),
            'items': review_items
        }


# ============================================================================
# 6.10 QUALITY METRICS DASHBOARD
# ============================================================================

class QualityMetricsDashboard:
    """Generate overall quality metrics."""
    
    def generate(self, validation_results: Dict) -> Dict:
        """Generate quality dashboard."""
        
        # Calculate overall score (weighted average)
        scores = {
            'schema_validity': validation_results.get('schema', {}).get('validity_rate', 0),
            'iast_deva_parity': validation_results.get('parity', {}).get('complete_rate', 0),
            'id_uniqueness': 100 if validation_results.get('uniqueness', {}).get('is_valid', False) else 0,
            'description_completeness': validation_results.get('completeness', {}).get('completeness_rate', 0),
            'character_validity': validation_results.get('characters', {}).get('validity_rate', 0),
            'xref_integrity': validation_results.get('xref', {}).get('integrity_rate', 0),
            'category_validity': validation_results.get('hierarchy', {}).get('validity_rate', 0),
        }
        
        # Weights
        weights = {
            'schema_validity': 0.15,
            'iast_deva_parity': 0.20,
            'id_uniqueness': 0.10,
            'description_completeness': 0.05,
            'character_validity': 0.20,
            'xref_integrity': 0.10,
            'category_validity': 0.20,
        }
        
        overall_score = sum(scores[k] * weights[k] for k in scores)
        
        # Determine grade
        if overall_score >= 95:
            grade = 'A+'
        elif overall_score >= 90:
            grade = 'A'
        elif overall_score >= 85:
            grade = 'B+'
        elif overall_score >= 80:
            grade = 'B'
        elif overall_score >= 70:
            grade = 'C'
        else:
            grade = 'D'
        
        return {
            'overall_score': round(overall_score, 2),
            'grade': grade,
            'component_scores': scores,
            'recommendations': self._generate_recommendations(scores)
        }
    
    def _generate_recommendations(self, scores: Dict) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []
        
        for metric, score in scores.items():
            if score < 90:
                recommendations.append(f"Improve {metric.replace('_', ' ')}: currently {score}%")
        
        if not recommendations:
            recommendations.append("Excellent data quality - ready for production!")
        
        return recommendations


# ============================================================================
# MAIN PHASE 6 VALIDATOR
# ============================================================================

class Phase6Validator:
    """Main validator orchestrating all Phase 6 sub-phases."""
    
    def __init__(self):
        self.schema_validator = SchemaValidator()
        self.parity_checker = IASTDevanagariParityChecker()
        self.id_validator = TermIDUniquenessValidator()
        self.completeness_checker = DescriptionCompletenessChecker()
        self.char_validator = SanskritCharacterValidator()
        self.xref_checker = CrossReferenceIntegrityChecker()
        self.hierarchy_validator = CategoryHierarchyValidator()
        self.anomaly_detector = StatisticalAnomalyDetector()
        self.review_sampler = ExpertReviewSampler()
        self.dashboard = QualityMetricsDashboard()
        
        self.terms = []
        self.results = {}
    
    def load_data(self):
        """Load normalized data from Phase 5."""
        print("[LOAD] Loading Phase 5 normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run_all_validations(self):
        """Execute all Phase 6 validations."""
        print("=" * 70)
        print("WHO ITA Knowledge Base - Phase 6: Validation & QA")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        self.load_data()
        
        # 6.1 Schema Validation
        print("\n[6.1] Schema Validation...")
        schema_results = self._validate_schema()
        self.results['schema'] = schema_results
        print(f"  [OK] Validity rate: {schema_results['validity_rate']}%")
        
        # 6.2 IAST-Devanagari Parity
        print("\n[6.2] IAST-Devanagari Parity Check...")
        parity_results = self._check_parity()
        self.results['parity'] = parity_results
        print(f"  [OK] Complete: {parity_results['complete']} ({parity_results['complete_rate']}%)")
        
        # 6.3 Term ID Uniqueness
        print("\n[6.3] Term ID Uniqueness...")
        uniqueness_results = self.id_validator.validate_all(self.terms)
        self.results['uniqueness'] = uniqueness_results
        print(f"  [OK] Unique IDs: {uniqueness_results['unique_ids']}")
        print(f"  [OK] Duplicates: {len(uniqueness_results['duplicates'])}")
        
        # 6.4 Description Completeness
        print("\n[6.4] Description Completeness...")
        completeness_results = self.completeness_checker.check_all(self.terms)
        self.results['completeness'] = completeness_results
        print(f"  [OK] Completeness rate: {completeness_results['completeness_rate']}%")
        
        # 6.5 Sanskrit Character Validation
        print("\n[6.5] Sanskrit Character Validation...")
        char_results = self.char_validator.validate_all(self.terms)
        self.results['characters'] = char_results
        print(f"  [OK] Validity rate: {char_results['validity_rate']}%")
        
        # 6.6 Cross-Reference Integrity
        print("\n[6.6] Cross-Reference Integrity...")
        xref_results = self.xref_checker.check_all(self.terms)
        self.results['xref'] = xref_results
        print(f"  [OK] Integrity rate: {xref_results['integrity_rate']}%")
        
        # 6.7 Category Hierarchy
        print("\n[6.7] Category Hierarchy Validation...")
        hierarchy_results = self.hierarchy_validator.validate_all(self.terms)
        self.results['hierarchy'] = hierarchy_results
        print(f"  [OK] Validity rate: {hierarchy_results['validity_rate']}%")
        
        # 6.8 Anomaly Detection
        print("\n[6.8] Statistical Anomaly Detection...")
        anomaly_results = self.anomaly_detector.detect(self.terms)
        self.results['anomalies'] = anomaly_results
        print(f"  [OK] Total anomalies: {anomaly_results['total_anomalies']}")
        
        # 6.9 Expert Review Sample
        print("\n[6.9] Expert Review Sampling...")
        sample_results = self.review_sampler.generate_sample(self.terms)
        self.results['expert_sample'] = sample_results
        print(f"  [OK] Sample size: {sample_results['sample_size']} ({sample_results['sample_percentage']}%)")
        
        # 6.10 Quality Dashboard
        print("\n[6.10] Quality Metrics Dashboard...")
        dashboard_results = self.dashboard.generate(self.results)
        self.results['dashboard'] = dashboard_results
        print(f"  [OK] Overall score: {dashboard_results['overall_score']}%")
        print(f"  [OK] Grade: {dashboard_results['grade']}")
        
        # Save results
        self.save_results()
        
        print()
        print("=" * 70)
        print("Phase 6 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
    
    def _validate_schema(self) -> Dict:
        """Validate all terms against schema."""
        valid = 0
        invalid = []
        
        for term in self.terms:
            is_valid, errors = self.schema_validator.validate(term)
            if is_valid:
                valid += 1
            else:
                invalid.append({
                    'term_id': term.get('term_id', ''),
                    'errors': errors
                })
        
        return {
            'total': len(self.terms),
            'valid': valid,
            'invalid': len(invalid),
            'invalid_sample': invalid[:20],
            'validity_rate': round(valid / len(self.terms) * 100, 2) if self.terms else 100
        }
    
    def _check_parity(self) -> Dict:
        """Check IAST-Devanagari parity for all terms."""
        counts = Counter()
        
        for term in self.terms:
            status, _ = self.parity_checker.check(term)
            counts[status] += 1
        
        total = len(self.terms)
        return {
            'total': total,
            'complete': counts['complete'],
            'iast_only': counts['iast_only'],
            'deva_only': counts['deva_only'],
            'empty': counts['empty'],
            'complete_rate': round(counts['complete'] / total * 100, 2) if total else 0
        }
    
    def save_results(self):
        """Save validation results."""
        print("\n[SAVE] Saving validation reports...")
        
        # Save full validation report
        report_path = REPORTS_DIR / "validation_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'phase': 6,
                'results': self.results
            }, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Validation report: {report_path}")
        
        # Save expert review sample as CSV-friendly JSON
        sample_path = REPORTS_DIR / "expert_review_sample.json"
        with open(sample_path, 'w', encoding='utf-8') as f:
            json.dump(self.results['expert_sample'], f, indent=2, ensure_ascii=False)
        print(f"  [OK] Expert sample: {sample_path}")
        
        # Save QA dashboard
        dashboard_path = REPORTS_DIR / "qa_dashboard.json"
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            json.dump(self.results['dashboard'], f, indent=2, ensure_ascii=False)
        print(f"  [OK] QA dashboard: {dashboard_path}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("QUALITY ASSURANCE SUMMARY")
        print("=" * 50)
        dashboard = self.results['dashboard']
        print(f"Overall Score: {dashboard['overall_score']}%")
        print(f"Grade: {dashboard['grade']}")
        print("\nComponent Scores:")
        for metric, score in dashboard['component_scores'].items():
            print(f"  {metric}: {score}%")
        print("\nRecommendations:")
        for rec in dashboard['recommendations']:
            print(f"  - {rec}")


def main():
    """Main entry point."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    random.seed(42)  # For reproducible sampling
    
    validator = Phase6Validator()
    validator.run_all_validations()


if __name__ == "__main__":
    main()
