import os
import time
from app.search.keyword_search import keyword_search
from app.search.vector_search import vector_search
from app.search.hybrid_search import hybrid_search

def normalize_path(path: str) -> str:
    """Normalizes file path for comparison."""
    if not path:
        return ""
    return path.replace('\\', '/').lower().strip('/')

def is_path_match(retrieved_path: str, expected_path: str) -> bool:
    """Returns True if the retrieved path and expected path refer to the same file."""
    r = normalize_path(retrieved_path)
    e = normalize_path(expected_path)
    if not r or not e:
        return False
    return r == e or r.endswith(e) or e.endswith(r)

def run_evaluation(repo_id: str, test_cases: list[dict], k: int = 5) -> dict:
    """
    Runs retrieval evaluation across keyword, vector, and hybrid search methods.
    Calculates Recall@k and Mean Reciprocal Rank (MRR) for each method.
    """
    methods = {
        "keyword_only": keyword_search,
        "vector_only": vector_search,
        "hybrid": hybrid_search
    }

    results = {
        "keyword_only": {"recall_at_k": 0.0, "mrr": 0.0, "per_query_results": []},
        "vector_only": {"recall_at_k": 0.0, "mrr": 0.0, "per_query_results": []},
        "hybrid": {"recall_at_k": 0.0, "mrr": 0.0, "per_query_results": []}
    }

    total_cases = len(test_cases)
    if total_cases == 0:
        return results

    for case in test_cases:
        query = case["query"]
        expected = case["expected_file_path"]

        # Run each search method independently
        for method_name, search_fn in methods.items():
            try:
                # Query enough candidates to check top-k
                raw_results = search_fn(repo_id=repo_id, query=query, top_k=max(k, 10))
                # Slice to top-k
                top_k_results = raw_results[:k]
            except Exception as e:
                print(f"[EVAL RUNNER] Error executing {method_name} for query '{query}': {e}")
                top_k_results = []

            # Check if expected file path is retrieved in top-k
            hit = False
            rank = None
            for idx, res in enumerate(top_k_results):
                file_path = res.get("file_path", "")
                if is_path_match(file_path, expected):
                    hit = True
                    rank = idx + 1
                    break

            results[method_name]["per_query_results"].append({
                "query": query,
                "expected_file_path": expected,
                "hit": hit,
                "rank": rank,
                "notes": case.get("notes", "")
            })

    # Compute aggregate metrics (Recall@k and MRR)
    for method_name in results:
        hits = 0
        reciprocal_ranks = []
        for q_res in results[method_name]["per_query_results"]:
            if q_res["hit"]:
                hits += 1
                reciprocal_ranks.append(1.0 / q_res["rank"])
            else:
                reciprocal_ranks.append(0.0)

        recall = hits / total_cases if total_cases > 0 else 0.0
        mrr = sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0.0

        results[method_name]["recall_at_k"] = round(recall, 4)
        results[method_name]["mrr"] = round(mrr, 4)

    return results

