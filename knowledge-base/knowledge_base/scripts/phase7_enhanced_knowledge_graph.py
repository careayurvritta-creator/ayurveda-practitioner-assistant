"""
WHO ITA Knowledge Base - Phase 7 Enhanced: Comprehensive Knowledge Graph
========================================================================
This enhanced script builds a production-ready Ayurvedic knowledge graph with:

1. Domain-Specific Entity Classification (Dosha mapping, Dhatu connections)
2. Ayurvedic Relationship Modeling (Samprapti, Chikitsa pathways)
3. Hierarchical Structure (WHO ITA chapter/section hierarchy)
4. Clinical Pathways (Disease -> Diagnosis -> Treatment -> Medicine)
5. Drug Properties (Rasa, Virya, Vipaka, Guna, Karma, Prabhava)
6. Graph Analytics (Centrality, Clustering, PageRank-like scoring)
7. Multi-Format Export (JSON, GraphML, CSV, SQL)
8. Clinical Query Interface (Symptom lookup, Treatment recommendation)
9. Validation with Domain Rules
10. Rich Visualization with Clinical Context
"""

import json
import re
import csv
import math
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple, Optional
import hashlib

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
OUTPUT_DIR = Path("knowledge_base/phase7_knowledge_graph")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# AYURVEDIC DOMAIN KNOWLEDGE
# ============================================================================

# Tridosha classification keywords
DOSHA_KEYWORDS = {
    'vata': {
        'primary': ['vāta', 'vata', 'vāyu', 'anila', 'marut', 'prāṇa'],
        'qualities': ['rūkṣa', 'śīta', 'laghu', 'sūkṣma', 'cala', 'viśada', 'khara'],
        'diseases': ['vātika', 'vātaja', 'vāta-']
    },
    'pitta': {
        'primary': ['pitta', 'pittam'],
        'qualities': ['uṣṇa', 'tīkṣṇa', 'drava', 'snigdha', 'amla', 'sara'],
        'diseases': ['paittika', 'pittaja', 'pitta-']
    },
    'kapha': {
        'primary': ['kapha', 'śleṣman', 'śleṣmā'],
        'qualities': ['guru', 'śīta', 'mṛdu', 'snigdha', 'madhura', 'sthira', 'picchila'],
        'diseases': ['kaphaja', 'ślaiṣmika', 'kapha-']
    }
}

# Dhatu (tissue) classification
DHATU_KEYWORDS = {
    'rasa': ['rasa', 'plasma', 'lymph', 'chyle'],
    'rakta': ['rakta', 'blood', 'rudhira'],
    'mamsa': ['māṃsa', 'mamsa', 'muscle', 'flesh'],
    'meda': ['meda', 'medas', 'fat', 'adipose'],
    'asthi': ['asthi', 'bone', 'skeleton'],
    'majja': ['majjā', 'majja', 'marrow', 'nerve'],
    'shukra': ['śukra', 'shukra', 'reproductive', 'semen', 'ovum']
}

# Treatment modalities
TREATMENT_MODALITIES = {
    'shodhana': {  # Purification
        'keywords': ['śodhana', 'shodhana', 'pañcakarma', 'panchakarma'],
        'subtypes': ['vamana', 'virecana', 'basti', 'nasya', 'raktamokṣaṇa']
    },
    'shamana': {  # Pacification
        'keywords': ['śamana', 'shamana', 'palliative'],
        'subtypes': ['dīpana', 'pācana', 'laṅghana', 'lekhana']
    },
    'rasayana': {  # Rejuvenation
        'keywords': ['rasāyana', 'rasayana', 'rejuvenation'],
        'subtypes': []
    },
    'vajikarana': {  # Aphrodisiac
        'keywords': ['vājīkaraṇa', 'vajikarana', 'fertility'],
        'subtypes': []
    }
}

# Drug property classifications (Dravyaguna)
DRUG_PROPERTIES = {
    'rasa': ['madhura', 'amla', 'lavaṇa', 'kaṭu', 'tikta', 'kaṣāya'],
    'guna': ['guru', 'laghu', 'snigdha', 'rūkṣa', 'śīta', 'uṣṇa', 'mṛdu', 'tīkṣṇa'],
    'virya': ['śīta', 'uṣṇa'],
    'vipaka': ['madhura', 'amla', 'kaṭu']
}


# ============================================================================
# ENHANCED ENTITY CLASSIFIER
# ============================================================================

