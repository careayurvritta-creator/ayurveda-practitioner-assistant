"""
WHO ITA Knowledge Base - Phase 7: Knowledge Graph Construction
==============================================================
This script implements all 10 sub-phases of Phase 7 to build a 
semantic knowledge graph for advanced AI reasoning.

Sub-phases:
7.1  Entity Extraction
7.2  Relationship Extraction
7.3  Ontology Design
7.4  Node Creation
7.5  Edge Creation
7.6  Semantic Embedding Generation (placeholder)
7.7  Graph Database Population (JSON-based)
7.8  Query Interface Development
7.9  Visualization Layer (D3.js export)
7.10 Knowledge Graph Validation
"""

import json
import re
import sqlite3
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
# 7.1 ENTITY EXTRACTOR
# ============================================================================

class EntityExtractor:
    """Extract entities from terms and classify by type."""
    
    # Entity type patterns based on chapter and keywords
    ENTITY_PATTERNS = {
        'DISEASE': {
            'chapters': ['5'],
            'keywords': ['roga', 'vyādhi', 'vikāra', 'jvara', 'prameha', 'kuṣṭha', 
                        'fever', 'disorder', 'disease', 'syndrome']
        },
        'SYMPTOM': {
            'chapters': ['4'],
            'keywords': ['lakṣaṇa', 'liṅga', 'rūpa', 'symptom', 'sign', 
                        'pain', 'swelling', 'discharge']
        },
        'TREATMENT': {
            'chapters': ['9', '10'],
            'keywords': ['cikitsā', 'ausadha', 'yoga', 'therapy', 'treatment',
                        'vamana', 'virecana', 'basti', 'nasya', 'raktamokṣaṇa']
        },
        'MEDICINE': {
            'chapters': ['6', '7'],
            'keywords': ['dravya', 'auṣadha', 'bheṣaja', 'medicine', 'herb',
                        'powder', 'decoction', 'oil', 'ghee']
        },
        'ANATOMY': {
            'chapters': ['3'],
            'keywords': ['aṅga', 'śarīra', 'asthi', 'māṃsa', 'srotas', 'marma',
                        'organ', 'tissue', 'bone', 'muscle', 'channel']
        },
        'PHYSIOLOGY': {
            'chapters': ['2'],
            'keywords': ['doṣa', 'dhātu', 'mala', 'agni', 'ojas', 'prāṇa',
                        'vāta', 'pitta', 'kapha', 'metabolism']
        },
        'DIET': {
            'chapters': ['8'],
            'keywords': ['āhāra', 'anna', 'pāna', 'pathya', 'diet', 'food',
                        'drink', 'regimen']
        },
        'CONCEPT': {
            'chapters': ['1'],
            'keywords': ['siddhānta', 'tantra', 'vidyā', 'principle', 'theory',
                        'science', 'knowledge']
        }
    }
    
    def extract(self, term: dict) -> Dict:
        """Extract entity information from a term."""
        entity = {
            'id': term.get('term_id', ''),
            'english': term.get('english', ''),
            'iast': term.get('iast', ''),
            'devanagari': term.get('devanagari', ''),
            'types': [],
            'primary_type': 'CONCEPT'
        }
        
        chapter = term.get('category', {}).get('chapter', '')
        iast_lower = term.get('iast', '').lower()
        english_lower = term.get('english', '').lower()
        
        # Determine entity types
        for entity_type, patterns in self.ENTITY_PATTERNS.items():
            # Chapter match
            if chapter in patterns['chapters']:
                entity['types'].append(entity_type)
                continue
            
            # Keyword match
            for kw in patterns['keywords']:
                if kw in iast_lower or kw in english_lower:
                    if entity_type not in entity['types']:
                        entity['types'].append(entity_type)
                    break
        
        # Set primary type (first match or default)
        if entity['types']:
            entity['primary_type'] = entity['types'][0]
        
        return entity


# ============================================================================
# 7.2 RELATIONSHIP EXTRACTOR
# ============================================================================

