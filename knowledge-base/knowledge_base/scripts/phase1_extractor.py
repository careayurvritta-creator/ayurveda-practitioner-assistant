"""
WHO ITA Knowledge Base - Phase 1: Data Extraction & Profiling
==============================================================
This script implements all 10 sub-phases of Phase 1:
1.1  Raw Data Extraction
1.2  Column Identification & Mapping
1.3  Header Row Detection
1.4  Chapter/Section Boundary Detection
1.5  Data Type Profiling
1.6  Null/Empty Value Analysis
1.7  Unicode Character Analysis
1.8  Duplicate Detection
1.9  Statistical Summary
1.10 Baseline Snapshot
"""

import csv
import json
import re
import hashlib
import zipfile
import unicodedata
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Any, Tuple

# Configuration
CSV_PATH = Path("Reference Documents/WHO international standard terminologies on ayurveda.csv")
OUTPUT_DIR = Path("knowledge_base/phase1_extraction")
REPORTS_DIR = OUTPUT_DIR / "reports"

# Unicode ranges
DEVANAGARI_RANGE = range(0x0900, 0x097F + 1)
DEVANAGARI_EXTENDED_RANGE = range(0x1CD0, 0x1CFF + 1)

class Phase1Extractor:
    def __init__(self):
        self.raw_data = []
        self.column_schema = {}
        self.section_tree = {}
        self.statistics = {}
        self.errors = []
        
    def run_all_phases(self):
        """Execute all Phase 1 sub-phases sequentially."""
        print("=" * 60)
        print("WHO ITA Knowledge Base - Phase 1: Data Extraction & Profiling")
        print("=" * 60)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        # Execute each sub-phase
        self.phase_1_1_raw_extraction()
        self.phase_1_2_column_identification()
        self.phase_1_3_header_detection()
        self.phase_1_4_section_boundaries()
        self.phase_1_5_data_type_profiling()
        self.phase_1_6_null_analysis()
        self.phase_1_7_unicode_analysis()
        self.phase_1_8_duplicate_detection()
        self.phase_1_9_statistical_summary()
        self.phase_1_10_baseline_snapshot()
        
        print()
        print("=" * 60)
        print("Phase 1 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 60)
        
    # =========================================================================
    # 1.1 RAW DATA EXTRACTION
    # =========================================================================
    def phase_1_1_raw_extraction(self):
        """Extract raw data from CSV with UTF-8 encoding."""
        print("\n[1.1] Raw Data Extraction...")
        
        try:
            with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
                reader = csv.reader(f)
                for row_num, row in enumerate(reader, 1):
                    self.raw_data.append({
                        'row_num': row_num,
                        'columns': row,
                        'col_count': len(row)
                    })
            
            extraction_log = {
                'source_file': str(CSV_PATH),
                'extraction_time': datetime.now().isoformat(),
                'total_rows': len(self.raw_data),
                'encoding': 'utf-8',
                'status': 'SUCCESS'
            }
            
            # Save raw extraction
            self._save_json('raw_extraction_log.json', extraction_log)
            print(f"  [OK] Extracted {len(self.raw_data)} rows")
            
        except Exception as e:
            self.errors.append(f"1.1 Error: {str(e)}")
            print(f"  [ERR] Error: {str(e)}")
    
    # =========================================================================
    # 1.2 COLUMN IDENTIFICATION & MAPPING
    # =========================================================================
    def phase_1_2_column_identification(self):
        """Identify and map all columns in the CSV."""
        print("\n[1.2] Column Identification & Mapping...")
        
        # Find max columns
        max_cols = max(row['col_count'] for row in self.raw_data)
        
        # Analyze column content patterns
        column_samples = defaultdict(list)
        for row in self.raw_data[426:527]:  # Sample from data section
            for i, val in enumerate(row['columns']):
                if val.strip():
                    column_samples[i].append(val[:100])
        
        # Define semantic mapping based on observed patterns
        self.column_schema = {
            'total_columns': max_cols,
            'semantic_mapping': {
                0: {'name': 'term_id', 'description': 'ITA Term ID (e.g., ITA-1.1.1)'},
                1: {'name': 'english_term', 'description': 'English terminology'},
                2: {'name': 'description', 'description': 'Detailed definition/description'},
                3: {'name': 'sanskrit_iast', 'description': 'Sanskrit term in IAST transliteration'},
                4: {'name': 'sanskrit_devanagari', 'description': 'Sanskrit term in Devanagari script'},
                5: {'name': 'extra_col_1', 'description': 'Overflow/merged content'},
            },
            'column_samples': {str(k): v[:5] for k, v in column_samples.items()}
        }
        
        self._save_json('column_schema.json', self.column_schema)
        print(f"  [OK] Identified {max_cols} columns, mapped 6 semantic fields")
    
    # =========================================================================
    # 1.3 HEADER ROW DETECTION
    # =========================================================================
    def phase_1_3_header_detection(self):
        """Identify metadata rows vs data rows."""
        print("\n[1.3] Header Row Detection...")
        
        row_classification = {
            'metadata_rows': [],
            'section_header_rows': [],
            'data_rows': [],
            'empty_rows': [],
            'page_number_rows': []
        }
        
        ita_pattern = re.compile(r'^ITA-\d+\.\d+')
        page_pattern = re.compile(r'^\d+\s*$|^[ivxlcdm]+\s*$', re.IGNORECASE)
        
        for row in self.raw_data:
            first_col = row['columns'][0].strip() if row['columns'] else ''
            all_empty = all(not col.strip() for col in row['columns'])
            
            if all_empty:
                row_classification['empty_rows'].append(row['row_num'])
            elif ita_pattern.match(first_col):
                row_classification['data_rows'].append(row['row_num'])
            elif page_pattern.match(first_col):
                row_classification['page_number_rows'].append(row['row_num'])
            elif row['row_num'] <= 426:
                row_classification['metadata_rows'].append(row['row_num'])
            elif any(kw in first_col.lower() for kw in ['term id', 'english term', 'sanskrit']):
                row_classification['section_header_rows'].append(row['row_num'])
            else:
                # Check if it's a continuation row or section header
                if first_col and not first_col[0].isdigit():
                    if len(first_col) < 50:
                        row_classification['section_header_rows'].append(row['row_num'])
                    else:
                        row_classification['data_rows'].append(row['row_num'])
        
        header_report = {
            'data_start_row': 427,
            'metadata_row_count': len(row_classification['metadata_rows']),
            'data_row_count': len(row_classification['data_rows']),
            'section_header_count': len(row_classification['section_header_rows']),
            'empty_row_count': len(row_classification['empty_rows']),
            'classification': {
                'metadata_range': '1-426',
                'data_range': '427-18111'
            }
        }
        
        self._save_json('header_detection.json', header_report)
        print(f"  [OK] Metadata rows: 1-426, Data rows: 427+")
        print(f"  [OK] Found {len(row_classification['section_header_rows'])} section headers")
    
    # =========================================================================
    # 1.4 CHAPTER/SECTION BOUNDARY DETECTION
    # =========================================================================
    def phase_1_4_section_boundaries(self):
        """Parse ITA codes and build hierarchical section tree."""
        print("\n[1.4] Chapter/Section Boundary Detection...")
        
        ita_pattern = re.compile(r'^ITA-(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?')
        
        chapters = defaultdict(lambda: {'sections': defaultdict(list), 'term_count': 0})
        all_ita_codes = []
        
        for row in self.raw_data:
            first_col = row['columns'][0].strip() if row['columns'] else ''
            match = ita_pattern.match(first_col)
            
            if match:
                chapter = int(match.group(1))
                section = int(match.group(2))
                subsection = match.group(3)
                
                chapters[chapter]['term_count'] += 1
                chapters[chapter]['sections'][section].append({
                    'ita_code': first_col,
                    'row_num': row['row_num'],
                    'subsection': subsection
                })
                all_ita_codes.append(first_col)
        
        # Build section tree
        self.section_tree = {
            'total_chapters': len(chapters),
            'chapters': {}
        }
        
        chapter_names = {
            1: 'Background Concepts',
            2: 'Core Concepts',
            3: 'Structure (Anatomical Terms)',
            4: 'Morbidity & Diagnostic Terms (General)',
            5: 'Morbidity & Diagnostic Terms (Disorders)',
            6: 'Materials',
            7: 'Preparation of Medicines',
            8: 'Preparation of Food',
            9: 'Treatment',
            10: 'Preventive Healthcare'
        }
        
        for ch_num, ch_data in sorted(chapters.items()):
            self.section_tree['chapters'][ch_num] = {
                'name': chapter_names.get(ch_num, f'Chapter {ch_num}'),
                'term_count': ch_data['term_count'],
                'section_count': len(ch_data['sections']),
                'ita_code_prefix': f'ITA-{ch_num}'
            }
        
        self._save_json('section_tree.json', self.section_tree)
        self._save_json('all_ita_codes.json', {'codes': all_ita_codes, 'total': len(all_ita_codes)})
        
        print(f"  [OK] Detected {len(chapters)} chapters")
        for ch_num, ch_info in self.section_tree['chapters'].items():
            print(f"    Chapter {ch_num}: {ch_info['name']} ({ch_info['term_count']} terms)")
    
    # =========================================================================
    # 1.5 DATA TYPE PROFILING
    # =========================================================================
    def phase_1_5_data_type_profiling(self):
        """Profile data types for each column."""
        print("\n[1.5] Data Type Profiling...")
        
        column_profiles = defaultdict(lambda: {
            'types': Counter(),
            'has_devanagari': 0,
            'has_latin': 0,
            'has_numbers': 0,
            'has_special': 0,
            'encoding_issues': 0
        })
        
        for row in self.raw_data[426:]:  # Data rows only
            for col_idx, value in enumerate(row['columns']):
                if not value.strip():
                    column_profiles[col_idx]['types']['empty'] += 1
                    continue
                
                # Check content types
                has_deva = any(0x0900 <= ord(c) <= 0x097F for c in value)
                has_latin = any(c.isalpha() and ord(c) < 128 for c in value)
                has_nums = any(c.isdigit() for c in value)
                has_special = any(not c.isalnum() and not c.isspace() for c in value)
                has_encoding = any(ord(c) > 0xFFFF or c == '\ufffd' for c in value)
                
                if has_deva:
                    column_profiles[col_idx]['has_devanagari'] += 1
                    column_profiles[col_idx]['types']['devanagari'] += 1
                elif has_latin:
                    column_profiles[col_idx]['has_latin'] += 1
                    column_profiles[col_idx]['types']['latin'] += 1
                
                if has_nums:
                    column_profiles[col_idx]['has_numbers'] += 1
                if has_special:
                    column_profiles[col_idx]['has_special'] += 1
                if has_encoding:
                    column_profiles[col_idx]['encoding_issues'] += 1
        
        profile_report = {col: dict(prof) for col, prof in column_profiles.items()}
        for col in profile_report:
            profile_report[col]['types'] = dict(profile_report[col]['types'])
        
        self._save_json('data_type_profile.json', profile_report)
        
        print(f"  [OK] Profiled {len(column_profiles)} columns")
        encoding_issues = sum(p['encoding_issues'] for p in column_profiles.values())
        print(f"  [WARN] Found {encoding_issues} potential encoding issues")
    
    # =========================================================================
    # 1.6 NULL/EMPTY VALUE ANALYSIS
    # =========================================================================
    def phase_1_6_null_analysis(self):
        """Analyze null and empty values across the dataset."""
        print("\n[1.6] Null/Empty Value Analysis...")
        
        null_analysis = defaultdict(lambda: {'null_count': 0, 'total': 0, 'null_rows': []})
        
        for row in self.raw_data[426:]:  # Data rows only
            for col_idx, value in enumerate(row['columns']):
                null_analysis[col_idx]['total'] += 1
                if not value.strip():
                    null_analysis[col_idx]['null_count'] += 1
                    if len(null_analysis[col_idx]['null_rows']) < 100:
                        null_analysis[col_idx]['null_rows'].append(row['row_num'])
        
        null_report = {}
        for col_idx, data in null_analysis.items():
            null_pct = (data['null_count'] / data['total'] * 100) if data['total'] > 0 else 0
            null_report[str(col_idx)] = {
                'null_count': data['null_count'],
                'total_rows': data['total'],
                'null_percentage': round(null_pct, 2),
                'sample_null_rows': data['null_rows'][:20]
            }
        
        self._save_json('null_analysis.json', null_report)
        
        # Summary
        critical_cols = [col for col, data in null_report.items() 
                        if data['null_percentage'] < 90 and data['null_count'] > 0]
        print(f"  [OK] Analyzed {len(null_report)} columns for null values")
        print(f"  [OK] Columns with meaningful data: {len(critical_cols)}")
    
    # =========================================================================
    # 1.7 UNICODE CHARACTER ANALYSIS
    # =========================================================================
    def phase_1_7_unicode_analysis(self):
        """Extract and analyze all unique Unicode characters."""
        print("\n[1.7] Unicode Character Analysis...")
        
        char_counter = Counter()
        devanagari_chars = Counter()
        latin_chars = Counter()
        special_chars = Counter()
        problematic_chars = []
        
        for row in self.raw_data[426:]:
            for value in row['columns']:
                for char in value:
                    char_counter[char] += 1
                    code = ord(char)
                    
                    # Categorize
                    if 0x0900 <= code <= 0x097F:
                        devanagari_chars[char] += 1
                    elif char.isalpha() and code < 128:
                        latin_chars[char] += 1
                    elif not char.isalnum() and not char.isspace():
                        special_chars[char] += 1
                    
                    # Flag problematic
                    if code == 0xFFFD or code > 0xFFFF or (0xE000 <= code <= 0xF8FF):
                        problematic_chars.append({
                            'char': repr(char),
                            'code': hex(code),
                            'row': row['row_num'],
                            'name': unicodedata.name(char, 'UNKNOWN')
                        })
        
        unicode_report = {
            'total_unique_chars': len(char_counter),
            'devanagari_char_count': len(devanagari_chars),
            'latin_char_count': len(latin_chars),
            'special_char_count': len(special_chars),
            'problematic_char_count': len(problematic_chars),
            'devanagari_chars': {c: {'count': cnt, 'name': unicodedata.name(c, 'UNKNOWN')} 
                                 for c, cnt in devanagari_chars.most_common(100)},
            'special_chars': {repr(c): cnt for c, cnt in special_chars.most_common(50)},
            'problematic_chars': problematic_chars[:100]
        }
        
        self._save_json('unicode_analysis.json', unicode_report)
        
        print(f"  [OK] Found {len(char_counter)} unique characters")
        print(f"  [OK] Devanagari characters: {len(devanagari_chars)}")
        print(f"  [WARN] Problematic characters: {len(problematic_chars)}")
    
    # =========================================================================
    # 1.8 DUPLICATE DETECTION
    # =========================================================================
    def phase_1_8_duplicate_detection(self):
        """Detect duplicate Term IDs and terms."""
        print("\n[1.8] Duplicate Detection...")
        
        ita_codes = defaultdict(list)
        english_terms = defaultdict(list)
        sanskrit_terms = defaultdict(list)
        
        ita_pattern = re.compile(r'^ITA-\d+\.\d+')
        
        for row in self.raw_data[426:]:
            cols = row['columns']
            row_num = row['row_num']
            
            # Term ID (column 0)
            if cols and ita_pattern.match(cols[0].strip()):
                ita_codes[cols[0].strip()].append(row_num)
            
            # English term (column 1)
            if len(cols) > 1 and cols[1].strip():
                english_terms[cols[1].strip().lower()].append(row_num)
            
            # Sanskrit IAST (column 3)
            if len(cols) > 3 and cols[3].strip():
                sanskrit_terms[cols[3].strip()].append(row_num)
        
        # Find duplicates
        dup_ita = {k: v for k, v in ita_codes.items() if len(v) > 1}
        dup_english = {k: v for k, v in english_terms.items() if len(v) > 1}
        dup_sanskrit = {k: v for k, v in sanskrit_terms.items() if len(v) > 1}
        
        duplicate_report = {
            'duplicate_ita_codes': {
                'count': len(dup_ita),
                'duplicates': dict(list(dup_ita.items())[:50])
            },
            'duplicate_english_terms': {
                'count': len(dup_english),
                'duplicates': dict(list(dup_english.items())[:50])
            },
            'duplicate_sanskrit_terms': {
                'count': len(dup_sanskrit),
                'duplicates': dict(list(dup_sanskrit.items())[:50])
            },
            'unique_ita_codes': len(ita_codes),
            'unique_english_terms': len(english_terms),
            'unique_sanskrit_terms': len(sanskrit_terms)
        }
        
        self._save_json('duplicate_detection.json', duplicate_report)
        
        print(f"  [OK] Unique ITA codes: {len(ita_codes)}")
        print(f"  [WARN] Duplicate ITA codes: {len(dup_ita)}")
        print(f"  [WARN] Duplicate English terms: {len(dup_english)}")
        print(f"  [WARN] Duplicate Sanskrit terms: {len(dup_sanskrit)}")
    
    # =========================================================================
    # 1.9 STATISTICAL SUMMARY
    # =========================================================================
    def phase_1_9_statistical_summary(self):
        """Generate comprehensive statistical summary."""
        print("\n[1.9] Statistical Summary...")
        
        # Calculate statistics
        description_lengths = []
        terms_per_chapter = defaultdict(int)
        ita_pattern = re.compile(r'^ITA-(\d+)\.')
        
        for row in self.raw_data[426:]:
            cols = row['columns']
            
            # Description length
            if len(cols) > 2 and cols[2].strip():
                description_lengths.append(len(cols[2]))
            
            # Terms per chapter
            if cols and ita_pattern.match(cols[0]):
                match = ita_pattern.match(cols[0])
                if match:
                    terms_per_chapter[int(match.group(1))] += 1
        
        avg_desc_len = sum(description_lengths) / len(description_lengths) if description_lengths else 0
        
        self.statistics = {
            'total_rows': len(self.raw_data),
            'metadata_rows': 426,
            'data_rows': len(self.raw_data) - 426,
            'index_rows': len(self.raw_data) - 15000,  # Approximate index section
            'description_stats': {
                'average_length': round(avg_desc_len, 2),
                'min_length': min(description_lengths) if description_lengths else 0,
                'max_length': max(description_lengths) if description_lengths else 0,
                'total_descriptions': len(description_lengths)
            },
            'terms_per_chapter': dict(terms_per_chapter),
            'extraction_timestamp': datetime.now().isoformat()
        }
        
        self._save_json('statistical_summary.json', self.statistics)
        
        print(f"  [OK] Total rows: {self.statistics['total_rows']}")
        print(f"  [OK] Data rows: {self.statistics['data_rows']}")
        print(f"  [OK] Average description length: {self.statistics['description_stats']['average_length']} chars")
    
    # =========================================================================
    # 1.10 BASELINE SNAPSHOT
    # =========================================================================
    def phase_1_10_baseline_snapshot(self):
        """Create immutable backup with checksums."""
        print("\n[1.10] Baseline Snapshot...")
        
        # Calculate file hash
        with open(CSV_PATH, 'rb') as f:
            file_content = f.read()
            md5_hash = hashlib.md5(file_content).hexdigest()
            sha256_hash = hashlib.sha256(file_content).hexdigest()
        
        # Create snapshot metadata
        snapshot_meta = {
            'source_file': str(CSV_PATH),
            'file_size_bytes': len(file_content),
            'md5': md5_hash,
            'sha256': sha256_hash,
            'snapshot_timestamp': datetime.now().isoformat(),
            'total_rows': len(self.raw_data),
            'phase1_reports': [
                'raw_extraction_log.json',
                'column_schema.json',
                'header_detection.json',
                'section_tree.json',
                'all_ita_codes.json',
                'data_type_profile.json',
                'null_analysis.json',
                'unicode_analysis.json',
                'duplicate_detection.json',
                'statistical_summary.json'
            ]
        }
        
        self._save_json('baseline_snapshot_meta.json', snapshot_meta)
        
        # Create ZIP archive
        zip_path = OUTPUT_DIR / 'baseline_snapshot.zip'
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add original CSV
            zipf.write(CSV_PATH, 'original_who_ita.csv')
            # Add all reports
            for report in snapshot_meta['phase1_reports']:
                report_path = REPORTS_DIR / report
                if report_path.exists():
                    zipf.writestr(f'reports/{report}', report_path.read_text(encoding='utf-8'))
            # Add metadata
            zipf.writestr('snapshot_meta.json', json.dumps(snapshot_meta, indent=2))
        
        print(f"  [OK] MD5: {md5_hash}")
        print(f"  [OK] SHA256: {sha256_hash[:32]}...")
        print(f"  [OK] Baseline snapshot saved to: {zip_path}")
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    def _save_json(self, filename: str, data: Dict):
        """Save data as JSON to reports directory."""
        filepath = REPORTS_DIR / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


def main():
    """Main entry point."""
    # Ensure output directories exist
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Run Phase 1
    extractor = Phase1Extractor()
    extractor.run_all_phases()
    
    print("\n" + "=" * 60)
    print("All Phase 1 reports saved to:")
    print(f"  {REPORTS_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
