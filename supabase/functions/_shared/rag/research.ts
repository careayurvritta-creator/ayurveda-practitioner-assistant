import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const NCBI_API_KEY = Deno.env.get('NCBI_API_KEY');
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');

let cachedClient: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!cachedClient) cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  return cachedClient;
}

export interface ResearchArticle {
  id: string;
  title: string;
  abstract: string | null;
  source: 'pubmed' | 'openalex' | 'scholar';
  url: string | null;
  disease: string;
  year: number | null;
  fetched_at: string;
}

interface RawArticle {
  title: string;
  abstract: string;
  source: string;
  url: string;
  year: number | null;
}

const CACHE_TTL_HOURS = 24;

async function checkCache(disease: string): Promise<ResearchArticle[] | null> {
  const client = getClient();
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000).toISOString();
  const { data, error } = await client
    .from('research_articles')
    .select('*')
    .eq('disease', disease)
    .gte('fetched_at', cutoff)
    .order('fetched_at', { ascending: false })
    .limit(50);
  if (error || !data || data.length === 0) return null;
  return data as ResearchArticle[];
}

async function cacheArticles(disease: string, articles: RawArticle[]): Promise<void> {
  const client = getClient();
  for (const a of articles) {
    await client.from('research_articles').upsert({
      title: a.title,
      abstract: a.abstract,
      source: a.source,
      url: a.url,
      disease,
      year: a.year,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'title,disease' });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanPubMedAbstract(abstract: string): string {
  return abstract
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
}

async function fetchPubMed(query: string): Promise<RawArticle[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  const apiKey = NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : '';

  try {
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + ' AND Ayurveda')}&retmax=15&sort=relevance&retmode=json${apiKey}`;
    const searchRes = await withTimeout(fetch(searchUrl), 15_000);
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const ids: string[] = searchData.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    await delay(350);

    const summaryUrl = `${baseUrl}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json${apiKey}`;
    const summaryRes = await withTimeout(fetch(summaryUrl), 15_000);
    if (!summaryRes.ok) return [];
    const summaryData = await summaryRes.json();

    const results: RawArticle[] = [];
    for (const id of ids) {
      const doc = summaryData.result?.[id];
      if (!doc) continue;
      const title = doc.title ?? '';
      if (!title) continue;
      results.push({
        title,
        abstract: '',
        source: 'pubmed',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        year: doc.pubdate ? parseInt(doc.pubdate.split(' ')[0]) : null,
      });
    }

    if (ids.length > 0) {
      await delay(350);
      const abstractUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml${apiKey}`;
      const abstractRes = await withTimeout(fetch(abstractUrl), 15_000);
      if (abstractRes.ok) {
        const xml = await abstractRes.text();
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const artResult = xml.split(`<PMID Version="5">${id}</PMID>`)[1];
          if (!artResult) continue;
          const absMatch = artResult.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/i);
          if (absMatch && results[i]) {
            results[i].abstract = cleanPubMedAbstract(absMatch[1].replace(/<[^>]+>/g, ' '));
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('PubMed fetch error:', e);
    return [];
  }
}

async function fetchOpenAlex(query: string): Promise<RawArticle[]> {
  try {
    const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=title_and_abstract.search:${encodeURIComponent(query)},default.search:Ayurveda&sort=relevance_score:desc&per_page=15`;
    const res = await withTimeout(fetch(searchUrl, {
      headers: { 'User-Agent': 'AyurScribe/1.0 (mailto:research@ayurscribe.app)' },
    }), 15_000);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? []).map((work: any) => ({
      title: work.title ?? '',
      abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : '',
      source: 'openalex' as const,
      url: work.id ?? work.doi ?? '',
      year: work.publication_year ?? null,
    })).filter((a: RawArticle) => a.title);
  } catch (e) {
    console.error('OpenAlex fetch error:', e);
    return [];
  }
}

function reconstructAbstract(index: Record<string, number[]>): string {
  if (!index) return '';
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(w => w[1]).join(' ').slice(0, 2000);
}

async function fetchSerpAPIScholar(query: string): Promise<RawArticle[]> {
  if (!SERPAPI_KEY) return [];
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query + ' Ayurveda')}&engine=google_scholar&num=10&api_key=${SERPAPI_KEY}`;
    const res = await withTimeout(fetch(url), 15_000);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.organic_results ?? []).slice(0, 10).map((r: any) => ({
      title: r.title ?? '',
      abstract: r.snippet ?? '',
      source: 'scholar' as const,
      url: r.link ?? '',
      year: r.publication_info?.summary?.match(/\d{4}/)?.[0] ? parseInt(r.publication_info.summary.match(/\d{4}/)[0]) : null,
    })).filter((a: RawArticle) => a.title);
  } catch (e) {
    console.error('SerpAPI fetch error:', e);
    return [];
  }
}

function dedupArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchResearchArticles(
  disease: string,
  opts: { skipSerpAPI?: boolean } = {}
): Promise<ResearchArticle[]> {
  const cached = await checkCache(disease);
  if (cached && cached.length > 0) return cached;

  const queries = [
    disease,
    `${disease} Ayurveda treatment`,
  ];

  const allArticles: RawArticle[] = [];

  const results = await Promise.allSettled([
    ...queries.flatMap(q => [
      fetchPubMed(q),
      fetchOpenAlex(q),
    ]),
    ...(opts.skipSerpAPI ? [] : queries.map(q => fetchSerpAPIScholar(q))),
  ]);

  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      allArticles.push(...r.value);
    }
  }

  const deduped = dedupArticles(allArticles).slice(0, 30);
  const mapped: ResearchArticle[] = deduped.map((a, i) => ({
    id: `research_${Date.now()}_${i}`,
    title: a.title,
    abstract: a.abstract || null,
    source: a.source as 'pubmed' | 'openalex' | 'scholar',
    url: a.url,
    disease,
    year: a.year,
    fetched_at: new Date().toISOString(),
  }));

  await cacheArticles(disease, deduped);
  return mapped;
}