class RelationshipExtractor:
    """Extract relationships between entities."""
    
    # Relationship patterns
    RELATIONSHIPS = {
        'TREATS': {
            'from_types': ['TREATMENT', 'MEDICINE'],
            'to_types': ['DISEASE', 'SYMPTOM']
        },
        'CAUSES': {
            'from_types': ['PHYSIOLOGY'],
            'to_types': ['DISEASE', 'SYMPTOM']
        },
        'SYMPTOM_OF': {
            'from_types': ['SYMPTOM'],
            'to_types': ['DISEASE']
        },
        'PART_OF': {
            'from_types': ['ANATOMY'],
            'to_types': ['ANATOMY']
        },
        'COMPOSED_OF': {
            'from_types': ['MEDICINE'],
            'to_types': ['MEDICINE']
        },
        'RELATED_TO': {
            'from_types': ['CONCEPT'],
            'to_types': ['CONCEPT']
        },
        'SAME_CATEGORY': {
            'from_types': [],  # Any
            'to_types': []  # Any
        }
    }
    
    def extract_relationships(self, entities: List[Dict], terms: List[dict]) -> List[Dict]:
        """Extract relationships from entities and term cross-references."""
        relationships = []
        
        # Build entity index
        entity_index = {e['id']: e for e in entities}
        
        # Extract from term cross-references
        for term in terms:
            source_id = term.get('term_id', '')
            source_entity = entity_index.get(source_id)
            
            if not source_entity:
                continue
            
            for ref in term.get('related_terms', []):
                target_id = ref.get('term_id', '')
                target_entity = entity_index.get(target_id)
                
                if not target_entity:
                    continue
                
                # Determine relationship type
                rel_type = self._determine_relationship_type(
                    source_entity, target_entity, ref.get('relationship', '')
                )
                
                relationships.append({
                    'source': source_id,
                    'target': target_id,
                    'type': rel_type,
                    'weight': 1.0,
                    'metadata': {
                        'source_type': source_entity['primary_type'],
                        'target_type': target_entity['primary_type']
                    }
                })
        
        return relationships
    
    def _determine_relationship_type(self, source: Dict, target: Dict, 
                                     hint: str) -> str:
        """Determine the relationship type between two entities."""
        source_type = source['primary_type']
        target_type = target['primary_type']
        
        # Check specific relationship patterns
        for rel_type, patterns in self.RELATIONSHIPS.items():
            if (not patterns['from_types'] or source_type in patterns['from_types']) and \
               (not patterns['to_types'] or target_type in patterns['to_types']):
                return rel_type
        
        # Default based on hint
        if hint == 'same_section':
            return 'SAME_CATEGORY'
        
        return 'RELATED_TO'


# ============================================================================
# 7.3 ONTOLOGY DESIGNER
# ============================================================================

class OntologyDesigner:
    """Design Ayurveda ontology structure."""
    
    # Ontology class hierarchy
    ONTOLOGY = {
        'AyurvedaConcept': {
            'description': 'Root class for all Ayurveda concepts',
            'subclasses': {
                'Disease': {
                    'description': 'Disorders and diseases (Roga/Vyadhi)',
                    'properties': ['symptoms', 'causes', 'treatments']
                },
                'Symptom': {
                    'description': 'Signs and symptoms (Lakshana)',
                    'properties': ['associated_diseases', 'severity']
                },
                'Treatment': {
                    'description': 'Therapeutic interventions (Chikitsa)',
                    'properties': ['treats', 'contraindications', 'method']
                },
                'Medicine': {
                    'description': 'Medicines and formulations (Aushadha)',
                    'properties': ['ingredients', 'dosage', 'indications']
                },
                'Anatomy': {
                    'description': 'Body parts and structures (Sharira)',
                    'properties': ['location', 'function', 'related_parts']
                },
                'Physiology': {
                    'description': 'Physiological concepts (Dosha/Dhatu)',
                    'properties': ['function', 'imbalance_effects']
                },
                'Diet': {
                    'description': 'Dietary concepts (Ahara)',
                    'properties': ['properties', 'therapeutic_use']
                },
                'Concept': {
                    'description': 'Theoretical concepts',
                    'properties': ['definition', 'related_concepts']
                }
            }
        }
    }
    
    # Relationship types
    OBJECT_PROPERTIES = {
        'treats': {'domain': 'Treatment', 'range': 'Disease'},
        'causes': {'domain': 'Physiology', 'range': 'Disease'},
        'symptomOf': {'domain': 'Symptom', 'range': 'Disease'},
        'partOf': {'domain': 'Anatomy', 'range': 'Anatomy'},
        'composedOf': {'domain': 'Medicine', 'range': 'Medicine'},
        'relatedTo': {'domain': 'AyurvedaConcept', 'range': 'AyurvedaConcept'},
    }
    
    def generate_ontology(self) -> Dict:
        """Generate ontology definition."""
        return {
            'name': 'AyurvedaOntology',
            'version': '1.0',
            'namespace': 'http://ayurvritta.org/ontology/ayurveda#',
            'description': 'Ontology for WHO ITA Ayurveda terminology',
            'classes': self.ONTOLOGY,
            'object_properties': self.OBJECT_PROPERTIES,
            'generated_at': datetime.now().isoformat()
        }


