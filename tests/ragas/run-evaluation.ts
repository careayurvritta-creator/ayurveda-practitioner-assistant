import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EvalQuery {
  id: string;
  query: string;
  expectedCategories: string[];
  expectedAnswerPatterns: string[];
  complexity: string;
  intent: string;
}

interface EvalResult {
  id: string;
  query: string;
  retrievedCategories: string[];
  retrievedContent: string;
  patternsFound: string[];
  patternsMissed: string[];
  patternCoverage: number;
  categoryPrecision: number;
  categoryRecall: number;
  topSimilarity: number;
  avgSimilarity: number;
  retrievalLatencyMs: number;
}

const EVAL_SET_PATH = new URL('./evaluation-set.json', import.meta.url).pathname;

async function loadEvalSet(): Promise<EvalQuery[]> {
  const raw = await Deno.readTextFile(EVAL_SET_PATH);
  return JSON.parse(raw).queries;
}

async function runEvalQuery(
  query: string,
  supabase: any
): Promise<{ categories: string[]; content: string; similarities: number[]; latencyMs: number }> {
  const start = Date.now();

  // Embed the query
  const embedResponse = await supabase.functions.invoke('embed', {
    body: { text: query },
  });

  let embedding: number[] = [];
  if (embedResponse.data?.embedding) {
    embedding = embedResponse.data.embedding;
  } else {
    // Fallback: use a simple approach
    return { categories: [], content: '', similarities: [], latencyMs: Date.now() - start };
  }

  // Retrieve chunks
  const { data: chunks, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 15,
    category_filter: [],
    source_filter: [],
  });

  if (error || !chunks) {
    return { categories: [], content: '', similarities: [], latencyMs: Date.now() - start };
  }

  const categories = [...new Set(chunks.map((c: any) => c.category))];
  const content = chunks.map((c: any) => c.content).join('\n\n---\n\n');
  const similarities = chunks.map((c: any) => c.similarity ?? 0);

  return { categories, content, similarities, latencyMs: Date.now() - start };
}

function computePatternCoverage(content: string, patterns: string[]): { found: string[]; missed: string[]; coverage: number } {
  const contentLower = content.toLowerCase();
  const found = patterns.filter(p => contentLower.includes(p.toLowerCase()));
  const missed = patterns.filter(p => !contentLower.includes(p.toLowerCase()));
  return {
    found,
    missed,
    coverage: patterns.length > 0 ? found.length / patterns.length : 0,
  };
}

function computeCategoryMetrics(retrieved: string[], expected: string[]): { precision: number; recall: number } {
  const retrievedSet = new Set(retrieved);
  const expectedSet = new Set(expected);
  const intersection = [...expectedSet].filter(c => retrievedSet.has(c));
  return {
    precision: retrievedSet.size > 0 ? intersection.length / retrievedSet.size : 0,
    recall: expectedSet.size > 0 ? intersection.length / expectedSet.size : 0,
  };
}

async function runEvaluation() {
  console.log('=== RAGAS Evaluation Framework ===\n');

  const evalSet = await loadEvalSet();
  console.log(`Loaded ${evalSet.length} evaluation queries\n`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    Deno.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: EvalResult[] = [];

  for (const eq of evalSet) {
    process.stdout.write(`Running ${eq.id}... `);

    const { categories, content, similarities, latencyMs } = await runEvalQuery(eq.query, supabase);

    const { found, missed, coverage } = computePatternCoverage(content, eq.expectedAnswerPatterns);
    const { precision, recall } = computeCategoryMetrics(categories, eq.expectedCategories);

    const result: EvalResult = {
      id: eq.id,
      query: eq.query,
      retrievedCategories: categories,
      retrievedContent: content.slice(0, 500),
      patternsFound: found,
      patternsMissed: missed,
      patternCoverage: coverage,
      categoryPrecision: precision,
      categoryRecall: recall,
      topSimilarity: similarities.length > 0 ? Math.max(...similarities) : 0,
      avgSimilarity: similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0,
      retrievalLatencyMs: latencyMs,
    };

    results.push(result);
    console.log(`OK (${latencyMs}ms, ${coverage.toFixed(0)}% pattern coverage)`);
  }

  // Compute aggregate metrics
  console.log('\n=== Aggregate Metrics ===\n');

  const avgPatternCoverage = results.reduce((s, r) => s + r.patternCoverage, 0) / results.length;
  const avgCategoryPrecision = results.reduce((s, r) => s + r.categoryPrecision, 0) / results.length;
  const avgCategoryRecall = results.reduce((s, r) => s + r.categoryRecall, 0) / results.length;
  const avgTopSimilarity = results.reduce((s, r) => s + r.topSimilarity, 0) / results.length;
  const avgLatency = results.reduce((s, r) => s + r.retrievalLatencyMs, 0) / results.length;

  console.log(`Pattern Coverage (Context Recall):  ${avgPatternCoverage.toFixed(3)}`);
  console.log(`Category Precision:                  ${avgCategoryPrecision.toFixed(3)}`);
  console.log(`Category Recall (Context Recall):    ${avgCategoryRecall.toFixed(3)}`);
  console.log(`Avg Top Similarity:                  ${avgTopSimilarity.toFixed(3)}`);
  console.log(`Avg Retrieval Latency:               ${avgLatency.toFixed(0)}ms`);

  // Failures
  const failures = results.filter(r => r.patternCoverage < 0.3 || r.categoryRecall < 0.3);
  if (failures.length > 0) {
    console.log(`\n=== ${failures.length} Queries Below Threshold ===\n`);
    for (const f of failures) {
      console.log(`  ${f.id}: "${f.query.slice(0, 60)}..."`);
      console.log(`    Pattern coverage: ${f.patternCoverage.toFixed(2)}, Category recall: ${f.categoryRecall.toFixed(2)}`);
      console.log(`    Missed: ${f.patternsMissed.join(', ')}`);
    }
  }

  // Quality gate
  const GATE_PATTERN_COVERAGE = 0.5;
  const GATE_CATEGORY_RECALL = 0.5;
  const gatePass = avgPatternCoverage >= GATE_PATTERN_COVERAGE && avgCategoryRecall >= GATE_CATEGORY_RECALL;

  console.log(`\n=== Quality Gate: ${gatePass ? 'PASS' : 'FAIL'} ===`);
  console.log(`  Required: Pattern Coverage >= ${GATE_PATTERN_COVERAGE}, Category Recall >= ${GATE_CATEGORY_RECALL}`);
  console.log(`  Actual:   Pattern Coverage = ${avgPatternCoverage.toFixed(3)}, Category Recall = ${avgCategoryRecall.toFixed(3)}`);

  // Write results
  const outputPath = new URL('./results.json', import.meta.url).pathname;
  await Deno.writeTextFile(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    aggregateMetrics: {
      patternCoverage: avgPatternCoverage,
      categoryPrecision: avgCategoryPrecision,
      categoryRecall: avgCategoryRecall,
      avgTopSimilarity,
      avgLatencyMs: avgLatency,
    },
    qualityGate: gatePass,
    results,
  }, null, 2));

  console.log(`\nResults written to ${outputPath}`);

  if (!gatePass) {
    Deno.exit(1);
  }
}

runEvaluation();
