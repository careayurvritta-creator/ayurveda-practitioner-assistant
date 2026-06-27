-- ============================================================
-- AyurScribe RAG Schema — Migration 0003
-- ============================================================
-- Extensions

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================================
-- 1. Documents (source provenance)
--任一本古籍、研究PDF、或WHO术语集都作为document记录
-- ============================================================

CREATE TABLE IF NOT EXISTS public文档 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  标题            TEXT NOT NULL,
  来源            TEXT NOT NULL,          -- e.g. 'Charaka Samhita', 'PubMed', 'WHO'
  来源URL         TEXT,
  分类            TEXT NOT NULL CHECK (分类 IN (
                    'classical_text', 'modern_research', 'who_terminology',
                    'clinical_protocol', 'drug_interaction', 'user_generated'
                  )),
  语言            TEXT DEFAULT 'en',       -- en, sa, hi
  创建时间        TIMESTAMPTZ DEFAULT now(),
  更新时间        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_document_category ON 文档(分类);
CREATE INDEX ix_document_language ON 文档(语言);

-- ============================================================
-- 2. Document Sections (logical parts within a document)
-- ============================================================

CREATE TABLE IF NOT EXISTS public文档_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id          UUID NOT NULL REFERENCES 文档(id) ON DELETE CASCADE,
  标题            TEXT NOT NULL,
  开始位置        INTEGER,
  结束位置        INTEGER,
  创建时间        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_section_doc ON 文档_sections(doc_id);

-- ============================================================
-- 3. Chunks (text + embedding for RAG)
-- ============================================================

CREATE TABLE IF NOT EXISTS public文本块 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID REFERENCES 文档_sections(id) ON DELETE CASCADE,
  doc_id          UUID NOT NULL REFERENCES 文档(id) ON DELETE CASCADE,
  内容            TEXT NOT NULL,
  嵌入向量        VECTOR(1024),             -- Minimax M3 dim=1024
  字符数          INTEGER,
  来源行号        INTEGER,                 -- exact trace to source line/file
  来源文件        TEXT,
  创建时间        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_chunk_doc ON 文本块(doc_id);
CREATE INDEX ix_chunk_section ON 文本块(section_id);

-- ivfflat index for fast vector search (maintain a 1024-dim index)
CREATE INDEX IF NOT EXISTS ix_chunk_embedding ON 文本块
  USING ivfflat (嵌入向量 vector_cosine_ops)
  WITH (lists = 100);

-- GIN trigram for fallback text search
CREATE INDEX IF NOT EXISTS ix_chunk_trgm ON 文本块
  USING gin (内容 gin_trgm_ops);

-- =========================================================嘴里含住
-- 4. WHO Terms (structured terminology reference)
-- ============================================================

CREATE TABLE IF NOT EXISTS public who_术语 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  英文术语        TEXT NOT NULL,
  梵语术语        TEXT,
  定义            TEXT NOT NULL,
  ita_code        TEXT NOT NULL UNIQUE,     -- e.g. ITA-2.1.1
  分类            TEXT NOT NULL,            -- Background, Core, Anatomical, etc.
  嵌入向量        VECTOR(1024),
  创建时间        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ix_who_terms_ita ON who_术语(ita_code);
CREATE INDEX ix_who_terms_cat ON who_术语(分类);

-- ============================================================
-- 5. Research Articles (caching live search results)
-- ============================================================

CREATE TABLE IF NOT EXISTS public研究文章 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doi             TEXT,
  标题            TEXT NOT NULL,
  摘要            TEXT,
  来源            TEXT NOT NULL,            -- e.g. 'PubMed', 'dhara.ayush.gov.in'
  来源URL         TEXT,
  疾病            TEXT[],                   -- disease tags for quick lookup
  草药            TEXT[],                   -- herbs mentioned
  获取时间        TIMESTAMPTZ DEFAULT now(),
  嵌入向量        VECTOR(1024)
);

CREATE INDEX ix_research_disease ON 研究文章 USING gin(疾病);
CREATE INDEX ix_research_herb ON 研究文章 USING gin(草药);
CREATE INDEX ix_research_fetched ON 研究文章(获取时间);

-- ============================================================
-- 6. Treatment Plans (learned from accepted doctor protocols)
-- ============================================================

