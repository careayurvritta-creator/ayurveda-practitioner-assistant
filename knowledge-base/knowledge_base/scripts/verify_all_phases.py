"""
WHO ITA Knowledge Base - Comprehensive Phase Verification
==========================================================
Tests all components from Phase 1-6 implementation.
"""
import sys
import os
import json
import asyncio
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend" / "ita_api"))

# Results tracking
RESULTS = {
    "timestamp": datetime.now().isoformat(),
    "phases": {},
    "summary": {"passed": 0, "failed": 0, "total": 0}
}


def test_result(phase: str, test_name: str, passed: bool, details: str = ""):
    """Record a test result."""
    if phase not in RESULTS["phases"]:
        RESULTS["phases"][phase] = {"tests": [], "passed": 0, "failed": 0}
    
    RESULTS["phases"][phase]["tests"].append({
        "name": test_name,
        "passed": passed,
        "details": details
    })
    
    if passed:
        RESULTS["phases"][phase]["passed"] += 1
        RESULTS["summary"]["passed"] += 1
        print(f"  [PASS] {test_name}")
    else:
        RESULTS["phases"][phase]["failed"] += 1
        RESULTS["summary"]["failed"] += 1
        print(f"  [FAIL] {test_name}: {details}")
    
    RESULTS["summary"]["total"] += 1


def test_phase1_backend():
    """Test Phase 1: Backend API Foundation."""
    print("\n" + "="*60)
    print("PHASE 1: Backend API Foundation")
    print("="*60)
    
    # Test 1.1: Config import
    try:
        from app.core.config import settings
        test_result("Phase 1", "Config import", True)
    except Exception as e:
        test_result("Phase 1", "Config import", False, str(e))
        return
    
    # Test 1.2: Schema imports
    try:
        from app.models.schemas import Term, TermSummary, Chapter, AutocompleteItem
        test_result("Phase 1", "Pydantic schemas", True)
    except Exception as e:
        test_result("Phase 1", "Pydantic schemas", False, str(e))
    
    # Test 1.3: Service import
    try:
        from app.services.ita_service import ITAKnowledgeBaseService
        test_result("Phase 1", "Service import", True)
    except Exception as e:
        test_result("Phase 1", "Service import", False, str(e))
        return
    
    # Test 1.4: Service initialization and loading
    try:
        service = ITAKnowledgeBaseService()
        # Need to call load() to initialize the service
        if not service.is_loaded:
            service.load()
        term_count = service.term_count
        test_result("Phase 1", f"Service init ({term_count} terms)", term_count > 3000)
    except Exception as e:
        test_result("Phase 1", "Service initialization", False, str(e))
        return
    
    # Test 1.5: Term lookup
    try:
        term = service.lookup("ITA-1.1.1")
        has_english = term is not None and hasattr(term, 'english')
        english_val = term.english if term else 'N/A'
        test_result("Phase 1", f"Term lookup ITA-1.1.1 ({english_val})", has_english)
    except Exception as e:
        test_result("Phase 1", "Term lookup", False, str(e))
    
    # Test 1.6: Search (returns tuple: results, total)
    try:
        results, total = service.search("vata", limit=5)
        has_results = len(results) > 0
        test_result("Phase 1", f"Search 'vata' ({len(results)} results)", has_results)
    except Exception as e:
        test_result("Phase 1", "Search", False, str(e))
    
    # Test 1.7: Autocomplete
    try:
        suggestions = service.autocomplete("ayu", limit=5)
        has_suggestions = len(suggestions) > 0
        test_result("Phase 1", f"Autocomplete 'ayu' ({len(suggestions)} suggestions)", has_suggestions)
    except Exception as e:
        test_result("Phase 1", "Autocomplete", False, str(e))
    
    # Test 1.8: Chapters
    try:
        chapters = service.get_chapters()
        has_chapters = len(chapters) >= 10
        test_result("Phase 1", f"Chapters ({len(chapters)} chapters)", has_chapters)
    except Exception as e:
        test_result("Phase 1", "Chapters", False, str(e))
    
    # Test 1.9: Routes import
    try:
        from app.routes.ita_routes import router
        test_result("Phase 1", "Routes import", True)
    except Exception as e:
        test_result("Phase 1", "Routes import", False, str(e))
    
    # Test 1.10: Main app import
    try:
        from app.main import app
        test_result("Phase 1", "FastAPI app", True)
    except Exception as e:
        test_result("Phase 1", "FastAPI app", False, str(e))


def test_phase2_testing():
    """Test Phase 2: Testing Infrastructure."""
    print("\n" + "="*60)
    print("PHASE 2: Testing & Quality")
    print("="*60)
    
    # Test 2.1: pytest.ini exists
    pytest_ini = Path("backend/ita_api/pytest.ini")
    test_result("Phase 2", "pytest.ini exists", pytest_ini.exists())
    
    # Test 2.2: conftest.py exists
    conftest = Path("backend/ita_api/tests/conftest.py")
    test_result("Phase 2", "conftest.py exists", conftest.exists())
    
    # Test 2.3: Service tests exist
    service_tests = Path("backend/ita_api/tests/test_service.py")
    test_result("Phase 2", "test_service.py exists", service_tests.exists())
    
    # Test 2.4: API tests exist
    api_tests = Path("backend/ita_api/tests/test_api.py")
    test_result("Phase 2", "test_api.py exists", api_tests.exists())
    
    # Test 2.5: Performance tests exist
    perf_tests = Path("backend/ita_api/tests/test_performance.py")
    test_result("Phase 2", "test_performance.py exists", perf_tests.exists())


