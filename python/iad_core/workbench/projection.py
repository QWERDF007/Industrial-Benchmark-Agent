from typing import Any, Dict, Optional


def suggestion_meta(suggestion: Any) -> Optional[Dict[str, Any]]:
    if suggestion is None:
        return None
    return {
        "suggestion_id": suggestion.suggestion_id,
        "suggested_label": suggestion.hypotheses[0].label if suggestion.hypotheses else "UNCERTAIN",
        "reason_category": suggestion.observations[0].phenomenon if suggestion.observations else "UNKNOWN",
        "model_name": suggestion.model_route,
        "notes": suggestion.observations[0].description if suggestion.observations else "",
        "confidence": suggestion.confidence,
        "reference_sample_ids": suggestion.reference_sample_ids,
        "audit_run_id": suggestion.audit_run_id,
        "analysis": suggestion.analysis.model_dump() if suggestion.analysis else None,
        "created_at": suggestion.created_at,
    }