# ============================================================================
# 7.4 NODE CREATOR
# ============================================================================

class NodeCreator:
    """Create graph nodes from entities."""
    
    def create_nodes(self, entities: List[Dict], terms: List[dict]) -> List[Dict]:
        """Create nodes for all entities."""
        nodes = []
        term_index = {t.get('term_id', ''): t for t in terms}
        
        for entity in entities:
            term_id = entity['id']
            term = term_index.get(term_id, {})
            
            node = {
                'id': term_id,
                'label': entity['english'] or entity['iast'],
                'type': entity['primary_type'],
                'types': entity['types'],
                'properties': {
                    'english': entity['english'],
                    'iast': entity['iast'],
                    'devanagari': entity['devanagari'],
                    'chapter': term.get('category', {}).get('chapter', ''),
                    'chapter_name': term.get('category', {}).get('chapter_name', ''),
                    'domains': term.get('domains', []),
                    'confidence_level': term.get('confidence', {}).get('level', ''),
                    'confidence_score': term.get('confidence', {}).get('score', 0)
                },
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'source': 'WHO ITA'
                }
            }
            
            nodes.append(node)
        
        return nodes


# ============================================================================
# 7.5 EDGE CREATOR
# ============================================================================

class EdgeCreator:
    """Create graph edges from relationships."""
    
    def create_edges(self, relationships: List[Dict]) -> List[Dict]:
        """Create edges from relationships."""
        edges = []
        edge_id = 0
        
        for rel in relationships:
            edge = {
                'id': f"e_{edge_id}",
                'source': rel['source'],
                'target': rel['target'],
                'type': rel['type'],
                'weight': rel.get('weight', 1.0),
                'directed': True,
                'properties': rel.get('metadata', {})
            }
            edges.append(edge)
            edge_id += 1
        
        return edges


# ============================================================================
# 7.6 SEMANTIC EMBEDDING GENERATOR (Placeholder)
# ============================================================================

class SemanticEmbeddingGenerator:
    """Generate semantic embeddings for nodes (placeholder for API integration)."""
    
    def generate_placeholder(self, nodes: List[Dict]) -> Dict:
        """Generate placeholder embedding structure."""
        embeddings = {}
        
        for node in nodes:
            # Create deterministic pseudo-embedding based on content hash
            content = f"{node.get('label', '')}{node.get('type', '')}"
            hash_val = hashlib.md5(content.encode()).hexdigest()
            
            # Generate 384-dim placeholder (similar to sentence-transformers)
            embedding = [int(hash_val[i:i+2], 16) / 255.0 for i in range(0, 32, 2)]
            # Extend to 384 dimensions
            embedding = (embedding * 24)[:384]
            
            embeddings[node['id']] = {
                'model': 'placeholder-384',
                'vector': embedding[:10],  # Store only first 10 for size
                'full_dim': 384
            }
        
        return embeddings


# ============================================================================
# 7.7 GRAPH DATABASE (JSON-based storage)
# ============================================================================

