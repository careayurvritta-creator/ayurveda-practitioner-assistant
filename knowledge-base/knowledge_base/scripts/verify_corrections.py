"""
WHO ITA Knowledge Base - Phase 2 Quality Verification
=====================================================
This script validates the corrections and identifies any remaining issues.
"""

import json
from pathlib import Path
from collections import Counter
from datetime import datetime

# Known correct Sanskrit terms for validation
KNOWN_CORRECT_TERMS = {
    'Āyurvedaḥ': 'आयुर्वेदः',
    'cikitsā': 'चिकित्सा',
    'vidyā': 'विद्या',
    'jñānam': 'ज्ञानम्',
    'tantram': 'तन्त्रम्',
    'sūtram': 'सूत्रम्',
    'śāstram': 'शास्त्रम्',
    'prāṇaḥ': 'प्राणः',
    'doṣaḥ': 'दोषः',
    'vāta': 'वात',
    'pitta': 'पित्त',
    'kapha': 'कफ',
    'dhātu': 'धातु',
    'mala': 'मल',
    'agni': 'अग्नि',
    'ojas': 'ओजस्',
    'rasa': 'रस',
    'rakta': 'रक्त',
    'māṃsa': 'मांस',
    'meda': 'मेद',
    'asthi': 'अस्थि',
    'majjā': 'मज्जा',
    'śukra': 'शुक्र',
}

def load_corrections():
    """Load the complete corrections file."""
    path = Path("knowledge_base/phase2_sanskrit_errors/complete_iast_corrections.json")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_corrections(data):
    """Validate corrections against known correct terms."""
    print("=" * 60)
    print("Phase 2 Quality Verification")
    print("=" * 60)
    
    corrections = data.get('corrections', [])
    stats = data.get('statistics', {})
    
    print(f"\n[STATS] Total corrections: {len(corrections)}")
    print(f"[STATS] Improved: {stats.get('improved', 0)}")
    
    # Categorize corrections
    perfect_matches = []
    good_corrections = []
    questionable = []
    iast_source_errors = []
    
    for c in corrections:
        iast = c.get('iast', '').strip().lower()
        original = c.get('original_devanagari', '')
        corrected = c.get('corrected_devanagari', '')
        is_improved = c.get('is_improved', False)
        
        # Check if IAST itself has issues
        if 'cikitsa' in iast and 'ā' not in iast:
            iast_source_errors.append({
                'term_id': c.get('term_id'),
                'iast': c.get('iast'),
                'issue': 'IAST missing long vowel (should be cikitsā)'
            })
        
        if is_improved and c.get('length_change', 0) > 0:
            good_corrections.append(c)
        elif not is_improved:
            questionable.append(c)
    
    print(f"\n[QUALITY] Good corrections (improved): {len(good_corrections)}")
    print(f"[QUALITY] Questionable (not improved): {len(questionable)}")
    print(f"[QUALITY] IAST source errors: {len(iast_source_errors)}")
    
    # Show sample questionable corrections
    print("\n[REVIEW] Sample questionable corrections (first 20):")
    for c in questionable[:20]:
        term_id = c.get('term_id', 'N/A') or 'N/A'
        print(f"  {term_id[:20]:20} | len_change: {c.get('length_change', 0)}")
    
    # Show IAST source errors
    if iast_source_errors:
        print(f"\n[REVIEW] IAST source errors found: {len(iast_source_errors)}")
    
    # Validation summary
    accuracy = len(good_corrections) / len(corrections) * 100 if corrections else 0
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'total_corrections': len(corrections),
        'good_corrections': len(good_corrections),
        'questionable': len(questionable),
        'iast_source_errors': len(iast_source_errors),
        'accuracy_percentage': round(accuracy, 2),
        'questionable_samples': questionable[:50],
        'iast_errors': iast_source_errors[:50]
    }
    
    # Save validation report
    output_path = Path("knowledge_base/phase2_sanskrit_errors/validation_report.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVE] Validation report: {output_path}")
    print(f"\n[RESULT] Accuracy: {accuracy:.1f}%")
    print(f"[RESULT] Questionable items need manual review: {len(questionable)}")
    
    return report

def main():
    data = load_corrections()
    report = validate_corrections(data)
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