def test_phase3_database():
    """Test Phase 3: Database & Caching."""
    print("\n" + "="*60)
    print("PHASE 3: Database & Caching Layer")
    print("="*60)
    
    # Test 3.1: Models import
    try:
        from app.db.models import Base, ITATerm, ITAChapter, ITAGraphEdge
        tables = list(Base.metadata.tables.keys())
        test_result("Phase 3", f"DB Models ({len(tables)} tables)", len(tables) >= 5)
    except Exception as e:
        test_result("Phase 3", "DB Models import", False, str(e))
    
    # Test 3.2: Session management
    try:
        from app.db.session import get_async_session, get_database_url
        url = get_database_url()
        test_result("Phase 3", f"Session management", True)
    except Exception as e:
        test_result("Phase 3", "Session management", False, str(e))
    
    # Test 3.3: Repository pattern
    try:
        from app.db.repository import ITATermRepository, ITAChapterRepository
        test_result("Phase 3", "Repository pattern", True)
    except Exception as e:
        test_result("Phase 3", "Repository pattern", False, str(e))
    
    # Test 3.4: Redis cache
    try:
        from app.cache.redis_cache import ITACacheService, InMemoryCache
        cache = InMemoryCache()
        test_result("Phase 3", "Cache service", True)
    except Exception as e:
        test_result("Phase 3", "Cache service", False, str(e))
    
    # Test 3.5: Search engine
    try:
        from app.search.search_engine import ITASearchService, FallbackSearchEngine
        test_result("Phase 3", "Search engine", True)
    except Exception as e:
        test_result("Phase 3", "Search engine", False, str(e))
    
    # Test 3.6: Vector search
    try:
        from app.search.vector_search import ITAVectorService, InMemoryVectorStore
        test_result("Phase 3", "Vector search", True)
    except Exception as e:
        test_result("Phase 3", "Vector search", False, str(e))
    
    # Test 3.7: Backup utilities
    try:
        from app.db.backup import ITABackupService
        test_result("Phase 3", "Backup service", True)
    except Exception as e:
        test_result("Phase 3", "Backup service", False, str(e))
    
    # Test 3.8: Alembic config
    alembic_ini = Path("backend/ita_api/alembic.ini")
    alembic_env = Path("backend/ita_api/alembic/env.py")
    test_result("Phase 3", "Alembic migration", alembic_ini.exists() and alembic_env.exists())


def test_phase4_frontend_hooks():
    """Test Phase 4: Frontend Hooks."""
    print("\n" + "="*60)
    print("PHASE 4: Frontend Hooks & State Management")
    print("="*60)
    
    base = Path("frontend/src/features/ita")
    
    # Test 4.1: Types
    types_file = base / "types" / "index.ts"
    test_result("Phase 4", "TypeScript types", types_file.exists())
    
    # Test 4.2: API Client
    api_client = base / "utils" / "apiClient.ts"
    test_result("Phase 4", "API Client", api_client.exists())
    
    # Test 4.3: Query hooks
    query_hooks = base / "hooks" / "useITAQueries.ts"
    test_result("Phase 4", "React Query hooks", query_hooks.exists())
    
    # Test 4.4: Utility hooks
    util_hooks = base / "hooks" / "useITAUtils.ts"
    test_result("Phase 4", "Utility hooks", util_hooks.exists())
    
    # Test 4.5: Context provider
    context = base / "context" / "ITAContext.tsx"
    test_result("Phase 4", "Context provider", context.exists())
    
    # Test 4.6: Test utilities
    test_utils = base / "utils" / "testUtils.ts"
    test_result("Phase 4", "Test utilities", test_utils.exists())
    
    # Test 4.7: Hooks index
    hooks_index = base / "hooks" / "index.ts"
    test_result("Phase 4", "Hooks index export", hooks_index.exists())
    
    # Test 4.8: Main index
    main_index = base / "index.ts"
    test_result("Phase 4", "Feature module index", main_index.exists())


