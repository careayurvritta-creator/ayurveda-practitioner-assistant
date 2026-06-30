"""
WHO ITA Knowledge Base - Phase 10: Monitoring, Maintenance & Continuous Improvement
=====================================================================================
This script implements all 10 sub-phases of Phase 10 to establish ongoing
processes for knowledge base quality and evolution.

Sub-phases:
10.1  Usage Analytics
10.2  Error Tracking
10.3  User Feedback Loop
10.4  Periodic Re-Validation
10.5  WHO ITA Updates
10.6  Expert Review Cycles
10.7  Version Control
10.8  Backup & Recovery
10.9  Performance Monitoring
10.10 Continuous Improvement
"""

import json
import hashlib
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict
import random

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
OUTPUT_DIR = Path("knowledge_base/phase10_maintenance")
ANALYTICS_DIR = OUTPUT_DIR / "analytics"
DOCS_DIR = OUTPUT_DIR / "docs"
BACKUP_DIR = OUTPUT_DIR / "backups"

# ============================================================================
# 10.1 USAGE ANALYTICS
# ============================================================================

class UsageAnalytics:
    """Analytics system for term lookup tracking."""
    
    def __init__(self):
        self.lookups = defaultdict(int)
        self.searches = []
        self.sessions = defaultdict(list)
    
    def generate_sample_analytics(self, terms: List[dict]) -> Dict:
        """Generate sample analytics data for demonstration."""
        # Simulate lookup frequency
        term_ids = [t.get('term_id', '') for t in terms if t.get('term_id')]
        
        # High-frequency terms (popular)
        popular_terms = random.sample(term_ids, min(50, len(term_ids)))
        for term_id in popular_terms:
            self.lookups[term_id] = random.randint(50, 500)
        
        # Medium-frequency
        medium_terms = random.sample(term_ids, min(200, len(term_ids)))
        for term_id in medium_terms:
            if term_id not in self.lookups:
                self.lookups[term_id] = random.randint(10, 50)
        
        # Low-frequency
        for term_id in term_ids:
            if term_id not in self.lookups:
                self.lookups[term_id] = random.randint(0, 10)
        
        # Analyze patterns
        by_chapter = defaultdict(int)
        for t in terms:
            term_id = t.get('term_id', '')
            chapter = t.get('category', {}).get('chapter', 'unknown')
            by_chapter[chapter] += self.lookups.get(term_id, 0)
        
        return {
            'generated_at': datetime.now().isoformat(),
            'period': 'last_30_days',
            'total_lookups': sum(self.lookups.values()),
            'unique_terms_accessed': len([v for v in self.lookups.values() if v > 0]),
            'top_terms': sorted(
                [(k, v) for k, v in self.lookups.items()],
                key=lambda x: x[1], reverse=True
            )[:20],
            'rarely_used': sorted(
                [(k, v) for k, v in self.lookups.items() if v < 5],
                key=lambda x: x[1]
            )[:20],
            'chapter_distribution': dict(by_chapter),
            'query_patterns': {
                'avg_queries_per_session': 4.7,
                'most_common_search_terms': ['vata', 'pitta', 'kapha', 'dosha', 'rasa']
            }
        }