class GraphDatabase:
    """JSON-based graph database for portability."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.nodes = []
        self.edges = []
    
    def load(self, nodes: List[Dict], edges: List[Dict]):
        """Load nodes and edges."""
        self.nodes = nodes
        self.edges = edges
    
    def save(self):
        """Save graph to JSON files."""
        # Save nodes
        nodes_path = self.output_dir / "graph_nodes.json"
        with open(nodes_path, 'w', encoding='utf-8') as f:
            json.dump({
                'count': len(self.nodes),
                'nodes': self.nodes
            }, f, indent=2, ensure_ascii=False)
        
        # Save edges
        edges_path = self.output_dir / "graph_edges.json"
        with open(edges_path, 'w', encoding='utf-8') as f:
            json.dump({
                'count': len(self.edges),
                'edges': self.edges
            }, f, indent=2, ensure_ascii=False)
        
        # Save combined graph
        graph_path = self.output_dir / "knowledge_graph.json"
        with open(graph_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'stats': {
                    'node_count': len(self.nodes),
                    'edge_count': len(self.edges)
                },
                'nodes': self.nodes,
                'edges': self.edges
            }, f, indent=2, ensure_ascii=False)
        
        return {
            'nodes_path': str(nodes_path),
            'edges_path': str(edges_path),
            'graph_path': str(graph_path)
        }


# ============================================================================
# 7.8 QUERY INTERFACE
# ============================================================================

class QueryInterface:
    """Query interface for the knowledge graph."""
    
    def __init__(self, nodes: List[Dict], edges: List[Dict]):
        self.nodes = {n['id']: n for n in nodes}
        self.edges = edges
        
        # Build adjacency lists
        self.outgoing = defaultdict(list)
        self.incoming = defaultdict(list)
        
        for edge in edges:
            self.outgoing[edge['source']].append(edge)
            self.incoming[edge['target']].append(edge)
    
    def get_node(self, node_id: str) -> Optional[Dict]:
        """Get node by ID."""
        return self.nodes.get(node_id)
    
    def find_by_type(self, node_type: str) -> List[Dict]:
        """Find all nodes of a given type."""
        return [n for n in self.nodes.values() if n['type'] == node_type]
    
    def find_by_keyword(self, keyword: str) -> List[Dict]:
        """Find nodes by keyword in label or properties."""
        keyword_lower = keyword.lower()
        results = []
        for node in self.nodes.values():
            if keyword_lower in node.get('label', '').lower():
                results.append(node)
            elif keyword_lower in node.get('properties', {}).get('iast', '').lower():
                results.append(node)
            elif keyword_lower in node.get('properties', {}).get('devanagari', ''):
                results.append(node)
        return results
    
    def get_neighbors(self, node_id: str, direction: str = 'both') -> List[Dict]:
        """Get neighboring nodes."""
        neighbors = []
        
        if direction in ('out', 'both'):
            for edge in self.outgoing.get(node_id, []):
                target = self.nodes.get(edge['target'])
                if target:
                    neighbors.append({
                        'node': target,
                        'relationship': edge['type'],
                        'direction': 'outgoing'
                    })
        
        if direction in ('in', 'both'):
            for edge in self.incoming.get(node_id, []):
                source = self.nodes.get(edge['source'])
                if source:
                    neighbors.append({
                        'node': source,
                        'relationship': edge['type'],
                        'direction': 'incoming'
                    })
        
        return neighbors
    
    def get_path(self, start_id: str, end_id: str, max_depth: int = 5) -> List[str]:
        """Find path between two nodes (BFS)."""
        if start_id not in self.nodes or end_id not in self.nodes:
            return []
        
        visited = {start_id}
        queue = [(start_id, [start_id])]
        
        while queue:
            current, path = queue.pop(0)
            
            if current == end_id:
                return path
            
            if len(path) >= max_depth:
                continue
            
            for edge in self.outgoing.get(current, []):
                next_node = edge['target']
                if next_node not in visited:
                    visited.add(next_node)
                    queue.append((next_node, path + [next_node]))
        
        return []
    
    def get_statistics(self) -> Dict:
        """Get graph statistics."""
        type_counts = Counter(n['type'] for n in self.nodes.values())
        edge_type_counts = Counter(e['type'] for e in self.edges)
        
        return {
            'total_nodes': len(self.nodes),
            'total_edges': len(self.edges),
            'node_types': dict(type_counts),
            'edge_types': dict(edge_type_counts),
            'avg_degree': len(self.edges) * 2 / len(self.nodes) if self.nodes else 0
        }


# ============================================================================
# 7.9 VISUALIZATION EXPORTER
# ============================================================================

class VisualizationExporter:
    """Export graph for D3.js visualization."""
    
    def export_d3_format(self, nodes: List[Dict], edges: List[Dict]) -> Dict:
        """Export in D3.js force-directed graph format."""
        d3_nodes = []
        d3_links = []
        
        # Node index for D3
        node_index = {}
        for i, node in enumerate(nodes):
            node_index[node['id']] = i
            d3_nodes.append({
                'id': node['id'],
                'name': node['label'][:30],
                'group': node['type'],
                'iast': node['properties'].get('iast', ''),
                'devanagari': node['properties'].get('devanagari', '')
            })
        
        # Links
        for edge in edges:
            if edge['source'] in node_index and edge['target'] in node_index:
                d3_links.append({
                    'source': node_index[edge['source']],
                    'target': node_index[edge['target']],
                    'type': edge['type'],
                    'value': edge.get('weight', 1)
                })
        
        return {
            'nodes': d3_nodes,
            'links': d3_links
        }
    
    def export_html_viewer(self, d3_data: Dict, output_path: Path):
        """Generate standalone HTML visualization."""
        html_template = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WHO ITA Knowledge Graph</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; background: #1a1a2e; }
        #graph { width: 100vw; height: 100vh; }
        .node { cursor: pointer; }
        .node text { font-size: 10px; fill: #fff; }
        .link { stroke: #666; stroke-opacity: 0.6; }
        .tooltip { position: absolute; background: #16213e; color: #fff; padding: 10px; border-radius: 5px; font-size: 12px; }
        h3 { color: #0f3460; margin: 5px 0; }
        .legend { position: fixed; top: 10px; right: 10px; background: #16213e; padding: 15px; border-radius: 5px; color: #fff; }
        .legend-item { display: flex; align-items: center; margin: 5px 0; }
        .legend-color { width: 15px; height: 15px; margin-right: 10px; border-radius: 50%; }
    </style>
</head>
<body>
    <div id="graph"></div>
    <div class="legend">
        <h3>Entity Types</h3>
        <div class="legend-item"><div class="legend-color" style="background:#e94560"></div>DISEASE</div>
        <div class="legend-item"><div class="legend-color" style="background:#ff9800"></div>SYMPTOM</div>
        <div class="legend-item"><div class="legend-color" style="background:#4caf50"></div>TREATMENT</div>
        <div class="legend-item"><div class="legend-color" style="background:#2196f3"></div>MEDICINE</div>
        <div class="legend-item"><div class="legend-color" style="background:#9c27b0"></div>ANATOMY</div>
        <div class="legend-item"><div class="legend-color" style="background:#00bcd4"></div>PHYSIOLOGY</div>
        <div class="legend-item"><div class="legend-color" style="background:#ff5722"></div>DIET</div>
        <div class="legend-item"><div class="legend-color" style="background:#607d8b"></div>CONCEPT</div>
    </div>
    <script>
        const data = ''' + json.dumps(d3_data) + ''';
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const color = d3.scaleOrdinal()
            .domain(['DISEASE','SYMPTOM','TREATMENT','MEDICINE','ANATOMY','PHYSIOLOGY','DIET','CONCEPT'])
            .range(['#e94560','#ff9800','#4caf50','#2196f3','#9c27b0','#00bcd4','#ff5722','#607d8b']);
        
        const svg = d3.select("#graph").append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("class", "link")
            .attr("stroke-width", d => Math.sqrt(d.value));
        
        const node = svg.append("g")
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", 8)
            .attr("fill", d => color(d.group))
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        node.append("title").text(d => d.name + "\\n" + (d.iast || '') + "\\n" + (d.devanagari || ''));
        
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
        
        function dragstarted(event) { if(!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
        function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
        function dragended(event) { if(!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }
    </script>
</body>
</html>'''
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_template)


# ============================================================================
# 7.10 GRAPH VALIDATOR
# ============================================================================

class GraphValidator:
    """Validate knowledge graph structure."""
    
    def validate(self, nodes: List[Dict], edges: List[Dict]) -> Dict:
        """Validate graph structure."""
        results = {
            'valid': True,
            'checks': {},
            'issues': []
        }
        
        node_ids = {n['id'] for n in nodes}
        
        # Check 1: All edges reference valid nodes
        orphaned_edges = 0
        for edge in edges:
            if edge['source'] not in node_ids:
                orphaned_edges += 1
            if edge['target'] not in node_ids:
                orphaned_edges += 1
        
        results['checks']['edge_integrity'] = {
            'passed': orphaned_edges == 0,
            'orphaned_edges': orphaned_edges
        }
        
        # Check 2: No duplicate nodes
        duplicate_nodes = len(nodes) - len(node_ids)
        results['checks']['node_uniqueness'] = {
            'passed': duplicate_nodes == 0,
            'duplicates': duplicate_nodes
        }
        
        # Check 3: Connected components
        connected = self._count_connected_components(nodes, edges)
        results['checks']['connectivity'] = {
            'components': connected['count'],
            'largest_component': connected['largest'],
            'isolated_nodes': connected['isolated']
        }
        
        # Check 4: Type distribution
        type_counts = Counter(n['type'] for n in nodes)
        results['checks']['type_distribution'] = dict(type_counts)
        
        # Overall validity
        results['valid'] = all(
            c.get('passed', True) for c in results['checks'].values()
            if isinstance(c, dict) and 'passed' in c
        )
        
        return results
    
    def _count_connected_components(self, nodes: List[Dict], edges: List[Dict]) -> Dict:
        """Count connected components."""
        adjacency = defaultdict(set)
        for edge in edges:
            adjacency[edge['source']].add(edge['target'])
            adjacency[edge['target']].add(edge['source'])
        
        visited = set()
        components = []
        
        for node in nodes:
            node_id = node['id']
            if node_id not in visited:
                component = set()
                stack = [node_id]
                while stack:
                    current = stack.pop()
                    if current not in visited:
                        visited.add(current)
                        component.add(current)
                        for neighbor in adjacency.get(current, []):
                            if neighbor not in visited:
                                stack.append(neighbor)
                components.append(len(component))
        
        isolated = sum(1 for c in components if c == 1)
        
        return {
            'count': len(components),
            'largest': max(components) if components else 0,
            'isolated': isolated
        }


# ============================================================================
# MAIN PHASE 7 ENGINE
# ============================================================================

class Phase7KnowledgeGraphBuilder:
    """Main engine for knowledge graph construction."""
    
    def __init__(self):
        self.entity_extractor = EntityExtractor()
        self.relationship_extractor = RelationshipExtractor()
        self.ontology_designer = OntologyDesigner()
        self.node_creator = NodeCreator()
        self.edge_creator = EdgeCreator()
        self.embedding_generator = SemanticEmbeddingGenerator()
        self.graph_db = GraphDatabase(OUTPUT_DIR)
        self.visualizer = VisualizationExporter()
        self.validator = GraphValidator()
        
        self.terms = []
        self.entities = []
        self.relationships = []
        self.nodes = []
        self.edges = []
    
    def load_data(self):
        """Load normalized data from Phase 5."""
        print("[LOAD] Loading Phase 5 normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run_all_phases(self):
        """Execute all Phase 7 sub-phases."""
        print("=" * 70)
        print("WHO ITA Knowledge Base - Phase 7: Knowledge Graph")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        self.load_data()
        
        # 7.1 Entity Extraction
        print("\n[7.1] Entity Extraction...")
        for term in self.terms:
            entity = self.entity_extractor.extract(term)
            self.entities.append(entity)
        entity_types = Counter(e['primary_type'] for e in self.entities)
        print(f"  [OK] Extracted {len(self.entities)} entities")
        for t, c in entity_types.most_common():
            print(f"    - {t}: {c}")
        
        # 7.2 Relationship Extraction
        print("\n[7.2] Relationship Extraction...")
        self.relationships = self.relationship_extractor.extract_relationships(
            self.entities, self.terms
        )
        rel_types = Counter(r['type'] for r in self.relationships)
        print(f"  [OK] Extracted {len(self.relationships)} relationships")
        for t, c in rel_types.most_common(5):
            print(f"    - {t}: {c}")
        
        # 7.3 Ontology Design
        print("\n[7.3] Ontology Design...")
        ontology = self.ontology_designer.generate_ontology()
        ont_path = OUTPUT_DIR / "ayurveda_ontology.json"
        with open(ont_path, 'w', encoding='utf-8') as f:
            json.dump(ontology, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Ontology saved to {ont_path}")
        
        # 7.4 Node Creation
        print("\n[7.4] Node Creation...")
        self.nodes = self.node_creator.create_nodes(self.entities, self.terms)
        print(f"  [OK] Created {len(self.nodes)} nodes")
        
        # 7.5 Edge Creation
        print("\n[7.5] Edge Creation...")
        self.edges = self.edge_creator.create_edges(self.relationships)
        print(f"  [OK] Created {len(self.edges)} edges")
        
        # 7.6 Semantic Embeddings (Placeholder)
        print("\n[7.6] Semantic Embedding Generation...")
        embeddings = self.embedding_generator.generate_placeholder(self.nodes)
        emb_path = OUTPUT_DIR / "embeddings_placeholder.json"
        with open(emb_path, 'w', encoding='utf-8') as f:
            json.dump({
                'model': 'placeholder',
                'count': len(embeddings),
                'sample': dict(list(embeddings.items())[:5])
            }, f, indent=2)
        print(f"  [OK] Placeholder embeddings for {len(embeddings)} nodes")
        
        # 7.7 Graph Database Population
        print("\n[7.7] Graph Database Population...")
        self.graph_db.load(self.nodes, self.edges)
        paths = self.graph_db.save()
        print(f"  [OK] Graph saved: {paths['graph_path']}")
        
        # 7.8 Query Interface
        print("\n[7.8] Query Interface Development...")
        query = QueryInterface(self.nodes, self.edges)
        stats = query.get_statistics()
        print(f"  [OK] Query interface ready")
        print(f"    - Total nodes: {stats['total_nodes']}")
        print(f"    - Total edges: {stats['total_edges']}")
        print(f"    - Avg degree: {stats['avg_degree']:.2f}")
        
        # 7.9 Visualization
        print("\n[7.9] Visualization Layer...")
        d3_data = self.visualizer.export_d3_format(self.nodes[:500], self.edges[:2000])  # Limit for browser
        html_path = OUTPUT_DIR / "graph_visualization.html"
        self.visualizer.export_html_viewer(d3_data, html_path)
        print(f"  [OK] Visualization: {html_path}")
        
        # 7.10 Validation
        print("\n[7.10] Knowledge Graph Validation...")
        validation = self.validator.validate(self.nodes, self.edges)
        val_path = REPORTS_DIR / "graph_validation.json"
        with open(val_path, 'w', encoding='utf-8') as f:
            json.dump(validation, f, indent=2, ensure_ascii=False)
        print(f"  [OK] Validation: {'PASSED' if validation['valid'] else 'ISSUES'}")
        print(f"    - Edge integrity: {validation['checks']['edge_integrity']['passed']}")
        print(f"    - Node uniqueness: {validation['checks']['node_uniqueness']['passed']}")
        print(f"    - Connected components: {validation['checks']['connectivity']['components']}")
        
        # Save summary
        self.save_summary(stats, validation)
        
        print()
        print("=" * 70)
        print("Phase 7 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
    
    def save_summary(self, stats: Dict, validation: Dict):
        """Save phase summary."""
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 7,
            'statistics': {
                'entities': len(self.entities),
                'relationships': len(self.relationships),
                'nodes': len(self.nodes),
                'edges': len(self.edges),
                **stats
            },
            'validation': validation,
            'files_generated': [
                'knowledge_graph.json',
                'graph_nodes.json',
                'graph_edges.json',
                'ayurveda_ontology.json',
                'graph_visualization.html'
            ]
        }
        
        summary_path = REPORTS_DIR / "phase7_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"\n  [OK] Summary saved: {summary_path}")


def main():
    """Main entry point."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    builder = Phase7KnowledgeGraphBuilder()
    builder.run_all_phases()


if __name__ == "__main__":
    main()
