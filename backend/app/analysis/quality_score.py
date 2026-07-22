import re
from datetime import datetime, timezone
from app.db import supabase
from app.search.chunker import is_excluded_file, detect_language

# Lightweight complexity proxy keyword & operator regex
# Note: This is a simplified heuristic proxy for complexity (counting branching keywords/operators),
# not a full AST cyclomatic complexity calculation. A proper AST-based version could replace it later if needed.
COMPLEXITY_PATTERN = re.compile(
    r'\b(if|else|for|while|case|switch|catch|except|and|or)\b|&&|\|\|', 
    re.IGNORECASE
)

def compute_file_complexity(content: str, language: str = "") -> int:
    """
    Computes a lightweight complexity proxy score for a file content by counting
    branching keywords and logical operators.
    """
    if not content:
        return 0
        
    matches = COMPLEXITY_PATTERN.findall(content)
    return len(matches)


def _compute_percentile_health_scores(file_data_list: list[dict]) -> list[dict]:
    """
    Normalizes churn, size (LOC), and complexity relative to the repository's file distribution
    using percentile ranks.
    
    Returns a list of dicts with calculated scores on a 0-100 scale:
    Where 100 = Best Health / Low Risk, and 0 = Worst Health / High Risk.
    """
    n = len(file_data_list)
    if n == 0:
        return []

    churns = [f["churn_count"] for f in file_data_list]
    locs = [f["loc"] for f in file_data_list]
    complexities = [f["complexity"] for f in file_data_list]

    def get_health_scores_for_metric(metric_values: list[int]) -> list[int]:
        min_v, max_v = min(metric_values), max(metric_values)
        if min_v == max_v:
            # If all files have identical values (e.g. 0 churn), all get perfect health score 100
            return [100] * n

        health_scores = []
        for v in metric_values:
            less_count = sum(1 for x in metric_values if x < v)
            equal_count = sum(1 for x in metric_values if x == v)
            # Midpoint percentile rank of risk (0 to 100)
            risk_percentile = ((less_count + 0.5 * equal_count) / n) * 100
            # Higher risk percentile means lower health score
            health = round(100.0 - risk_percentile)
            health_scores.append(max(0, min(100, health)))
        return health_scores

    churn_scores = get_health_scores_for_metric(churns)
    size_scores = get_health_scores_for_metric(locs)
    complexity_scores = get_health_scores_for_metric(complexities)

    results = []
    for i, item in enumerate(file_data_list):
        c_score = churn_scores[i]
        s_score = size_scores[i]
        cx_score = complexity_scores[i]
        comp_score = round((c_score + s_score + cx_score) / 3.0)

        results.append({
            "file_path": item["file_path"],
            "churn_count": item["churn_count"],
            "loc": item["loc"],
            "complexity": item["complexity"],
            "churn_score": c_score,
            "size_score": s_score,
            "complexity_score": cx_score,
            "composite_score": comp_score
        })

    return results


def compute_quality_score(churn_count: int, loc: int, complexity: int, repo_stats: dict = None) -> dict:
    """
    Computes component health scores and composite health score for a single file.
    If repo_stats distributions are provided, computes percentile ranks; otherwise uses default fallback.
    
    100 = Best Health (Low Risk)
    0 = Worst Health (High Risk)
    """
    if repo_stats and "churns" in repo_stats and "locs" in repo_stats and "complexities" in repo_stats:
        dummy_list = [
            {"file_path": "target", "churn_count": churn_count, "loc": loc, "complexity": complexity}
        ]
        for c, l, cx in zip(repo_stats["churns"], repo_stats["locs"], repo_stats["complexities"]):
            dummy_list.append({"file_path": "ref", "churn_count": c, "loc": l, "complexity": cx})
            
        calculated = _compute_percentile_health_scores(dummy_list)
        target_res = calculated[0]
        return {
            "churn_score": target_res["churn_score"],
            "size_score": target_res["size_score"],
            "complexity_score": target_res["complexity_score"],
            "composite_score": target_res["composite_score"]
        }
    
    # Simple direct heuristic fallback if no repo distribution context is available
    churn_score = max(0, 100 - min(100, churn_count * 5))
    size_score = max(0, 100 - min(100, int(loc / 10)))
    complexity_score = max(0, 100 - min(100, complexity * 2))
    composite_score = round((churn_score + size_score + complexity_score) / 3.0)

    return {
        "churn_score": churn_score,
        "size_score": size_score,
        "complexity_score": complexity_score,
        "composite_score": composite_score
    }