ANALYTICS_DASHBOARD_HTML = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WHO ITA Knowledge Base Analytics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f5f7fa; }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2.5em; font-weight: bold; color: #3498db; }
        .stat-label { color: #7f8c8d; margin-top: 5px; }
        .chart-container { background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .chart-title { font-size: 1.2em; color: #2c3e50; margin-bottom: 15px; }
        .bar { height: 30px; background: linear-gradient(90deg, #3498db, #2ecc71); margin: 5px 0; border-radius: 5px; display: flex; align-items: center; padding-left: 10px; color: #fff; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; color: #2c3e50; }
        .badge { background: #e74c3c; color: #fff; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; }
        .badge.green { background: #27ae60; }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>WHO ITA Knowledge Base Analytics Dashboard</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalLookups">-</div>
                <div class="stat-label">Total Lookups (30 days)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="uniqueTerms">-</div>
                <div class="stat-label">Unique Terms Accessed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="avgQueries">-</div>
                <div class="stat-label">Avg Queries/Session</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalTerms">-</div>
                <div class="stat-label">Total Terms in KB</div>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Top 10 Most Accessed Terms</div>
            <div id="topTermsChart"></div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Lookup Distribution by Chapter</div>
            <div id="chapterChart"></div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Rarely Used Terms (Candidates for Review)</div>
            <table id="rarelyUsedTable">
                <thead><tr><th>Term ID</th><th>Lookups</th><th>Status</th></tr></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
    
    <script>
        fetch('analytics_data.json')
            .then(r => r.json())
            .then(data => {
                document.getElementById('totalLookups').textContent = data.total_lookups.toLocaleString();
                document.getElementById('uniqueTerms').textContent = data.unique_terms_accessed.toLocaleString();
                document.getElementById('avgQueries').textContent = data.query_patterns.avg_queries_per_session;
                document.getElementById('totalTerms').textContent = '3,547';
                
                // Top terms chart
                const topChart = document.getElementById('topTermsChart');
                const maxLookup = data.top_terms[0][1];
                data.top_terms.slice(0, 10).forEach(([term, count]) => {
                    const width = (count / maxLookup * 100) + '%';
                    topChart.innerHTML += `<div class="bar" style="width:${width}">${term}: ${count}</div>`;
                });
                
                // Chapter chart
                const chapChart = document.getElementById('chapterChart');
                const maxChap = Math.max(...Object.values(data.chapter_distribution));
                Object.entries(data.chapter_distribution).sort((a,b) => b[1]-a[1]).forEach(([ch, count]) => {
                    const width = (count / maxChap * 100) + '%';
                    chapChart.innerHTML += `<div class="bar" style="width:${width}">Chapter ${ch}: ${count}</div>`;
                });
                
                // Rarely used table
                const tbody = document.querySelector('#rarelyUsedTable tbody');
                data.rarely_used.slice(0, 10).forEach(([term, count]) => {
                    const badge = count === 0 ? '<span class="badge">Never Used</span>' : '<span class="badge green">Low Usage</span>';
                    tbody.innerHTML += `<tr><td>${term}</td><td>${count}</td><td>${badge}</td></tr>`;
                });
            });
    </script>
</body>
</html>'''


# ============================================================================
# 10.2 ERROR TRACKING
# ============================================================================

class ErrorTracker:
    """Track AI errors related to terminology."""
    
    def generate_sample_errors(self) -> Dict:
        """Generate sample error tracking data."""
        return {
            'generated_at': datetime.now().isoformat(),
            'period': 'last_30_days',
            'error_categories': {
                'term_not_found': {
                    'count': 47,
                    'examples': ['ITA-99.1.1', 'ITA-5.99.1'],
                    'action': 'Add missing terms or fix typos'
                },
                'incorrect_sanskrit': {
                    'count': 12,
                    'examples': ['ITA-2.3.5: vata -> vaata'],
                    'action': 'Review IAST transliteration'
                },
                'mismatched_translation': {
                    'count': 8,
                    'examples': ['ITA-5.1.3: English mismatch'],
                    'action': 'Verify English translations'
                },
                'invalid_ita_format': {
                    'count': 23,
                    'examples': ['ITA1.1.1', 'ITA-1-1-1'],
                    'action': 'Educate users on correct format'
                }
            },
            'total_errors': 90,
            'error_rate': 0.012,  # 1.2% of requests
            'priority_fixes': [
                {'term_id': 'ITA-5.1.3', 'issue': 'Translation mismatch', 'priority': 'high'},
                {'term_id': 'ITA-2.3.5', 'issue': 'IAST correction needed', 'priority': 'medium'}
            ]
        }


# ============================================================================
# 10.3 USER FEEDBACK LOOP
# ============================================================================

FEEDBACK_SYSTEM = '''// services/itaFeedback.ts

interface TermFeedback {
  term_id: string;
  feedback_type: 'incorrect' | 'missing' | 'suggestion';
  description: string;
  suggested_correction?: string;
  user_id: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'applied' | 'rejected';
}

export class ITAFeedbackService {
  private feedbackQueue: TermFeedback[] = [];

  /**
   * Submit feedback for a term
   */
  async submitFeedback(feedback: Omit<TermFeedback, 'timestamp' | 'status'>): Promise<string> {
    const feedbackEntry: TermFeedback = {
      ...feedback,
      timestamp: new Date(),
      status: 'pending'
    };

    // Store in queue
    this.feedbackQueue.push(feedbackEntry);

    // Send to backend
    try {
      const response = await fetch('/api/v1/ita/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackEntry)
      });
      
      if (!response.ok) throw new Error('Failed to submit feedback');
      
      const result = await response.json();
      return result.feedback_id;
    } catch (error) {
      console.error('Feedback submission failed:', error);
      throw error;
    }
  }

  /**
   * Report incorrect term
   */
  async reportIncorrectTerm(
    termId: string,
    description: string,
    suggestedCorrection?: string
  ): Promise<string> {
    return this.submitFeedback({
      term_id: termId,
      feedback_type: 'incorrect',
      description,
      suggested_correction: suggestedCorrection,
      user_id: this.getCurrentUserId()
    });
  }

  /**
   * Request missing term
   */
  async requestMissingTerm(
    termDescription: string,
    suggestedSanskrit?: string
  ): Promise<string> {
    return this.submitFeedback({
      term_id: 'NEW',
      feedback_type: 'missing',
      description: termDescription,
      suggested_correction: suggestedSanskrit,
      user_id: this.getCurrentUserId()
    });
  }

  private getCurrentUserId(): string {
    // Get from auth context
    return 'current_user_id';
  }
}

export const itaFeedback = new ITAFeedbackService();
'''


# ============================================================================
# 10.4 PERIODIC RE-VALIDATION
# ============================================================================

class RevalidationScheduler:
    """Schedule periodic re-validation."""
    
    def create_schedule(self) -> Dict:
        """Create re-validation schedule."""
        today = datetime.now()
        
        return {
            'schedule_created': today.isoformat(),
            'validation_frequency': 'monthly',
            'upcoming_validations': [
                {
                    'date': (today + timedelta(days=30)).strftime('%Y-%m-%d'),
                    'scope': 'Full knowledge base',
                    'tasks': [
                        'Verify IAST-Devanagari parity',
                        'Check cross-reference integrity',
                        'Update confidence scores',
                        'Validate against latest WHO ITA'
                    ]
                },
                {
                    'date': (today + timedelta(days=60)).strftime('%Y-%m-%d'),
                    'scope': 'Quarterly deep validation',
                    'tasks': [
                        'Expert review of flagged terms',
                        'Re-run Phase 6 validation suite',
                        'Update embeddings if needed'
                    ]
                }
            ],
            'automation': {
                'enabled': True,
                'script': 'phase6_enhanced_validator.py',
                'notify_on_failure': ['admin@ayurvritta.com']
            }
        }


# ============================================================================
# 10.5 WHO ITA UPDATES
# ============================================================================

UPDATE_MONITORING_CONFIG = {
    'sources': [
        {
            'name': 'WHO Traditional Medicine',
            'url': 'https://www.who.int/traditional-complementary-integrative-medicine',
            'check_frequency': 'weekly'
        },
        {
            'name': 'AYUSH Ministry',
            'url': 'https://www.ayush.gov.in',
            'check_frequency': 'monthly'
        }
    ],
    'notification': {
        'channels': ['email', 'slack'],
        'recipients': ['kb-admin@ayurvritta.com']
    },
    'update_process': {
        'steps': [
            'Download updated ITA document',
            'Run comparison with current KB',
            'Identify new/modified/deprecated terms',
            'Queue for expert review',
            'Apply approved changes',
            'Increment version',
            'Regenerate embeddings',
            'Deploy update'
        ]
    }
}


# ============================================================================
# 10.6 EXPERT REVIEW CYCLES
# ============================================================================

EXPERT_REVIEW_CALENDAR = {
    'review_cycle': 'quarterly',
    'reviewers': [
        {'role': 'Sanskrit Scholar', 'focus': 'Transliteration accuracy'},
        {'role': 'Ayurvedic Physician', 'focus': 'Clinical terminology'},
        {'role': 'WHO ITA Expert', 'focus': 'Standard compliance'}
    ],
    'schedule': [
        {'quarter': 'Q1', 'month': 'March', 'focus': 'Chapters 1-3'},
        {'quarter': 'Q2', 'month': 'June', 'focus': 'Chapters 4-6'},
        {'quarter': 'Q3', 'month': 'September', 'focus': 'Chapters 7-8'},
        {'quarter': 'Q4', 'month': 'December', 'focus': 'Chapters 9-10'}
    ],
    'review_protocol': {
        'sample_size': 100,  # terms per chapter
        'validation_criteria': [
            'IAST accuracy',
            'Devanagari correctness',
            'English translation accuracy',
            'Clinical appropriateness'
        ],
        'sign_off_required': True
    }
}


# ============================================================================
# 10.7 VERSION CONTROL
# ============================================================================

class VersionController:
    """Manage knowledge base versions."""
    
    def __init__(self):
        self.current_version = "1.0.0"
    
    def create_version_history(self, terms: List[dict]) -> Dict:
        """Create version history document."""
        # Calculate checksum
        content = json.dumps([t.get('term_id') for t in terms], sort_keys=True)
        checksum = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        return {
            'current_version': self.current_version,
            'version_format': 'MAJOR.MINOR.PATCH',
            'versions': [
                {
                    'version': '1.0.0',
                    'date': datetime.now().isoformat(),
                    'checksum': checksum,
                    'term_count': len(terms),
                    'changes': 'Initial release of WHO ITA Knowledge Base',
                    'author': 'Ayurvritta Team'
                }
            ],
            'changelog': [
                {
                    'version': '1.0.0',
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'changes': [
                        'Initial 3,547 terms from WHO ITA',
                        'Phase 1-10 processing complete',
                        'Knowledge graph with 158,698 edges',
                        'AI training data preparation complete'
                    ]
                }
            ],
            'rollback_procedure': {
                'steps': [
                    'Identify target version',
                    'Verify backup integrity',
                    'Stop active services',
                    'Restore from backup',
                    'Verify restoration',
                    'Restart services',
                    'Notify stakeholders'
                ]
            }
        }


# ============================================================================
# 10.8 BACKUP & RECOVERY
# ============================================================================

class BackupManager:
    """Manage knowledge base backups."""
    
    def create_backup_protocol(self) -> Dict:
        """Create backup protocol documentation."""
        return {
            'backup_schedule': {
                'full_backup': 'weekly',
                'incremental_backup': 'daily',
                'retention_period': '90 days'
            },
            'backup_locations': {
                'primary': '/backups/ita_kb/',
                'offsite': 'cloud-storage://ayurvritta-backups/ita/'
            },
            'backup_contents': [
                'normalized_knowledge_base.json',
                'knowledge_graph.json',
                'embeddings.json',
                'training_data/',
                'version_history.json'
            ],
            'recovery_procedures': {
                'full_restore': {
                    'rto': '4 hours',  # Recovery Time Objective
                    'rpo': '24 hours',  # Recovery Point Objective
                    'steps': [
                        'Identify latest valid backup',
                        'Verify backup integrity (checksum)',
                        'Stop dependent services',
                        'Restore data files',
                        'Rebuild indexes',
                        'Verify data integrity',
                        'Restart services',
                        'Run validation suite'
                    ]
                }
            },
            'testing': {
                'frequency': 'monthly',
                'last_test': datetime.now().strftime('%Y-%m-%d'),
                'next_test': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            }
        }
    
    def create_backup(self, source_dir: Path, backup_dir: Path) -> Dict:
        """Create a backup."""
        backup_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"ita_kb_backup_{timestamp}"
        backup_path = backup_dir / backup_name
        backup_path.mkdir(exist_ok=True)
        
        backed_up_files = []
        for json_file in source_dir.glob('*.json'):
            shutil.copy2(json_file, backup_path / json_file.name)
            backed_up_files.append(json_file.name)
        
        manifest = {
            'backup_id': backup_name,
            'created_at': datetime.now().isoformat(),
            'source': str(source_dir),
            'files': backed_up_files,
            'file_count': len(backed_up_files)
        }
        
        with open(backup_path / 'manifest.json', 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest


# ============================================================================
# 10.9 PERFORMANCE MONITORING
# ============================================================================

PERFORMANCE_MONITORING_CONFIG = {
    'metrics': {
        'lookup_latency': {
            'threshold_ms': 100,
            'alert_if_exceeds': True
        },
        'search_latency': {
            'threshold_ms': 500,
            'alert_if_exceeds': True
        },
        'embedding_quality': {
            'threshold': 0.8,
            'measure': 'cosine_similarity_accuracy'
        },
        'cache_hit_rate': {
            'threshold': 0.7,
            'alert_if_below': True
        }
    },
    'alerting': {
        'channels': ['email', 'pagerduty'],
        'recipients': ['ops@ayurvritta.com'],
        'cooldown_minutes': 30
    },
    'dashboards': {
        'grafana_url': 'https://grafana.ayurvritta.com/d/ita-kb',
        'refresh_interval': '30s'
    },
    'logging': {
        'level': 'INFO',
        'retention_days': 30,
        'structured': True
    }
}


# ============================================================================
# 10.10 CONTINUOUS IMPROVEMENT
# ============================================================================

IMPROVEMENT_ROADMAP = {
    'roadmap_version': '1.0',
    'created_at': datetime.now().isoformat(),
    'quarters': [
        {
            'quarter': 'Q1 2026',
            'focus': 'Foundation Stabilization',
            'initiatives': [
                'Complete Phase 1-10 implementation',
                'Establish monitoring baselines',
                'Train support team on KB usage'
            ]
        },
        {
            'quarter': 'Q2 2026',
            'focus': 'Quality Enhancement',
            'initiatives': [
                'Address top 50 user-reported issues',
                'Add 500+ new compound terms',
                'Improve embedding accuracy by 10%'
            ]
        },
        {
            'quarter': 'Q3 2026',
            'focus': 'Feature Expansion',
            'initiatives': [
                'Add clinical pathway recommendations',
                'Integrate with EMR systems',
                'Launch Sanskrit pronunciation audio'
            ]
        },
        {
            'quarter': 'Q4 2026',
            'focus': 'AI Enhancement',
            'initiatives': [
                'Fine-tune Gemini with ITA data',
                'Add multi-modal support',
                'Publish research paper'
            ]
        }
    ],
    'kpis': [
        {'name': 'Term Accuracy', 'target': '99.5%', 'current': '96.72%'},
        {'name': 'User Satisfaction', 'target': '4.5/5', 'current': 'TBD'},
        {'name': 'Lookup Success Rate', 'target': '99%', 'current': 'TBD'},
        {'name': 'AI Response Accuracy', 'target': '95%', 'current': 'TBD'}
    ]
}


# ============================================================================
# MAIN ENGINE
# ============================================================================

class Phase10MaintenanceEngine:
    """Main engine for Phase 10 maintenance setup."""
    
    def __init__(self):
        self.terms = []
    
    def load_data(self):
        """Load data from Phase 5."""
        print("[LOAD] Loading normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run(self):
        """Run all Phase 10 sub-phases."""
        print("=" * 70)
        print("Phase 10: Monitoring, Maintenance & Continuous Improvement")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        self.load_data()
        
        # 10.1 Usage Analytics
        print("\n[10.1] Setting up Usage Analytics...")
        analytics = UsageAnalytics()
        analytics_data = analytics.generate_sample_analytics(self.terms)
        analytics_path = ANALYTICS_DIR / "analytics_data.json"
        with open(analytics_path, 'w', encoding='utf-8') as f:
            json.dump(analytics_data, f, indent=2)
        
        dashboard_path = ANALYTICS_DIR / "dashboard.html"
        with open(dashboard_path, 'w', encoding='utf-8') as f:
            f.write(ANALYTICS_DASHBOARD_HTML)
        print(f"  [OK] Analytics: {analytics_data['total_lookups']} sample lookups")
        print(f"  [OK] Dashboard: {dashboard_path}")
        
        # 10.2 Error Tracking
        print("\n[10.2] Setting up Error Tracking...")
        tracker = ErrorTracker()
        errors = tracker.generate_sample_errors()
        error_path = ANALYTICS_DIR / "error_tracking.json"
        with open(error_path, 'w', encoding='utf-8') as f:
            json.dump(errors, f, indent=2)
        print(f"  [OK] Error tracking: {errors['total_errors']} sample errors")
        
        # 10.3 User Feedback System
        print("\n[10.3] Setting up User Feedback System...")
        feedback_path = OUTPUT_DIR / "itaFeedback.ts"
        with open(feedback_path, 'w', encoding='utf-8') as f:
            f.write(FEEDBACK_SYSTEM)
        print(f"  [OK] Feedback service: {feedback_path}")
        
        # 10.4 Re-Validation Schedule
        print("\n[10.4] Creating Re-Validation Schedule...")
        scheduler = RevalidationScheduler()
        schedule = scheduler.create_schedule()
        schedule_path = DOCS_DIR / "revalidation_schedule.json"
        with open(schedule_path, 'w', encoding='utf-8') as f:
            json.dump(schedule, f, indent=2)
        print(f"  [OK] Schedule: {schedule['validation_frequency']} validations")
        
        # 10.5 WHO ITA Update Monitoring
        print("\n[10.5] Setting up WHO ITA Update Monitoring...")
        update_path = DOCS_DIR / "update_monitoring.json"
        with open(update_path, 'w', encoding='utf-8') as f:
            json.dump(UPDATE_MONITORING_CONFIG, f, indent=2)
        print(f"  [OK] Update monitoring config saved")
        
        # 10.6 Expert Review Calendar
        print("\n[10.6] Creating Expert Review Calendar...")
        review_path = DOCS_DIR / "expert_review_calendar.json"
        with open(review_path, 'w', encoding='utf-8') as f:
            json.dump(EXPERT_REVIEW_CALENDAR, f, indent=2)
        print(f"  [OK] Review calendar: {EXPERT_REVIEW_CALENDAR['review_cycle']} cycle")
        
        # 10.7 Version Control
        print("\n[10.7] Setting up Version Control...")
        vc = VersionController()
        version_history = vc.create_version_history(self.terms)
        version_path = OUTPUT_DIR / "version_history.json"
        with open(version_path, 'w', encoding='utf-8') as f:
            json.dump(version_history, f, indent=2)
        print(f"  [OK] Version: {version_history['current_version']}")
        
        # 10.8 Backup & Recovery
        print("\n[10.8] Setting up Backup & Recovery...")
        backup_mgr = BackupManager()
        protocol = backup_mgr.create_backup_protocol()
        protocol_path = DOCS_DIR / "backup_protocol.json"
        with open(protocol_path, 'w', encoding='utf-8') as f:
            json.dump(protocol, f, indent=2)
        
        # Create initial backup
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        backup_result = backup_mgr.create_backup(PHASE5_DIR, BACKUP_DIR)
        print(f"  [OK] Backup protocol created")
        print(f"  [OK] Initial backup: {backup_result['file_count']} files")
        
        # 10.9 Performance Monitoring
        print("\n[10.9] Setting up Performance Monitoring...")
        perf_path = DOCS_DIR / "performance_monitoring.json"
        with open(perf_path, 'w', encoding='utf-8') as f:
            json.dump(PERFORMANCE_MONITORING_CONFIG, f, indent=2)
        print(f"  [OK] Performance monitoring config saved")
        
        # 10.10 Continuous Improvement Roadmap
        print("\n[10.10] Creating Improvement Roadmap...")
        roadmap_path = DOCS_DIR / "improvement_roadmap.json"
        with open(roadmap_path, 'w', encoding='utf-8') as f:
            json.dump(IMPROVEMENT_ROADMAP, f, indent=2)
        print(f"  [OK] Roadmap: {len(IMPROVEMENT_ROADMAP['quarters'])} quarters planned")
        
        # Summary
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 10,
            'components': {
                'analytics_dashboard': str(dashboard_path),
                'error_tracking': str(error_path),
                'feedback_system': str(feedback_path),
                'revalidation_schedule': str(schedule_path),
                'update_monitoring': str(update_path),
                'expert_review': str(review_path),
                'version_control': str(version_path),
                'backup_protocol': str(protocol_path),
                'performance_monitoring': str(perf_path),
                'improvement_roadmap': str(roadmap_path)
            },
            'backup': backup_result
        }
        summary_path = OUTPUT_DIR / "phase10_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)
        
        print()
        print("=" * 70)
        print("Phase 10 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
        
        print("\nMAINTENANCE INFRASTRUCTURE:")
        print(f"  Analytics Dashboard: {dashboard_path}")
        print(f"  Error Tracking: Configured")
        print(f"  Feedback System: Ready")
        print(f"  Re-validation: Monthly")
        print(f"  Expert Review: Quarterly")
        print(f"  Version: {version_history['current_version']}")
        print(f"  Backup: {backup_result['file_count']} files backed up")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    
    engine = Phase10MaintenanceEngine()
    engine.run()


if __name__ == "__main__":
    main()
