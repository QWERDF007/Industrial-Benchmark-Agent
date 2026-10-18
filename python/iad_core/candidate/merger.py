import os
import json
import logging
from typing import Optional, List, Dict, Any, Set

from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.candidate.miner import mine_candidates

logger = logging.getLogger("iad_core.candidate.merger")


def merge_candidates(
    task_id: str,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
    include_dino: bool = True,
    include_llm: bool = True,
    include_audit: bool = True,
) -> Dict[str, Any]:
    """
    Merge candidate samples from multiple independent discovery channels (S09, RP-17):
      - DINO feature mining (candidate_mine 4-signal)
      - Multimodal LLM active suggestions (AuditSuggestionRepository)
      - Deterministic audit issues (import_issues)
    Deduplicates strictly by sample_id, keeping complete provenance and source breakdown.
    Does NOT mutate Sample.quality_status or ReviewDecisionRecord.
    """
    db = Database(db_path)
    sample_repo = SampleRepository(db)
    sug_repo = AuditSuggestionRepository(db)

    out_dir = output_dir or os.path.join("runs", "candidates", task_id)
    os.makedirs(out_dir, exist_ok=True)

    dino_candidates: Dict[str, float] = {}
    if include_dino:
        cand_json = os.path.join(out_dir, "candidates.json")
        if os.path.exists(cand_json):
            try:
                with open(cand_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data.get("candidates", []):
                        s_id = item.get("sample_id")
                        if s_id:
                            dino_candidates[s_id] = item.get("final_score", 0.0)
            except Exception as e:
                logger.warning(f"Failed to read existing candidates.json: {e}")
        else:
            try:
                mine_res = mine_candidates(task_id, top_k=200, db_path=db_path, output_dir=out_dir)
                for item in mine_res.candidates:
                    dino_candidates[item.sample_id] = item.final_score
            except Exception as e:
                logger.warning(f"mine_candidates invocation in merger skipped: {e}")

    llm_suggestions: Dict[str, List[Dict[str, Any]]] = {}
    if include_llm:
        sugs = sug_repo.list_by_task(task_id)
        for s in sugs:
            if s.sample_id and s.recommended_action.value in ("REVIEW", "RECHECK"):
                llm_suggestions.setdefault(s.sample_id, []).append({
                    "suggestion_id": s.suggestion_id,
                    "action": s.recommended_action.value,
                    "conclusion": s.conclusion_status.value,
                    "model_route": s.model_route,
                })

    audit_issues: Dict[str, List[str]] = {}
    if include_audit:
        with db.connection() as conn:
            c = conn.cursor()
            c.execute(
                """
                SELECT sample_id, issue_type FROM import_issues
                WHERE task_id = ? AND sample_id IS NOT NULL AND sample_id != ''
                """,
                (task_id,),
            )
            for r in c.fetchall():
                audit_issues.setdefault(r["sample_id"], []).append(r["issue_type"])

    all_sample_ids: Set[str] = set(dino_candidates.keys()) | set(llm_suggestions.keys()) | set(audit_issues.keys())

    merged_items = []
    dino_only_count = 0
    llm_only_count = 0
    audit_only_count = 0
    both_dino_llm_count = 0

    for s_id in sorted(all_sample_ids):
        sources = []
        if s_id in dino_candidates:
            sources.append("DINO")
        if s_id in llm_suggestions:
            sources.append("LLM")
        if s_id in audit_issues:
            sources.append("AUDIT")

        if sources == ["DINO"]:
            dino_only_count += 1
            priority_reason = f"DINO anomaly score {dino_candidates.get(s_id, 0.0):.4f}"
        elif sources == ["LLM"]:
            llm_only_count += 1
            sug_actions = [x["action"] for x in llm_suggestions.get(s_id, [])]
            priority_reason = f"Multimodal LLM suggested {','.join(sug_actions)}"
        elif sources == ["AUDIT"]:
            audit_only_count += 1
            priority_reason = f"Data audit issue {','.join(audit_issues.get(s_id, []))}"
        elif "DINO" in sources and "LLM" in sources:
            both_dino_llm_count += 1
            priority_reason = f"High priority consensus: DINO ({dino_candidates.get(s_id, 0.0):.4f}) + LLM advice"
        else:
            priority_reason = f"Multi-source: {', '.join(sources)}"

        sample_obj = sample_repo.get(s_id)
        rel_path = sample_obj.relative_path if sample_obj else "unknown"
        q_status = sample_obj.quality_status.value if (sample_obj and hasattr(sample_obj.quality_status, "value")) else "UNKNOWN"

        merged_items.append({
            "sample_id": s_id,
            "relative_path": rel_path,
            "quality_status": q_status,
            "sources": sources,
            "dino_score": dino_candidates.get(s_id),
            "llm_suggestions": llm_suggestions.get(s_id, []),
            "audit_issues": audit_issues.get(s_id, []),
            "priority_reason": priority_reason,
        })

    def sort_key(item):
        is_multi = len(item["sources"]) > 1
        has_llm = "LLM" in item["sources"]
        score = item["dino_score"] or 0.0
        return (1 if is_multi else 0, 1 if has_llm else 0, score)

    merged_items.sort(key=sort_key, reverse=True)

    json_path = os.path.join(out_dir, "merged_candidates.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "task_id": task_id,
                "total_unique_candidates": len(merged_items),
                "breakdown": {
                    "dino_only": dino_only_count,
                    "llm_only": llm_only_count,
                    "audit_only": audit_only_count,
                    "both_dino_llm": both_dino_llm_count,
                },
                "candidates": merged_items,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    md_path = os.path.join(out_dir, "merged_candidates.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# Multi-Source Candidate Merge Report: {task_id}\n\n")
        f.write(f"- Total unique candidates: **{len(merged_items)}**\n")
        f.write(f"- DINO only: **{dino_only_count}**\n")
        f.write(f"- LLM only: **{llm_only_count}**\n")
        f.write(f"- Audit issue only: **{audit_only_count}**\n")
        f.write(f"- Both DINO & LLM: **{both_dino_llm_count}**\n\n")
        f.write("## Top Merged Candidates\n\n")
        f.write("| Sample ID | Sources | Relative Path | Reason |\n")
        f.write("|---|---|---|---|\n")
        for item in merged_items[:30]:
            f.write(f"| `{item['sample_id']}` | {', '.join(item['sources'])} | `{item['relative_path']}` | {item['priority_reason']} |\n")

    return {
        "task_id": task_id,
        "total_unique_candidates": len(merged_items),
        "breakdown": {
            "dino_only": dino_only_count,
            "llm_only": llm_only_count,
            "audit_only": audit_only_count,
            "both_dino_llm": both_dino_llm_count,
        },
        "json_path": json_path,
        "md_path": md_path,
        "candidates": merged_items,
    }