def test_phase5_components():
    """Test Phase 5: UI Components."""
    print("\n" + "="*60)
    print("PHASE 5: UI Component Library")
    print("="*60)
    
    base = Path("frontend/src/features/ita")
    
    # Test 5.1: CSS Design System
    css = base / "styles" / "ita.css"
    if css.exists():
        css_lines = len(css.read_text(encoding='utf-8').splitlines())
        test_result("Phase 5", f"CSS Design System ({css_lines} lines)", css_lines > 300)
    else:
        test_result("Phase 5", "CSS Design System", False, "File not found")
    
    # Test 5.2: Term Card
    term_card = base / "components" / "ITATermCard.tsx"
    test_result("Phase 5", "ITATermCard component", term_card.exists())
    
    # Test 5.3: Search components
    search = base / "components" / "ITASearch.tsx"
    test_result("Phase 5", "ITASearch components", search.exists())
    
    # Test 5.4: Chapter navigation
    chapter_nav = base / "components" / "ITAChapterNav.tsx"
    test_result("Phase 5", "ITAChapterNav", chapter_nav.exists())
    
    # Test 5.5: Term panel
    term_panel = base / "components" / "ITATermPanel.tsx"
    test_result("Phase 5", "ITATermPanel", term_panel.exists())
    
    # Test 5.6: Error boundary
    error_boundary = base / "components" / "ITAErrorBoundary.tsx"
    test_result("Phase 5", "ITAErrorBoundary", error_boundary.exists())
    
    # Test 5.7: Components index
    comp_index = base / "components" / "index.ts"
    test_result("Phase 5", "Components index", comp_index.exists())


def test_phase6_ai():
    """Test Phase 6: AI Integration."""
    print("\n" + "="*60)
    print("PHASE 6: Gemini AI Integration")
    print("="*60)
    
    # Test 6.1: System prompts
    try:
        from app.ai.prompts.system_prompts import build_system_prompt, ITA_SYSTEM_PROMPT_BASE
        prompt = build_system_prompt("general")
        has_content = len(prompt) > 500
        test_result("Phase 6", f"System prompts ({len(prompt)} chars)", has_content)
    except Exception as e:
        test_result("Phase 6", "System prompts", False, str(e))
    
    # Test 6.2: RAG Pipeline class
    try:
        from app.ai.rag.pipeline import ITARAGPipeline, ContextManager
        test_result("Phase 6", "RAG Pipeline import", True)
    except Exception as e:
        test_result("Phase 6", "RAG Pipeline import", False, str(e))
    
    # Test 6.3: Function definitions
    try:
        from app.ai.functions.definitions import ITA_FUNCTION_DEFINITIONS, get_gemini_tools
        func_count = len(ITA_FUNCTION_DEFINITIONS)
        test_result("Phase 6", f"Function definitions ({func_count} functions)", func_count >= 8)
    except Exception as e:
        test_result("Phase 6", "Function definitions", False, str(e))
    
    # Test 6.4: Gemini service
    try:
        from app.ai.gemini_service import ITAGeminiService
        test_result("Phase 6", "Gemini service class", True)
    except Exception as e:
        test_result("Phase 6", "Gemini service class", False, str(e))
    
    # Test 6.5: AI routes
    try:
        from app.routes.ai_routes import router
        test_result("Phase 6", "AI API routes", True)
    except Exception as e:
        test_result("Phase 6", "AI API routes", False, str(e))
    
    # Test 6.6: RAG initialization
    try:
        async def test_rag():
            from app.ai.rag.pipeline import get_rag_pipeline
            rag = await get_rag_pipeline()
            return len(rag._terms)
        
        term_count = asyncio.run(test_rag())
        test_result("Phase 6", f"RAG initialization ({term_count} terms indexed)", term_count > 3000)
    except Exception as e:
        test_result("Phase 6", "RAG initialization", False, str(e))
    
    # Test 6.7: RAG retrieval
    try:
        async def test_retrieve():
            from app.ai.rag.pipeline import get_rag_pipeline
            rag = await get_rag_pipeline()
            results = await rag.retrieve("dosha vata", max_results=5)
            return len(results)
        
        result_count = asyncio.run(test_retrieve())
        test_result("Phase 6", f"RAG retrieval ({result_count} results)", result_count > 0)
    except Exception as e:
        test_result("Phase 6", "RAG retrieval", False, str(e))


def print_summary():
    """Print test summary."""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = RESULTS["summary"]["passed"]
    failed = RESULTS["summary"]["failed"]
    total = RESULTS["summary"]["total"]
    
    print(f"\nTotal: {total} tests")
    print(f"[PASS] Passed: {passed}")
    print(f"[FAIL] Failed: {failed}")
    print(f"Success Rate: {passed/total*100:.1f}%\n")
    
    # Per-phase summary
    for phase, data in RESULTS["phases"].items():
        status = "[OK]" if data["failed"] == 0 else "[!!]"
        print(f"{status} {phase}: {data['passed']}/{data['passed'] + data['failed']} passed")
    
    return failed == 0


def save_results():
    """Save results to JSON file."""
    report_dir = Path("knowledge_base/validation_reports")
    report_dir.mkdir(parents=True, exist_ok=True)
    
    report_path = report_dir / "phase_verification_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(RESULTS, f, indent=2, ensure_ascii=False)
    
    print(f"\nResults saved to: {report_path}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("WHO ITA KNOWLEDGE BASE - PHASE VERIFICATION")
    print("Testing Phases 1-6 Implementation")
    print("="*60)
    
    # Change to project root
    os.chdir(Path(__file__).parent.parent.parent)
    
    # Run all phase tests
    test_phase1_backend()
    test_phase2_testing()
    test_phase3_database()
    test_phase4_frontend_hooks()
    test_phase5_components()
    test_phase6_ai()
    
    # Print and save results
    all_passed = print_summary()
    save_results()
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)