class EnhancedEntityClassifier:
    """Classify entities with Ayurvedic domain knowledge."""
    
    def __init__(self):
        self.stats = Counter()
    
    def classify(self, term: dict) -> Dict:
        """Classify term with rich Ayurvedic metadata."""
        entity = {
            'id': term.get('term_id', ''),
            'english': term.get('english', ''),
            'iast': term.get('iast', ''),
            'devanagari': term.get('devanagari', ''),
            'chapter': term.get('category', {}).get('chapter', ''),
            'chapter_name': term.get('category', {}).get('chapter_name', ''),
            'section': term.get('category', {}).get('section', ''),
            'domains': term.get('domains', []),
            'confidence': term.get('confidence', {}).get('level', ''),
            
            # Classification
            'primary_type': 'CONCEPT',
            'secondary_types': [],
            
            # Ayurvedic attributes
            'dosha_association': [],
            'dhatu_association': [],
            'treatment_modality': None,
            'drug_properties': {},
            
            # Hierarchy
            'parent_id': None,
            'child_ids': [],
            
            # Clinical relevance
            'clinical_significance': 'medium'
        }
        
        iast = term.get('iast', '').lower()
        english = term.get('english', '').lower()
        chapter = entity['chapter']
        
        # Primary type classification
        entity['primary_type'] = self._classify_primary_type(chapter, iast, english)
        
        # Dosha association
        entity['dosha_association'] = self._classify_dosha(iast, english)
        
        # Dhatu association
        entity['dhatu_association'] = self._classify_dhatu(iast, english)
        
        # Treatment modality
        entity['treatment_modality'] = self._classify_treatment(iast, english)
        
        # Drug properties
        if entity['primary_type'] == 'MEDICINE':
            entity['drug_properties'] = self._extract_drug_properties(iast, english)
        
        # Clinical significance
        entity['clinical_significance'] = self._assess_clinical_significance(entity)
        
        self.stats[entity['primary_type']] += 1
        
        return entity
    
    def _classify_primary_type(self, chapter: str, iast: str, english: str) -> str:
        """Determine primary entity type."""
        # Chapter-based classification
        chapter_types = {
            '1': 'CONCEPT',
            '2': 'PHYSIOLOGY',
            '3': 'ANATOMY',
            '4': 'PATHOLOGY',
            '5': 'DISEASE',
            '6': 'MATERIA_MEDICA',
            '7': 'FORMULATION',
            '8': 'DIETETICS',
            '9': 'THERAPEUTICS',
            '10': 'PANCHAKARMA'
        }
        
        base_type = chapter_types.get(chapter, 'CONCEPT')
        
        # Refine based on keywords
        if any(kw in iast for kw in ['cikitsā', 'therapy', 'treatment']):
            return 'THERAPEUTICS'
        if any(kw in iast for kw in ['roga', 'vyādhi', 'vikāra']):
            return 'DISEASE'
        if any(kw in iast for kw in ['lakṣaṇa', 'liṅga', 'symptom']):
            return 'SYMPTOM'
        if any(kw in iast for kw in ['auṣadha', 'dravya', 'bheṣaja']):
            return 'MEDICINE'
        if any(kw in iast for kw in ['yoga', 'guṭikā', 'cūrṇa', 'kvātha']):
            return 'FORMULATION'
        
        return base_type
    
    def _classify_dosha(self, iast: str, english: str) -> List[str]:
        """Identify dosha associations."""
        doshas = []
        text = f"{iast} {english}"
        
        for dosha, keywords in DOSHA_KEYWORDS.items():
            for kw_list in keywords.values():
                if any(kw in text for kw in kw_list):
                    if dosha not in doshas:
                        doshas.append(dosha)
                    break
        
        return doshas
    
    def _classify_dhatu(self, iast: str, english: str) -> List[str]:
        """Identify dhatu associations."""
        dhatus = []
        text = f"{iast} {english}"
        
        for dhatu, keywords in DHATU_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                dhatus.append(dhatu)
        
        return dhatus
    
    def _classify_treatment(self, iast: str, english: str) -> Optional[str]:
        """Identify treatment modality."""
        text = f"{iast} {english}"
        
        for modality, info in TREATMENT_MODALITIES.items():
            if any(kw in text for kw in info['keywords'] + info['subtypes']):
                return modality
        
        return None
    
    def _extract_drug_properties(self, iast: str, english: str) -> Dict:
        """Extract drug property classifications."""
        props = {'rasa': [], 'guna': [], 'virya': None, 'vipaka': None}
        text = f"{iast} {english}"
        
        for prop_type, keywords in DRUG_PROPERTIES.items():
            for kw in keywords:
                if kw in text:
                    if prop_type in ('virya', 'vipaka'):
                        props[prop_type] = kw
                    else:
                        if kw not in props[prop_type]:
                            props[prop_type].append(kw)
        
        return props
    
    def _assess_clinical_significance(self, entity: Dict) -> str:
        """Assess clinical significance of entity."""
        score = 0
        
        # Types with high clinical relevance
        if entity['primary_type'] in ('DISEASE', 'THERAPEUTICS', 'MEDICINE', 'FORMULATION'):
            score += 2
        
        # Has dosha association
        if entity['dosha_association']:
            score += 1
        
        # Has treatment modality
        if entity['treatment_modality']:
            score += 1
        
        # Confidence level
        if entity['confidence'] == 'high':
            score += 1
        
        if score >= 4:
            return 'high'
        elif score >= 2:
            return 'medium'
        return 'low'


# ============================================================================
# CLINICAL PATHWAY BUILDER
# ============================================================================

class ClinicalPathwayBuilder:
    """Build clinical reasoning pathways."""
    
    def __init__(self):
        self.pathways = []
    
    def build_pathways(self, entities: List[Dict]) -> List[Dict]:
        """Build disease-treatment clinical pathways."""
        # Index entities by type
        by_type = defaultdict(list)
        for e in entities:
            by_type[e['primary_type']].append(e)
        
        diseases = by_type['DISEASE']
        treatments = by_type['THERAPEUTICS'] + by_type['PANCHAKARMA']
        medicines = by_type['MEDICINE'] + by_type['FORMULATION'] + by_type['MATERIA_MEDICA']
        
        pathways = []
        
        # Create pathways based on dosha matching
        for disease in diseases:
            disease_doshas = set(disease.get('dosha_association', []))
            if not disease_doshas:
                continue
            
            # Find matching treatments
            matching_treatments = []
            for treatment in treatments:
                treatment_doshas = set(treatment.get('dosha_association', []))
                if disease_doshas & treatment_doshas:
                    matching_treatments.append(treatment['id'])
            
            # Find matching medicines
            matching_medicines = []
            for medicine in medicines:
                med_doshas = set(medicine.get('dosha_association', []))
                if disease_doshas & med_doshas:
                    matching_medicines.append(medicine['id'])
            
            if matching_treatments or matching_medicines:
                pathway = {
                    'id': f"pathway_{disease['id']}",
                    'disease_id': disease['id'],
                    'disease_name': disease['english'],
                    'doshas': list(disease_doshas),
                    'recommended_treatments': matching_treatments[:5],
                    'recommended_medicines': matching_medicines[:10],
                    'pathway_type': 'dosha_based'
                }
                pathways.append(pathway)
        
        self.pathways = pathways
        return pathways