def generate_markdown_report(results: dict, k: int = 5) -> str:
    """
    Generates a clean Markdown report comparing keyword, vector, and hybrid search methods.
    Identifies specific queries where hybrid outperformed individual methods.
    """
    report = []
    report.append("# Retrieval Evaluation Results")
    report.append(f"\nThis report evaluates and compares retrieval quality across keyword-only, vector-only, and hybrid search methods using a curated dataset of test cases against the DevLens-AI repository. Recall@{k} and Mean Reciprocal Rank (MRR) are computed to quantify retrieval performance.")

    # Table comparing methods
    report.append("\n## Retrieval Performance Comparison")
    report.append("\n| Search Method | Recall@{} | Mean Reciprocal Rank (MRR) |".format(k))
    report.append("| --- | --- | --- |")
    for method in ["keyword_only", "vector_only", "hybrid"]:
        name = method.replace("_", " ").title()
        recall = results[method]["recall_at_k"]
        mrr = results[method]["mrr"]
        report.append(f"| **{name}** | {recall:.4f} | {mrr:.4f} |")

    # Case Studies / Comparisons
    report.append("\n## Hybrid Search Case Studies")
    report.append("\nBelow are specific example queries demonstrating how combining keyword-only (lexical) and vector-only (semantic) search signals helps improve overall retrieval quality:")

    # Find cases where hybrid outperformed keyword OR vector (or both)
    outperform_cases = []
    keyword_cases = results["keyword_only"]["per_query_results"]
    vector_cases = results["vector_only"]["per_query_results"]
    hybrid_cases = results["hybrid"]["per_query_results"]

    for i in range(len(hybrid_cases)):
        q = hybrid_cases[i]["query"]
        expected = hybrid_cases[i]["expected_file_path"]
        notes = hybrid_cases[i]["notes"]

        h_hit, h_rank = hybrid_cases[i]["hit"], hybrid_cases[i]["rank"]
        k_hit, k_rank = keyword_cases[i]["hit"], keyword_cases[i]["rank"]
        v_hit, v_rank = vector_cases[i]["hit"], vector_cases[i]["rank"]

        # Scenario 1: Hybrid hit, both keyword and vector missed
        if h_hit and not k_hit and not v_hit:
            outperform_cases.append({
                "query": q,
                "expected": expected,
                "notes": notes,
                "reason": "Hybrid search successfully retrieved the document in the top-{}, whereas both keyword-only and vector-only search missed it entirely.".format(k),
                "details": f"Hybrid Rank: {h_rank} | Keyword: Miss | Vector: Miss"
            })
        # Scenario 2: Hybrid rank is better than both
        elif h_hit and ((k_hit and h_rank < k_rank) or not k_hit) and ((v_hit and h_rank < v_rank) or not v_hit):
            outperform_cases.append({
                "query": q,
                "expected": expected,
                "notes": notes,
                "reason": "Hybrid search merged signals to produce a superior ranking compared to individual methods.",
                "details": f"Hybrid Rank: {h_rank} | Keyword Rank: {k_rank or 'Miss'} | Vector Rank: {v_rank or 'Miss'}"
            })
        # Scenario 3: Hybrid hit, one of them missed
        elif h_hit and (not k_hit or not v_hit):
            missed_method = "keyword-only" if not k_hit else "vector-only"
            outperform_cases.append({
                "query": q,
                "expected": expected,
                "notes": notes,
                "reason": f"Hybrid search successfully retrieved the target by falling back on the other working method, preventing a complete retrieval failure from the failing {missed_method} method.",
                "details": f"Hybrid Rank: {h_rank} | Keyword Rank: {k_rank or 'Miss'} | Vector Rank: {v_rank or 'Miss'}"
            })

    if outperform_cases:
        # Show top 3 case studies
        for idx, case in enumerate(outperform_cases[:4]):
            report.append(f"\n### Case Study {idx + 1}: \"{case['query']}\"")
            report.append(f"- **Expected File**: `{case['expected']}`")
            report.append(f"- **Notes**: {case['notes']}")
            report.append(f"- **Performance**: {case['details']}")
            report.append(f"- **Why Hybrid Won**: {case['reason']}")
    else:
        report.append("\n*No specific queries found where hybrid search strictly outperformed both keyword and vector search ranking in this dataset.*")

    # Raw Query Breakdown Table
    report.append("\n## Detailed Per-Query Results")
    report.append("\n| Query | Target File | Keyword Rank | Vector Rank | Hybrid Rank | Notes |")
    report.append("| --- | --- | --- | --- | --- | --- |")
    for i in range(len(hybrid_cases)):
        q = hybrid_cases[i]["query"]
        expected = hybrid_cases[i]["expected_file_path"]
        notes = hybrid_cases[i]["notes"]
        
        h_rank = hybrid_cases[i]["rank"] or "Miss"
        k_rank = keyword_cases[i]["rank"] or "Miss"
        v_rank = vector_cases[i]["rank"] or "Miss"
        
        report.append(f"| `{q}` | `{expected}` | {k_rank} | {v_rank} | {h_rank} | {notes} |")

    return "\n".join(report)

def write_evaluation_report(results: dict, k: int = 5) -> str:
    """
    Generates and writes the evaluation report to eval/EVALUATION_RESULTS.md.
    Returns the absolute path to the written file.
    """
    # Project root is 3 levels up from backend/app/search
    search_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(search_dir, "..", "..", ".."))
    
    eval_dir = os.path.join(project_root, "eval")
    os.makedirs(eval_dir, exist_ok=True)
    
    report_content = generate_markdown_report(results, k)
    report_path = os.path.join(eval_dir, "EVALUATION_RESULTS.md")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    return report_path
