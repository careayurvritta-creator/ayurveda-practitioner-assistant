"""
WHO ITA Knowledge Base - Term Verification Report Generator
============================================================
Generates a verification report for manual PDF cross-checking.
"""
import json
import random
from pathlib import Path
from datetime import datetime
from collections import defaultdict

KB_PATH = Path("knowledge_base/phase5_normalized/normalized_knowledge_base.json")
OUTPUT_DIR = Path("knowledge_base/validation_reports")


def load_knowledge_base():
    """Load normalized knowledge base."""
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('terms', [])


def generate_verification_report():
    """Generate verification report for 500 terms."""
    print("=" * 70)
    print("WHO ITA Term Verification Report Generator")
    print("=" * 70)
    print(f"Generated: {datetime.now().isoformat()}")
    
    # Load KB
    terms = load_knowledge_base()
    print(f"\nLoaded {len(terms)} terms from knowledge base")
    
    # Index by term_id
    term_index = {t.get('term_id', ''): t for t in terms if t.get('term_id')}
    
    # Group by chapter
    by_chapter = defaultdict(list)
    for term in terms:
        chapter = term.get('category', {}).get('chapter', 'unknown')
        by_chapter[chapter].append(term)
    
    print(f"Chapters: {sorted(by_chapter.keys())}")
    
    # Select terms for verification
    verification_set = []
    
    # 1. Core foundational terms (Chapter 1)
    core_terms = [
        ("ITA-1.1.1", "Ayurveda - The Science of Life"),
        ("ITA-1.1.2", "Arogya - Health"),
        ("ITA-1.1.3", "Roga - Disease"),
        ("ITA-1.2.1", "Sharira - Body"),
        ("ITA-1.2.2", "Manas - Mind"),
    ]
    
    # 2. Tridosha (Chapter 2)
    dosha_terms = [
        ("ITA-2.1.1", "Dosha"),
        ("ITA-2.1.2", "Vata"),
        ("ITA-2.1.3", "Pitta"),
        ("ITA-2.1.4", "Kapha"),
    ]
    
    # 3. First terms from each chapter
    chapter_firsts = []
    for ch in sorted(by_chapter.keys()):
        if by_chapter[ch]:
            sorted_terms = sorted(by_chapter[ch], key=lambda x: x.get('term_id', ''))
            first_5 = sorted_terms[:5]
            for t in first_5:
                chapter_firsts.append((
                    t.get('term_id'),
                    f"Ch{ch}: {t.get('english', '')}"
                ))
    
    # 4. Random sample from each chapter (for total 500)
    random.seed(42)
    random_sample = []
    per_chapter = 40  # ~40 from each of 10 chapters = 400
    
    for ch in sorted(by_chapter.keys()):
        ch_terms = by_chapter[ch]
        sample_size = min(per_chapter, len(ch_terms))
        sampled = random.sample(ch_terms, sample_size)
        for t in sampled:
            random_sample.append((
                t.get('term_id'),
                t.get('english', ''),
                t.get('iast', ''),
                t.get('devanagari', '')
            ))
    
    # Build verification data
    all_ids = set()
    for term_id, _ in core_terms + dosha_terms:
        all_ids.add(term_id)
    for term_id, _ in chapter_firsts:
        all_ids.add(term_id)
    for term_id, _, _, _ in random_sample:
        all_ids.add(term_id)
    
    # Get details for all
    verification_data = []
    for term_id in sorted(all_ids):
        term = term_index.get(term_id)
        if term:
            verification_data.append({
                'term_id': term_id,
                'english': term.get('english', ''),
                'iast': term.get('iast', ''),
                'devanagari': term.get('devanagari', ''),
                'chapter': term.get('category', {}).get('chapter', ''),
                'chapter_name': term.get('category', {}).get('chapter_name', '')
            })
    
    print(f"\nVerification set: {len(verification_data)} unique terms")
    
    # Statistics
    stats = {
        'total_terms': len(verification_data),
        'with_english': sum(1 for t in verification_data if t['english']),
        'with_iast': sum(1 for t in verification_data if t['iast']),
        'with_devanagari': sum(1 for t in verification_data if t['devanagari']),
        'by_chapter': {}
    }
    
    for t in verification_data:
        ch = t['chapter']
        stats['by_chapter'][ch] = stats['by_chapter'].get(ch, 0) + 1
    
    # Generate report
    report = {
        'generated_at': datetime.now().isoformat(),
        'pdf_source': 'WHO STANDARD AYURVEDA TERMINOLOGIES-eng.pdf',
        'statistics': stats,
        'instructions': [
            'Open the WHO ITA PDF document',
            'Navigate to the chapter indicated for each term',
            'Verify the term_id matches the English, IAST, and Devanagari',
            'Mark any mismatches in the report'
        ],
        'terms': verification_data
    }
    
    # Save JSON report
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = OUTPUT_DIR / "verification_report.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Generate readable text report
    txt_path = OUTPUT_DIR / "verification_report.txt"
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write("WHO ITA KNOWLEDGE BASE VERIFICATION REPORT\n")
        f.write("=" * 60 + "\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"Total Terms: {len(verification_data)}\n")
        f.write(f"PDF Source: WHO STANDARD AYURVEDA TERMINOLOGIES-eng.pdf\n\n")
        
        current_chapter = None
        for t in verification_data:
            if t['chapter'] != current_chapter:
                current_chapter = t['chapter']
                f.write(f"\n{'='*60}\n")
                f.write(f"CHAPTER {current_chapter}: {t['chapter_name']}\n")
                f.write(f"{'='*60}\n\n")
            
            f.write(f"[{t['term_id']}]\n")
            f.write(f"  English:    {t['english']}\n")
            f.write(f"  IAST:       {t['iast']}\n")
            f.write(f"  Devanagari: {t['devanagari']}\n\n")
    
    print(f"\nReports saved:")
    print(f"  JSON: {json_path}")
    print(f"  TXT:  {txt_path}")
    
    # Print sample for immediate verification
    print("\n" + "=" * 60)
    print("SAMPLE TERMS FOR IMMEDIATE VERIFICATION")
    print("=" * 60)
    print("\nThese core terms should match the WHO ITA PDF exactly:\n")
    
    core_ids = ["ITA-1.1.1", "ITA-2.1.1", "ITA-2.1.2", "ITA-2.1.3", "ITA-2.1.4"]
    for term_id in core_ids:
        term = term_index.get(term_id, {})
        print(f"[{term_id}]")
        print(f"  English:    {term.get('english', 'N/A')}")
        print(f"  IAST:       {term.get('iast', 'N/A')}")
        print(f"  Devanagari: {term.get('devanagari', 'N/A')}")
        print()
    
    return report


if __name__ == "__main__":
    generate_verification_report()