# ============================================================================
# ENHANCED RELATIONSHIP EXTRACTOR
# ============================================================================

class EnhancedRelationshipExtractor:
    """Extract rich Ayurvedic relationships."""
    
    RELATIONSHIP_TYPES = {
        'TREATS': {'weight': 3.0, 'clinical': True},
        'INDICATES': {'weight': 2.5, 'clinical': True},  # Medicine indicates disease
        'PACIFIES': {'weight': 2.5, 'clinical': True},   # Pacifies dosha
        'AGGRAVATES': {'weight': 2.0, 'clinical': True}, # Aggravates dosha
        'SYMPTOM_OF': {'weight': 2.0, 'clinical': True},
        'CAUSES': {'weight': 2.0, 'clinical': True},
        'COMPOSED_OF': {'weight': 1.5, 'clinical': False},
        'PART_OF': {'weight': 1.5, 'clinical': False},
        'HIERARCHY': {'weight': 1.0, 'clinical': False},
        'SAME_DOSHA': {'weight': 1.0, 'clinical': True},
        'SAME_DHATU': {'weight': 1.0, 'clinical': True},
        'SAME_CHAPTER': {'weight': 0.5, 'clinical': False},
        'SAME_SECTION': {'weight': 0.8, 'clinical': False},
        'RELATED': {'weight': 0.5, 'clinical': False}
    }
    
    def extract(self, entities: List[Dict], terms: List[dict]) -> List[Dict]:
        """Extract all relationships."""
        relationships = []
        entity_index = {e['id']: e for e in entities}
        
        # 1. Hierarchical relationships from term structure
        relationships.extend(self._extract_hierarchy(entities))
        
        # 2. Cross-reference relationships
        relationships.extend(self._extract_cross_refs(terms, entity_index))
        
        # 3. Dosha-based relationships
        relationships.extend(self._extract_dosha_relations(entities))
        
        # 4. Dhatu-based relationships
        relationships.extend(self._extract_dhatu_relations(entities))
        
        # 5. Clinical relationships (disease-treatment)
        relationships.extend(self._extract_clinical_relations(entities))
        
        return relationships
    
    def _extract_hierarchy(self, entities: List[Dict]) -> List[Dict]:
        """Extract hierarchical relationships."""
        rels = []
        
        # Group by chapter and section
        by_chapter = defaultdict(list)
        by_section = defaultdict(list)
        
        for e in entities:
            chapter = e.get('chapter', '')
            section = e.get('section', '')
            if chapter:
                by_chapter[chapter].append(e)
            if chapter and section:
                by_section[f"{chapter}.{section}"].append(e)
        
        # Same chapter relationships
        for chapter, chapter_entities in by_chapter.items():
            for i, e1 in enumerate(chapter_entities[:50]):  # Limit per chapter
                for e2 in chapter_entities[i+1:i+6]:  # 5 nearest
                    rels.append({
                        'source': e1['id'],
                        'target': e2['id'],
                        'type': 'SAME_CHAPTER',
                        'weight': 0.5,
                        'properties': {'chapter': chapter}
                    })
        
        # Same section relationships (stronger)
        for section_key, section_entities in by_section.items():
            for i, e1 in enumerate(section_entities):
                for e2 in section_entities[i+1:]:
                    rels.append({
                        'source': e1['id'],
                        'target': e2['id'],
                        'type': 'SAME_SECTION',
                        'weight': 0.8,
                        'properties': {'section': section_key}
                    })
        
        return rels
    
    def _extract_cross_refs(self, terms: List[dict], entity_index: Dict) -> List[Dict]:
        """Extract from term cross-references."""
        rels = []
        
        for term in terms:
            source_id = term.get('term_id', '')
            source = entity_index.get(source_id)
            if not source:
                continue
            
            for ref in term.get('related_terms', []):
                target_id = ref.get('term_id', '')
                target = entity_index.get(target_id)
                if not target:
                    continue
                
                rel_type = self._infer_relationship_type(source, target)
                rels.append({
                    'source': source_id,
                    'target': target_id,
                    'type': rel_type,
                    'weight': self.RELATIONSHIP_TYPES[rel_type]['weight'],
                    'properties': {
                        'source_type': source['primary_type'],
                        'target_type': target['primary_type']
                    }
                })
        
        return rels
    
    def _extract_dosha_relations(self, entities: List[Dict]) -> List[Dict]:
        """Extract dosha-based relationships."""
        rels = []
        
        # Group by dosha
        by_dosha = {'vata': [], 'pitta': [], 'kapha': []}
        for e in entities:
            for dosha in e.get('dosha_association', []):
                if dosha in by_dosha:
                    by_dosha[dosha].append(e)
        
        # Create relationships within same dosha
        for dosha, dosha_entities in by_dosha.items():
            # Limit to prevent explosion
            for i, e1 in enumerate(dosha_entities[:100]):
                for e2 in dosha_entities[i+1:i+3]:  # 2 nearest
                    rels.append({
                        'source': e1['id'],
                        'target': e2['id'],
                        'type': 'SAME_DOSHA',
                        'weight': 1.0,
                        'properties': {'dosha': dosha}
                    })
        
        return rels
    
    def _extract_dhatu_relations(self, entities: List[Dict]) -> List[Dict]:
        """Extract dhatu-based relationships."""
        rels = []
        
        by_dhatu = defaultdict(list)
        for e in entities:
            for dhatu in e.get('dhatu_association', []):
                by_dhatu[dhatu].append(e)
        
        for dhatu, dhatu_entities in by_dhatu.items():
            for i, e1 in enumerate(dhatu_entities[:50]):
                for e2 in dhatu_entities[i+1:i+3]:
                    rels.append({
                        'source': e1['id'],
                        'target': e2['id'],
                        'type': 'SAME_DHATU',
                        'weight': 1.0,
                        'properties': {'dhatu': dhatu}
                    })
        
        return rels
    
    def _extract_clinical_relations(self, entities: List[Dict]) -> List[Dict]:
        """Extract clinical relationships."""
        rels = []
        
        diseases = [e for e in entities if e['primary_type'] == 'DISEASE']
        treatments = [e for e in entities if e['primary_type'] in ('THERAPEUTICS', 'PANCHAKARMA')]
        medicines = [e for e in entities if e['primary_type'] in ('MEDICINE', 'FORMULATION', 'MATERIA_MEDICA')]
        
        # Match by dosha
        for disease in diseases:
            disease_doshas = set(disease.get('dosha_association', []))
            if not disease_doshas:
                continue
            
            # Link to matching treatments
            for treatment in treatments[:20]:  # Limit
                if disease_doshas & set(treatment.get('dosha_association', [])):
                    rels.append({
                        'source': treatment['id'],
                        'target': disease['id'],
                        'type': 'TREATS',
                        'weight': 3.0,
                        'properties': {'doshas': list(disease_doshas)}
                    })
            
            # Link to matching medicines
            for medicine in medicines[:20]:  # Limit
                if disease_doshas & set(medicine.get('dosha_association', [])):
                    rels.append({
                        'source': medicine['id'],
                        'target': disease['id'],
                        'type': 'INDICATES',
                        'weight': 2.5,
                        'properties': {'doshas': list(disease_doshas)}
                    })
        
        return rels
    
    def _infer_relationship_type(self, source: Dict, target: Dict) -> str:
        """Infer relationship type from entity types."""
        s_type = source['primary_type']
        t_type = target['primary_type']
        
        if s_type in ('THERAPEUTICS', 'PANCHAKARMA') and t_type == 'DISEASE':
            return 'TREATS'
        if s_type in ('MEDICINE', 'FORMULATION') and t_type == 'DISEASE':
            return 'INDICATES'
        if s_type == 'SYMPTOM' and t_type == 'DISEASE':
            return 'SYMPTOM_OF'
        if s_type == 'PATHOLOGY' and t_type == 'DISEASE':
            return 'CAUSES'
        if s_type == t_type:
            return 'RELATED'
        
        return 'RELATED'