CREATE TABLE IF NOT EXISTS public治疗计划 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  病人年龄        INTEGER,
  病人性别        TEXT,
  体质类型        TEXT,                     -- prakriti
  诊断            TEXT NOT NULL,
  协议JSON        JSONB NOT NULL,           -- full structured protocol
  疗效描述        TEXT,                     -- outcome notes
  疗效评分        INTEGER CHECK (疗效评分 BETWEEN 1 AND 10),
  病人反馈        TEXT,
  被采纳          BOOLEAN DEFAULT false,    -- doctor explicitly accepts it
  创建时间        TIMESTAMPTZ DEFAULT now(),
  嵌入向量        VECTOR(1024)
);

CREATE INDEX ix_plan_doctor ON 治疗计划(doctor_id);
CREATE INDEX ix_plan_diag ON 治疗计划 USING gin(to_tsvector('english', 诊断));

-- ============================================================
-- 7. Hybrid Search Function (combines vector + text)
-- ============================================================

CREATE OR REPLACE FUNCTION public.hybrid_search(
  query_text TEXT,
  query_embedding VECTOR(1024),
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  content TEXT,
  doc_title TEXT,
  distance NUMERIC,
  rank INTEGER
) AS $$
DECLARE
  vector_limit INTEGER := GREATEST(max_results * 2, 20);
  text_limit INTEGER := GREATEST(max_results * 2, 20);
BEGIN
  RETURN QUERY
  WITH
    -- Vector similarity results
    vec_results AS (
      SELECT
        c.id AS c_id,
        c.内容 AS c_content,
        d.标题 AS d_title,
        1 - (c.嵌入向量 <=> query_embedding) AS vec_score
      FROM public文本块 c
      JOIN public文档 d ON c.doc_id = d.id
      ORDER BY c.嵌入向量 <=> query_embedding
      LIMIT vector_limit
    ),
    -- Full-text search results
    txt_results AS (
      SELECT
        c.id AS c_id,
        c.内容 AS c_content,
        d.标题 AS d_title,
        ts_rank(to_tsvector('english', c.内容), plainto_tsquery('english', query_text)) AS txt_score
      FROM public文本块 c
      JOIN public文档 d ON c.doc_id = d.id
      WHERE to_tsvector('english', c.内容) @@ plainto_tsquery('english', query_text)
      ORDER BY txt_score DESC
      LIMIT text_limit
    ),
    -- Deduplicate and score
    combined AS (
      SELECT c_id, c_content, d_title,
             COALESCE(v.vec_score, 0) * 0.7 + COALESCE(t.txt_score, 0) * 0.3 AS final_score
      FROM vec_results v
      FULL OUTER JOIN txt_results t ON v.c_id = t.c_id
    )
  SELECT
    c.c_id::UUID,
    c.c_content,
    c.d_title,
    c.final_score::NUMERIC,
    ROW_NUMBER() OVER (ORDER BY c.final_score DESC)::INT AS rank
  FROM combined c
  ORDER BY c.final_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. RLS Policies
-- ============================================================

-- Documents: everyone can read (public knowledge base)
ALTER TABLE public文档 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc: read all" ON public文档 FOR SELECT USING (true);

ALTER TABLE public文档_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "section: read all" ON public文档_sections FOR SELECT USING (true);

ALTER TABLE public文本块 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunk: read all" ON public文本块 FOR SELECT USING (true);

-- WHO Terms: everyone can read
ALTER TABLE public who_术语 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "who: read all" ON public who_术语 FOR SELECT USING (true);

-- Research Articles: everyone can read (shared knowledge)
ALTER TABLE public研究文章 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research: read all" ON public研究文章 FOR SELECT USING (true);

-- Treatment Plans: scoped to doctor (owner_id = doctor_id)
ALTER TABLE public治疗计划 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan: select own" ON public治疗计划 FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "plan: insert own" ON public治疗计划 FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "plan: update own" ON public治疗计划 FOR UPDATE USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "plan: delete own" ON public治疗计划 FOR DELETE USING (doctor_id = auth.uid());

COMMENT ON TABLE public文档 IS 'Source provenance for every piece of knowledge in the RAG system';
COMMENT ON TABLE public文本块 IS 'Text chunks with Minimax M3 embeddings for semantic search';
COMMENT ON TABLE public研究文章 IS 'Cached results from live web research (PubMed, AYUSH journals, etc.)';
COMMENT ON TABLE public治疗计划 IS 'Accepted treatment protocols for in-context plan learning (a + c)';