def compute_repo_quality_scores(repo_id: str, force_recompute: bool = False) -> dict:
    """
    Computes code quality scores for all non-excluded files in a repository.
    Stores and caches the results in Supabase table `quality_scores`.
    """
    if supabase is None:
        return {
            "error": "Supabase client is not initialized",
            "scores": [],
            "average_composite_score": 0,
            "needs_attention_count": 0
        }

    # 1. Check existing cached quality scores if not force_recompute
    if not force_recompute:
        try:
            cached_res = supabase.table("quality_scores").select("*").eq("repo_id", repo_id).execute()
            if cached_res.data and len(cached_res.data) > 0:
                scores = cached_res.data
                avg_composite = round(sum(s["composite_score"] for s in scores) / len(scores), 1)
                needs_attention = sum(1 for s in scores if s["composite_score"] < 60)
                sorted_scores = sorted(scores, key=lambda x: x["composite_score"])
                return {
                    "repo_id": repo_id,
                    "file_count": len(scores),
                    "average_composite_score": avg_composite,
                    "needs_attention_count": needs_attention,
                    "riskiest_files": sorted_scores[:5],
                    "scores": scores,
                    "cached": True
                }
        except Exception as e:
            print(f"[DevLens AI Warning] Could not fetch cached quality_scores: {str(e)}")

    # 2. Fetch raw file contents from `file_contents` table
    try:
        files_res = supabase.table("file_contents").select("file_path, content").eq("repo_id", repo_id).execute()
        raw_files = files_res.data or []
    except Exception as e:
        print(f"[DevLens AI Error] Failed to fetch file_contents for repo {repo_id}: {str(e)}")
        return {"error": f"Failed to fetch files from DB: {str(e)}", "scores": []}

    if not raw_files:
        return {
            "repo_id": repo_id,
            "file_count": 0,
            "average_composite_score": 100,
            "needs_attention_count": 0,
            "riskiest_files": [],
            "scores": [],
            "cached": False
        }

    # 3. Fetch hotspots churn data from `repo_analyses` table
    hotspot_churn_map = {}
    try:
        analysis_res = supabase.table("repo_analyses").select("hotspots").eq("repo_id", repo_id).execute()
        if analysis_res.data and len(analysis_res.data) > 0:
            hotspots_list = analysis_res.data[0].get("hotspots") or []
            for h in hotspots_list:
                if isinstance(h, dict) and "path" in h:
                    hotspot_churn_map[h["path"]] = h.get("commit_count", 0)
    except Exception as e:
        print(f"[DevLens AI Warning] Could not fetch repo_analyses hotspots: {str(e)}")

    # 4. Filter files and compute raw LOC and complexity
    file_data_list = []
    for item in raw_files:
        file_path = item.get("file_path", "")
        content = item.get("content", "") or ""

        # Skip excluded files (lockfiles, minified files, files > 200KB)
        if is_excluded_file(file_path, content):
            continue

        language = detect_language(file_path)
        loc = len(content.splitlines())
        complexity = compute_file_complexity(content, language)
        churn = hotspot_churn_map.get(file_path, 0)

        file_data_list.append({
            "file_path": file_path,
            "churn_count": churn,
            "loc": loc,
            "complexity": complexity
        })

    if not file_data_list:
        return {
            "repo_id": repo_id,
            "file_count": 0,
            "average_composite_score": 100,
            "needs_attention_count": 0,
            "riskiest_files": [],
            "scores": [],
            "cached": False
        }

    # 5. Normalize scores relative to repository distribution
    scored_files = _compute_percentile_health_scores(file_data_list)

    # 6. Save results to `quality_scores` table
    records_to_upsert = []
    timestamp = datetime.now(timezone.utc).isoformat()
    for item in scored_files:
        records_to_upsert.append({
            "repo_id": repo_id,
            "file_path": item["file_path"],
            "churn_score": item["churn_score"],
            "size_score": item["size_score"],
            "complexity_score": item["complexity_score"],
            "composite_score": item["composite_score"],
            "computed_at": timestamp
        })

    try:
        # Upsert in chunks of 100
        chunk_size = 100
        for i in range(0, len(records_to_upsert), chunk_size):
            chunk = records_to_upsert[i:i + chunk_size]
            supabase.table("quality_scores").upsert(chunk).execute()
        print(f"[DevLens AI] Successfully saved quality scores for {len(records_to_upsert)} files (repo_id={repo_id})")
    except Exception as e:
        print(f"[DevLens AI Error] Failed to upsert quality_scores: {str(e)}")

    avg_composite = round(sum(s["composite_score"] for s in scored_files) / len(scored_files), 1)
    needs_attention = sum(1 for s in scored_files if s["composite_score"] < 60)
    sorted_scores = sorted(scored_files, key=lambda x: x["composite_score"])

    return {
        "repo_id": repo_id,
        "file_count": len(scored_files),
        "average_composite_score": avg_composite,
        "needs_attention_count": needs_attention,
        "riskiest_files": sorted_scores[:5],
        "scores": scored_files,
        "cached": False
    }