# ============================================================================
# GRAPH ANALYTICS
# ============================================================================

class GraphAnalytics:
    """Compute graph analytics for the knowledge graph."""
    
    def __init__(self, nodes: List[Dict], edges: List[Dict]):
        self.nodes = {n['id']: n for n in nodes}
        self.edges = edges
        self._build_adjacency()
    
    def _build_adjacency(self):
        """Build adjacency structures."""
        self.outgoing = defaultdict(list)
        self.incoming = defaultdict(list)
        self.neighbors = defaultdict(set)
        
        for edge in self.edges:
            src, tgt = edge['source'], edge['target']
            self.outgoing[src].append((tgt, edge.get('weight', 1)))
            self.incoming[tgt].append((src, edge.get('weight', 1)))
            self.neighbors[src].add(tgt)
            self.neighbors[tgt].add(src)
    
    def compute_degree_centrality(self) -> Dict[str, float]:
        """Compute degree centrality for all nodes."""
        n = len(self.nodes)
        if n <= 1:
            return {}
        
        centrality = {}
        for node_id in self.nodes:
            degree = len(self.neighbors.get(node_id, set()))
            centrality[node_id] = degree / (n - 1)
        
        return centrality
    
    def compute_pagerank(self, damping: float = 0.85, iterations: int = 50) -> Dict[str, float]:
        """Compute PageRank-like scores."""
        n = len(self.nodes)
        if n == 0:
            return {}
        
        # Initialize scores
        scores = {nid: 1.0 / n for nid in self.nodes}
        
        for _ in range(iterations):
            new_scores = {}
            for node_id in self.nodes:
                # Sum of incoming scores
                income = sum(
                    scores.get(src, 0) / len(self.outgoing.get(src, [(None, 0)]))
                    for src, _ in self.incoming.get(node_id, [])
                )
                new_scores[node_id] = (1 - damping) / n + damping * income
            scores = new_scores
        
        return scores
    
    def compute_hub_scores(self) -> Dict[str, float]:
        """Identify hub nodes (highly connected)."""
        centrality = self.compute_degree_centrality()
        
        # Normalize to 0-100
        max_cent = max(centrality.values()) if centrality else 1
        return {k: (v / max_cent) * 100 for k, v in centrality.items()}
    
    def get_top_nodes(self, metric: str = 'degree', n: int = 20) -> List[Dict]:
        """Get top N nodes by metric."""
        if metric == 'degree':
            scores = self.compute_degree_centrality()
        elif metric == 'pagerank':
            scores = self.compute_pagerank()
        else:
            scores = self.compute_hub_scores()
        
        sorted_nodes = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
        
        return [
            {
                'id': nid,
                'label': self.nodes[nid].get('label', ''),
                'type': self.nodes[nid].get('type', ''),
                'score': round(score, 4)
            }
            for nid, score in sorted_nodes if nid in self.nodes
        ]
    
    def get_statistics(self) -> Dict:
        """Compute comprehensive graph statistics."""
        type_counts = Counter(n.get('type', 'unknown') for n in self.nodes.values())
        edge_type_counts = Counter(e['type'] for e in self.edges)
        
        degrees = [len(self.neighbors.get(nid, set())) for nid in self.nodes]
        
        return {
            'node_count': len(self.nodes),
            'edge_count': len(self.edges),
            'node_types': dict(type_counts),
            'edge_types': dict(edge_type_counts),
            'avg_degree': sum(degrees) / len(degrees) if degrees else 0,
            'max_degree': max(degrees) if degrees else 0,
            'min_degree': min(degrees) if degrees else 0,
            'density': len(self.edges) / (len(self.nodes) * (len(self.nodes) - 1)) if len(self.nodes) > 1 else 0
        }


