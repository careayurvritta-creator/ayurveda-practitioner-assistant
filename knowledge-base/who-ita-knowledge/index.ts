import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export * from './devanagari-reference';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'knowledge_base', 'phase5_normalized', 'normalized_knowledge_base.json');
const nodesPath = resolve(__dirname, '..', 'knowledge_base', 'phase7_knowledge_graph', 'graph_nodes.json');
const edgesPath = resolve(__dirname, '..', 'knowledge_base', 'phase7_knowledge_graph', 'graph_edges.json');

export interface ITATerm {
  term_id: string;
  backup_id: string;
  english: string;
  description: string;
  iast: string;
  devanagari: string;
  category: {
    chapter: string;
    chapter_name: string;
    section: string;
    subsection: string;
    full_path: string;
  };
  domains: string[];
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    reason: string;
  };
  metadata: {
    source: string;
    was_corrected: boolean;
    last_updated: string;
  };
  related_terms: Array<{
    term_id: string;
    relationship: string;
  }>;
}

interface ITAKnowledgeBase {
  generated_at: string;
  phase: number;
  schema_version: string;
  total_terms: number;
  statistics: {
    english_fixed: number;
    iast_fixed: number;
    term_id_fixed: number;
    cross_refs: number;
  };
  terms: ITATerm[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  types: string[];
  properties: {
    english: string;
    iast: string;
    devanagari: string;
    chapter: string;
    chapter_name: string;
    domains: string[];
    confidence_level: 'high' | 'medium' | 'low';
    confidence_score: number;
  };
  metadata: {
    created_at: string;
    source: string;
  };
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'RELATED_TO' | 'SAME_CATEGORY' | 'COMPOSED_OF' | 'PART_OF' | 'TREATS' | 'SYMPTOM_OF';
  weight: number;
  directed: boolean;
  properties: {
    source_type: string;
    target_type: string;
  };
}

interface KnowledgeGraphNodes {
  count: number;
  nodes: KnowledgeGraphNode[];
}

interface KnowledgeGraphEdges {
  count: number;
  edges: KnowledgeGraphEdge[];
}

let _kb: ITAKnowledgeBase | null = null;
let _terms: ITATerm[] = [];
let _nodes: KnowledgeGraphNode[] = [];
let _edges: KnowledgeGraphEdge[] = [];
let _treatsEdges: KnowledgeGraphEdge[] = [];
let _symptomOfEdges: KnowledgeGraphEdge[] = [];
let _composedOfEdges: KnowledgeGraphEdge[] = [];
let _nodeMap: Map<string, KnowledgeGraphNode> = new Map();

try {
  const parsed: ITAKnowledgeBase = JSON.parse(readFileSync(dataPath, 'utf-8'));
  _kb = parsed;
  _terms = parsed.terms || [];
} catch {
  console.warn('Warning: normalized_knowledge_base.json not found. Run phase5 pipeline first.');
}

try {
  const nodesData: KnowledgeGraphNodes = JSON.parse(readFileSync(nodesPath, 'utf-8'));
  _nodes = nodesData.nodes || [];
  for (const node of _nodes) {
    _nodeMap.set(node.id, node);
  }
} catch {
  console.warn('Warning: graph_nodes.json not found. Run phase7 pipeline first.');
}

try {
  const edgesData: KnowledgeGraphEdges = JSON.parse(readFileSync(edgesPath, 'utf-8'));
  _edges = edgesData.edges || [];
  _treatsEdges = _edges.filter(e => e.type === 'TREATS');
  _symptomOfEdges = _edges.filter(e => e.type === 'SYMPTOM_OF');
  _composedOfEdges = _edges.filter(e => e.type === 'COMPOSED_OF');
} catch {
  console.warn('Warning: graph_edges.json not found. Run phase7 pipeline first.');
}

export const WHO_ITA_TERMS: ITATerm[] = _terms;
export const WHO_ITA_STATS = {
  totalTerms: _terms.length,
  statistics: _kb?.statistics || { english_fixed: 0, iast_fixed: 0, term_id_fixed: 0, cross_refs: 0 },
  highConfidence: _terms.filter(t => t.confidence.level === 'high').length,
  mediumConfidence: _terms.filter(t => t.confidence.level === 'medium').length,
  lowConfidence: _terms.filter(t => t.confidence.level === 'low').length,
  withDevanagari: _terms.filter(t => t.devanagari && t.devanagari.length > 0).length,
  withIAST: _terms.filter(t => t.iast && t.iast.length > 0).length,
  chapterCounts: _terms.reduce((acc, t) => {
    const ch = t.category.chapter_name;
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};

export const WHO_ITA_CHAPTERS = [
  { number: '1', name: 'Background Concepts', prefix: 'ITA-1', termCount: 323 },
  { number: '2', name: 'Core Concepts', prefix: 'ITA-2', termCount: 207 },
  { number: '3', name: 'Structure (Anatomical Terms)', prefix: 'ITA-3', termCount: 438 },
  { number: '4', name: 'Morbidity & Diagnostic Terms (General)', prefix: 'ITA-4', termCount: 160 },
  { number: '5', name: 'Morbidity & Diagnostic Terms (Disorders)', prefix: 'ITA-5', termCount: 1297 },
  { number: '6', name: 'Materials', prefix: 'ITA-6', termCount: 127 },
  { number: '7', name: 'Preparation of Medicines', prefix: 'ITA-7', termCount: 195 },
  { number: '8', name: 'Preparation of Food', prefix: 'ITA-8', termCount: 113 },
  { number: '9', name: 'Treatment', prefix: 'ITA-9', termCount: 661 },
  { number: '10', name: 'Preventive Healthcare', prefix: 'ITA-10', termCount: 26 },
];

function matchesQuery(text: string, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchWhoItaTerms(query: string): ITATerm[] {
  const q = query.toLowerCase();
  return _terms.filter(t =>
    matchesQuery(t.english, q) ||
    matchesQuery(t.iast, q) ||
    matchesQuery(t.devanagari, q) ||
    matchesQuery(t.term_id, q) ||
    matchesQuery(t.category.chapter_name, q) ||
    matchesQuery(t.category.full_path, q) ||
    matchesQuery(t.description, q)
  );
}

export function lookupWhoItaTerm(termId: string): ITATerm | undefined {
  return _terms.find(t => t.term_id === termId);
}

export function getWhoItaChapter(chapterNumber: string): ITATerm[] {
  return _terms.filter(t => t.category.chapter === chapterNumber);
}

export function getWhoItaChapterByName(chapterName: string): ITATerm[] {
  return _terms.filter(t =>
    t.category.chapter_name.toLowerCase().includes(chapterName.toLowerCase())
  );
}

export function getWhoItaTermsByDomain(domain: string): ITATerm[] {
  return _terms.filter(t => t.domains.includes(domain));
}

export function getWhoItaTermsByConfidence(level: 'high' | 'medium' | 'low'): ITATerm[] {
  return _terms.filter(t => t.confidence.level === level);
}

export function getRelatedWhoItaTerms(termId: string): ITATerm[] {
  const term = lookupWhoItaTerm(termId);
  if (!term) return [];
  return term.related_terms
    .map(rt => lookupWhoItaTerm(rt.term_id))
    .filter((t): t is ITATerm => t !== undefined);
}

export function lookupGraphNode(nodeId: string): KnowledgeGraphNode | undefined {
  return _nodeMap.get(nodeId);
}

export function getNodeLabel(nodeId: string): string {
  const node = _nodeMap.get(nodeId);
  return node ? `${node.label} (${node.properties.devanagari || ''})` : nodeId;
}

export function getTreatsForDisease(diseaseId: string): Array<{ treatment: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _treatsEdges
    .filter(e => e.target === diseaseId)
    .map(e => ({
      treatment: _nodeMap.get(e.source)!,
      edge: e,
    }))
    .filter(r => r.treatment !== undefined);
}

export function getDiseasesTreatedBy(treatmentId: string): Array<{ disease: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _treatsEdges
    .filter(e => e.source === treatmentId)
    .map(e => ({
      disease: _nodeMap.get(e.target)!,
      edge: e,
    }))
    .filter(r => r.disease !== undefined);
}

export function getSymptomsOfDisease(diseaseId: string): Array<{ symptom: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _symptomOfEdges
    .filter(e => e.target === diseaseId)
    .map(e => ({
      symptom: _nodeMap.get(e.source)!,
      edge: e,
    }))
    .filter(r => r.symptom !== undefined);
}

export function getDiseasesWithSymptom(symptomId: string): Array<{ disease: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _symptomOfEdges
    .filter(e => e.source === symptomId)
    .map(e => ({
      disease: _nodeMap.get(e.target)!,
      edge: e,
    }))
    .filter(r => r.disease !== undefined);
}

export function getComponentsOf(compoundId: string): Array<{ component: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _composedOfEdges
    .filter(e => e.source === compoundId)
    .map(e => ({
      component: _nodeMap.get(e.target)!,
      edge: e,
    }))
    .filter(r => r.component !== undefined);
}

export function getCompoundContaining(componentId: string): Array<{ compound: KnowledgeGraphNode; edge: KnowledgeGraphEdge }> {
  return _composedOfEdges
    .filter(e => e.target === componentId)
    .map(e => ({
      compound: _nodeMap.get(e.source)!,
      edge: e,
    }))
    .filter(r => r.compound !== undefined);
}

export function getGraphStats() {
  return {
    totalNodes: _nodes.length,
    totalEdges: _edges.length,
    treatsEdges: _treatsEdges.length,
    symptomOfEdges: _symptomOfEdges.length,
    composedOfEdges: _composedOfEdges.length,
    relatedToEdges: _edges.filter(e => e.type === 'RELATED_TO').length,
    sameCategoryEdges: _edges.filter(e => e.type === 'SAME_CATEGORY').length,
    partOfEdges: _edges.filter(e => e.type === 'PART_OF').length,
    nodeTypes: _nodes.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