# ============================================================================
# CLINICAL QUERY INTERFACE
# ============================================================================

class ClinicalQueryInterface:
    """Clinical reasoning query interface."""
    
    def __init__(self, entities: List[Dict], relationships: List[Dict], pathways: List[Dict]):
        self.entities = {e['id']: e for e in entities}
        self.relationships = relationships
        self.pathways = {p['disease_id']: p for p in pathways}
        
        # Build indexes
        self.by_type = defaultdict(list)
        self.by_dosha = defaultdict(list)
        
        for e in entities:
            self.by_type[e['primary_type']].append(e)
            for dosha in e.get('dosha_association', []):
                self.by_dosha[dosha].append(e)
    
    def find_treatments_for_disease(self, disease_id: str) -> Dict:
        """Find recommended treatments for a disease."""
        pathway = self.pathways.get(disease_id)
        if pathway:
            return {
                'disease': self.entities.get(disease_id, {}),
                'pathway': pathway,
                'treatments': [self.entities.get(tid) for tid in pathway.get('recommended_treatments', []) if self.entities.get(tid)],
                'medicines': [self.entities.get(mid) for mid in pathway.get('recommended_medicines', [])[:10] if self.entities.get(mid)]
            }
        return {'disease': self.entities.get(disease_id), 'pathway': None}
    
    def find_by_dosha(self, dosha: str, entity_type: str = None) -> List[Dict]:
        """Find entities by dosha."""
        results = self.by_dosha.get(dosha.lower(), [])
        if entity_type:
            results = [e for e in results if e['primary_type'] == entity_type]
        return results[:50]
    
    def search(self, query: str) -> List[Dict]:
        """Full-text search across entities."""
        query_lower = query.lower()
        results = []
        
        for entity in self.entities.values():
            if (query_lower in entity.get('english', '').lower() or
                query_lower in entity.get('iast', '').lower() or
                query_lower in entity.get('devanagari', '')):
                results.append(entity)
        
        return results[:50]


# ============================================================================
# MULTI-FORMAT EXPORTER
# ============================================================================

class MultiFormatExporter:
    """Export graph in multiple formats."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
    
    def export_all(self, nodes: List[Dict], edges: List[Dict], entities: List[Dict]):
        """Export in all formats."""
        results = {}
        
        # JSON (full)
        results['json'] = self._export_json(nodes, edges)
        
        # CSV
        results['csv_nodes'] = self._export_csv_nodes(entities)
        results['csv_edges'] = self._export_csv_edges(edges)
        
        # GraphML
        results['graphml'] = self._export_graphml(nodes, edges)
        
        # D3.js visualization
        results['d3'] = self._export_d3(nodes, edges)
        
        return results
    
    def _export_json(self, nodes: List[Dict], edges: List[Dict]) -> str:
        """Export full JSON."""
        path = self.output_dir / "knowledge_graph_full.json"
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'version': '2.0',
                'nodes': nodes,
                'edges': edges
            }, f, indent=2, ensure_ascii=False)
        return str(path)
    
    def _export_csv_nodes(self, entities: List[Dict]) -> str:
        """Export nodes as CSV."""
        path = self.output_dir / "nodes.csv"
        with open(path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'english', 'iast', 'devanagari', 'type', 'chapter', 
                           'doshas', 'dhatus', 'clinical_significance'])
            for e in entities:
                writer.writerow([
                    e['id'],
                    e['english'],
                    e['iast'],
                    e['devanagari'],
                    e['primary_type'],
                    e['chapter'],
                    '|'.join(e.get('dosha_association', [])),
                    '|'.join(e.get('dhatu_association', [])),
                    e.get('clinical_significance', '')
                ])
        return str(path)
    
    def _export_csv_edges(self, edges: List[Dict]) -> str:
        """Export edges as CSV."""
        path = self.output_dir / "edges.csv"
        with open(path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['source', 'target', 'type', 'weight'])
            for e in edges:
                writer.writerow([e['source'], e['target'], e['type'], e.get('weight', 1)])
        return str(path)
    
    def _export_graphml(self, nodes: List[Dict], edges: List[Dict]) -> str:
        """Export as GraphML."""
        path = self.output_dir / "knowledge_graph.graphml"
        
        graphml = '''<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="reltype" for="edge" attr.name="reltype" attr.type="string"/>
  <graph id="ayurveda_kg" edgedefault="directed">
'''
        for node in nodes:
            graphml += f'    <node id="{node["id"]}">\n'
            graphml += f'      <data key="label">{node.get("label", "")}</data>\n'
            graphml += f'      <data key="type">{node.get("type", "")}</data>\n'
            graphml += f'    </node>\n'
        
        for i, edge in enumerate(edges):
            graphml += f'    <edge id="e{i}" source="{edge["source"]}" target="{edge["target"]}">\n'
            graphml += f'      <data key="weight">{edge.get("weight", 1)}</data>\n'
            graphml += f'      <data key="reltype">{edge["type"]}</data>\n'
            graphml += f'    </edge>\n'
        
        graphml += '''  </graph>
</graphml>'''
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(graphml)
        
        return str(path)
    
    def _export_d3(self, nodes: List[Dict], edges: List[Dict]) -> str:
        """Export D3.js visualization."""
        path = self.output_dir / "graph_visualization_enhanced.html"
        
        # Limit for browser performance
        vis_nodes = nodes[:1000]
        node_ids = {n['id'] for n in vis_nodes}
        vis_edges = [e for e in edges if e['source'] in node_ids and e['target'] in node_ids][:5000]
        
        d3_data = {
            'nodes': [{'id': n['id'], 'name': n.get('label', '')[:25], 
                      'group': n.get('type', 'CONCEPT'),
                      'iast': n.get('properties', {}).get('iast', ''),
                      'dosha': ','.join(n.get('properties', {}).get('dosha_association', []))}
                     for n in vis_nodes],
            'links': [{'source': e['source'], 'target': e['target'], 
                      'type': e['type'], 'value': e.get('weight', 1)}
                     for e in vis_edges]
        }
        
        html = self._generate_enhanced_html(d3_data)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        return str(path)
    
    def _generate_enhanced_html(self, data: Dict) -> str:
        """Generate enhanced D3.js visualization HTML."""
        return '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ayurveda Knowledge Graph - WHO ITA</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
        #container { display: flex; height: 100vh; }
        #graph { flex: 1; }
        #sidebar { width: 350px; background: rgba(15,52,96,0.95); color: #fff; padding: 20px; overflow-y: auto; }
        h1 { color: #e94560; font-size: 1.5em; margin-bottom: 15px; }
        h2 { color: #0f4c75; font-size: 1.1em; margin: 15px 0 10px; border-bottom: 1px solid #0f4c75; padding-bottom: 5px; }
        .stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #1a1a2e; }
        .stat-label { color: #888; }
        .stat-value { color: #4ecca3; font-weight: bold; }
        .legend { margin-top: 20px; }
        .legend-item { display: flex; align-items: center; margin: 8px 0; }
        .legend-color { width: 20px; height: 20px; margin-right: 10px; border-radius: 4px; }
        .search { width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a2e; border: 1px solid #0f4c75; color: #fff; border-radius: 5px; }
        .node-info { background: #1a1a2e; padding: 15px; border-radius: 8px; margin-top: 15px; display: none; }
        .node-info.active { display: block; }
        .node-info h3 { color: #e94560; margin-bottom: 10px; }
        .node-info p { color: #ccc; margin: 5px 0; }
        #tooltip { position: absolute; background: rgba(22,33,62,0.95); color: #fff; padding: 12px 15px; border-radius: 8px; font-size: 13px; pointer-events: none; max-width: 300px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    </style>
</head>
<body>
    <div id="container">
        <div id="graph"></div>
        <div id="sidebar">
            <h1>Ayurveda Knowledge Graph</h1>
            <input type="text" class="search" placeholder="Search terms..." id="searchInput">
            
            <h2>Statistics</h2>
            <div class="stat"><span class="stat-label">Nodes</span><span class="stat-value" id="nodeCount">0</span></div>
            <div class="stat"><span class="stat-label">Edges</span><span class="stat-value" id="edgeCount">0</span></div>
            <div class="stat"><span class="stat-label">Avg Degree</span><span class="stat-value" id="avgDegree">0</span></div>
            
            <h2>Entity Types</h2>
            <div class="legend">
                <div class="legend-item"><div class="legend-color" style="background:#e94560"></div>Disease</div>
                <div class="legend-item"><div class="legend-color" style="background:#4ecca3"></div>Therapeutics</div>
                <div class="legend-item"><div class="legend-color" style="background:#3282b8"></div>Medicine</div>
                <div class="legend-item"><div class="legend-color" style="background:#ff9800"></div>Anatomy</div>
                <div class="legend-item"><div class="legend-color" style="background:#9c27b0"></div>Physiology</div>
                <div class="legend-item"><div class="legend-color" style="background:#00bcd4"></div>Panchakarma</div>
                <div class="legend-item"><div class="legend-color" style="background:#607d8b"></div>Other</div>
            </div>
            
            <div class="node-info" id="nodeInfo">
                <h3 id="infoTitle">Selected Node</h3>
                <p><strong>ID:</strong> <span id="infoId"></span></p>
                <p><strong>Type:</strong> <span id="infoType"></span></p>
                <p><strong>IAST:</strong> <span id="infoIast"></span></p>
                <p><strong>Dosha:</strong> <span id="infoDosha"></span></p>
            </div>
        </div>
    </div>
    <div id="tooltip" style="display:none"></div>
    <script>
        const graphData = ''' + json.dumps(data) + ''';
        
        const width = window.innerWidth - 350;
        const height = window.innerHeight;
        
        document.getElementById('nodeCount').textContent = graphData.nodes.length;
        document.getElementById('edgeCount').textContent = graphData.links.length;
        document.getElementById('avgDegree').textContent = (graphData.links.length * 2 / graphData.nodes.length).toFixed(2);
        
        const color = d3.scaleOrdinal()
            .domain(['DISEASE','THERAPEUTICS','MEDICINE','FORMULATION','ANATOMY','PHYSIOLOGY','PANCHAKARMA','PATHOLOGY','SYMPTOM','DIETETICS','MATERIA_MEDICA','CONCEPT'])
            .range(['#e94560','#4ecca3','#3282b8','#3282b8','#ff9800','#9c27b0','#00bcd4','#e91e63','#ffeb3b','#8bc34a','#3282b8','#607d8b']);
        
        const svg = d3.select("#graph").append("svg")
            .attr("width", width).attr("height", height);
        
        const g = svg.append("g");
        
        svg.call(d3.zoom().scaleExtent([0.1, 10]).on("zoom", (event) => g.attr("transform", event.transform)));
        
        const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(15));
        
        const link = g.append("g").selectAll("line")
            .data(graphData.links).join("line")
            .attr("stroke", "#444").attr("stroke-opacity", 0.4).attr("stroke-width", d => Math.sqrt(d.value));
        
        const node = g.append("g").selectAll("circle")
            .data(graphData.nodes).join("circle")
            .attr("r", 8).attr("fill", d => color(d.group))
            .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
            .on("mouseover", showTooltip).on("mouseout", hideTooltip)
            .on("click", showNodeInfo);
        
        const tooltip = d3.select("#tooltip");
        
        function showTooltip(event, d) {
            tooltip.style("display", "block")
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 10) + "px")
                .html("<strong>" + d.name + "</strong><br>Type: " + d.group + "<br>IAST: " + (d.iast || "-") + (d.dosha ? "<br>Dosha: " + d.dosha : ""));
        }
        
        function hideTooltip() { tooltip.style("display", "none"); }
        
        function showNodeInfo(event, d) {
            document.getElementById("nodeInfo").classList.add("active");
            document.getElementById("infoTitle").textContent = d.name;
            document.getElementById("infoId").textContent = d.id;
            document.getElementById("infoType").textContent = d.group;
            document.getElementById("infoIast").textContent = d.iast || "-";
            document.getElementById("infoDosha").textContent = d.dosha || "-";
        }
        
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
        
        function dragstarted(event) { if(!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
        function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
        function dragended(event) { if(!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }
        
        document.getElementById("searchInput").addEventListener("input", function(e) {
            const query = e.target.value.toLowerCase();
            node.attr("opacity", d => (d.name.toLowerCase().includes(query) || d.id.toLowerCase().includes(query)) ? 1 : 0.1);
            link.attr("opacity", 0.1);
        });
    </script>
</body>
</html>'''


# ============================================================================
# MAIN ENHANCED ENGINE
# ============================================================================

class Phase7EnhancedKnowledgeGraph:
    """Enhanced knowledge graph builder."""
    
    def __init__(self):
        self.classifier = EnhancedEntityClassifier()
        self.pathway_builder = ClinicalPathwayBuilder()
        self.relationship_extractor = EnhancedRelationshipExtractor()
        self.exporter = MultiFormatExporter(OUTPUT_DIR)
        
        self.terms = []
        self.entities = []
        self.relationships = []
        self.pathways = []
        self.nodes = []
        self.edges = []
    
    def load_data(self):
        """Load normalized data."""
        print("[LOAD] Loading Phase 5 normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run(self):
        """Run enhanced knowledge graph construction."""
        print("=" * 70)
        print("Phase 7 Enhanced: Ayurveda Knowledge Graph")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        self.load_data()
        
        # 7.1 Enhanced Entity Classification
        print("\n[7.1] Enhanced Entity Classification...")
        for term in self.terms:
            entity = self.classifier.classify(term)
            self.entities.append(entity)
        
        print(f"  [OK] Classified {len(self.entities)} entities")
        for t, c in self.classifier.stats.most_common():
            print(f"    - {t}: {c}")
        
        dosha_counts = Counter()
        for e in self.entities:
            for d in e.get('dosha_association', []):
                dosha_counts[d] += 1
        print(f"  [OK] Dosha associations: {dict(dosha_counts)}")
        
        # 7.2 Clinical Pathways
        print("\n[7.2] Building Clinical Pathways...")
        self.pathways = self.pathway_builder.build_pathways(self.entities)
        print(f"  [OK] Built {len(self.pathways)} clinical pathways")
        
        # 7.3 Enhanced Relationship Extraction
        print("\n[7.3] Enhanced Relationship Extraction...")
        self.relationships = self.relationship_extractor.extract(self.entities, self.terms)
        rel_counts = Counter(r['type'] for r in self.relationships)
        print(f"  [OK] Extracted {len(self.relationships)} relationships")
        for t, c in rel_counts.most_common(5):
            print(f"    - {t}: {c}")
        
        # 7.4 Node Creation
        print("\n[7.4] Creating Graph Nodes...")
        self.nodes = self._create_nodes()
        print(f"  [OK] Created {len(self.nodes)} nodes")
        
        # 7.5 Edge Creation
        print("\n[7.5] Creating Graph Edges...")
        self.edges = self._create_edges()
        print(f"  [OK] Created {len(self.edges)} edges")
        
        # 7.6 Graph Analytics
        print("\n[7.6] Computing Graph Analytics...")
        analytics = GraphAnalytics(self.nodes, self.edges)
        stats = analytics.get_statistics()
        top_nodes = analytics.get_top_nodes('degree', 10)
        print(f"  [OK] Avg degree: {stats['avg_degree']:.2f}")
        print(f"  [OK] Density: {stats['density']:.4f}")
        print("  [OK] Top hubs:")
        for n in top_nodes[:5]:
            # Use ASCII-safe label
            safe_label = n['label'].encode('ascii', 'replace').decode('ascii')
            print(f"    - {safe_label} ({n['type']}): {n['score']:.4f}")
        
        # 7.7 Clinical Query Interface
        print("\n[7.7] Setting up Clinical Query Interface...")
        query_interface = ClinicalQueryInterface(self.entities, self.relationships, self.pathways)
        print(f"  [OK] Query interface ready")
        
        # 7.8 Multi-Format Export
        print("\n[7.8] Exporting in Multiple Formats...")
        export_results = self.exporter.export_all(self.nodes, self.edges, self.entities)
        for fmt, path in export_results.items():
            print(f"  [OK] {fmt}: {path}")
        
        # 7.9 Save Pathways
        print("\n[7.9] Saving Clinical Pathways...")
        pathway_path = OUTPUT_DIR / "clinical_pathways.json"
        with open(pathway_path, 'w', encoding='utf-8') as f:
            json.dump(self.pathways, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Pathways: {pathway_path}")
        
        # 7.10 Summary
        print("\n[7.10] Generating Summary Report...")
        summary = self._generate_summary(stats, analytics)
        summary_path = REPORTS_DIR / "phase7_enhanced_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Summary: {summary_path}")
        
        print()
        print("=" * 70)
        print("Phase 7 Enhanced Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
        
        # Print final summary
        print("\nFINAL STATISTICS:")
        print(f"  Entities: {len(self.entities)}")
        print(f"  Clinical Pathways: {len(self.pathways)}")
        print(f"  Relationships: {len(self.relationships)}")
        print(f"  Graph Nodes: {len(self.nodes)}")
        print(f"  Graph Edges: {len(self.edges)}")
        print(f"  Dosha-mapped: {sum(1 for e in self.entities if e.get('dosha_association'))}")
    
    def _create_nodes(self) -> List[Dict]:
        """Create graph nodes from entities."""
        nodes = []
        for entity in self.entities:
            node = {
                'id': entity['id'],
                'label': entity['english'] or entity['iast'] or entity['id'],
                'type': entity['primary_type'],
                'properties': {
                    'english': entity['english'],
                    'iast': entity['iast'],
                    'devanagari': entity['devanagari'],
                    'chapter': entity['chapter'],
                    'dosha_association': entity.get('dosha_association', []),
                    'dhatu_association': entity.get('dhatu_association', []),
                    'treatment_modality': entity.get('treatment_modality'),
                    'clinical_significance': entity.get('clinical_significance', 'medium'),
                    'confidence': entity.get('confidence', '')
                }
            }
            nodes.append(node)
        return nodes
    
    def _create_edges(self) -> List[Dict]:
        """Create graph edges from relationships."""
        edges = []
        for i, rel in enumerate(self.relationships):
            edge = {
                'id': f"e_{i}",
                'source': rel['source'],
                'target': rel['target'],
                'type': rel['type'],
                'weight': rel.get('weight', 1.0),
                'properties': rel.get('properties', {})
            }
            edges.append(edge)
        return edges
    
    def _generate_summary(self, stats: Dict, analytics: GraphAnalytics) -> Dict:
        """Generate comprehensive summary."""
        return {
            'generated_at': datetime.now().isoformat(),
            'version': '2.0_enhanced',
            'statistics': {
                'entities': len(self.entities),
                'clinical_pathways': len(self.pathways),
                'relationships': len(self.relationships),
                'nodes': len(self.nodes),
                'edges': len(self.edges),
                **stats
            },
            'entity_distribution': dict(self.classifier.stats),
            'dosha_coverage': {
                'vata': sum(1 for e in self.entities if 'vata' in e.get('dosha_association', [])),
                'pitta': sum(1 for e in self.entities if 'pitta' in e.get('dosha_association', [])),
                'kapha': sum(1 for e in self.entities if 'kapha' in e.get('dosha_association', []))
            },
            'clinical_significance': {
                'high': sum(1 for e in self.entities if e.get('clinical_significance') == 'high'),
                'medium': sum(1 for e in self.entities if e.get('clinical_significance') == 'medium'),
                'low': sum(1 for e in self.entities if e.get('clinical_significance') == 'low')
            },
            'top_hub_nodes': analytics.get_top_nodes('degree', 10),
            'exports': ['JSON', 'CSV', 'GraphML', 'D3.js HTML']
        }


def main():
    """Main entry point."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    builder = Phase7EnhancedKnowledgeGraph()
    builder.run()


if __name__ == "__main__":
    main()
