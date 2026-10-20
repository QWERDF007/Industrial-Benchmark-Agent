"""
End-to-end integration test with live VLM endpoint (NXM-07, NXM-14).
Tests the complete multimodal loop:
Live VLM observation -> audit_suggestion_save -> candidate_merge -> ReviewQueueService -> Human review decision.
"""

import os
import json
import base64
import urllib.request
import pytest
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image
from iad_core.workbench.vision import DEFAULT_MODEL

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample
from iad_core.storage.repositories import TaskRepository, SampleRepository
from iad_core.review.service import ReviewQueueService
from iad_core.tools.audit_tools import audit_suggestion_save
from iad_core.tools.candidate_tools import candidate_merge
from iad_core.contracts import ToolStatus

@pytest.mark.skipif(os.environ.get("IAD_RUN_LIVE_MLLM") != "1", reason="Explicit live MLLM opt-in required")
def test_live_vlm_e2e_pipeline(tmp_path):
    endpoint = os.environ["LIVE_VLM_ENDPOINT"].rstrip("/")
    api_key = os.environ["LIVE_VLM_KEY"]
    image_path = Path(os.environ["IAD_LIVE_IMAGE_PATH"]).resolve(strict=True)
    model = os.environ.get("LIVE_VLM_MODEL", DEFAULT_MODEL)
    sample_id = "live:" + image_path.name
    with Image.open(image_path) as image:
        width, height = image.size
        mime_type = Image.MIME[image.format]

    # 1. Read real image bytes and encode to base64
    with open(str(image_path), "rb") as f:
        img_bytes = f.read()
    b64_img = base64.b64encode(img_bytes).decode("utf-8")

    # 2. Query live VLM for visual defect analysis
    vlm_payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "请根据图像中实际可见的对象和结构，给出简要观察与待人工复核的疑点。"
                            "不要假定产品类型或将不可见内容当作事实。"
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}},
                ],
            }
        ],
        "max_tokens": 150,
        "temperature": 0.1,
    }

    req = urllib.request.Request(
        f"{endpoint}/chat/completions",
        data=json.dumps(vlm_payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        vlm_resp = json.loads(resp.read().decode("utf-8"))

    msg = vlm_resp["choices"][0]["message"]
    vlm_content = msg.get("content") or msg.get("reasoning") or msg.get("reasoning_content") or ""
    usage = vlm_resp.get("usage", {})
    assert len(vlm_content) > 0, "Live VLM must return non-empty reasoning or content"
    assert usage.get("total_tokens", 0) > 0, "Live VLM must record token usage"

    # 3. Setup test database with real sample
    db_file = str(tmp_path / "live_benchmark.db")
    db = Database(db_file)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)

    task_id = "task_live"
    task_repo.upsert(InspectionTask(task_id=task_id, inspection_target="surface"))
    sample_repo.upsert(
        Sample(
            sample_id=sample_id,
            task_id=task_id,
            dataset_id="live",
            image_path=str(image_path),
            relative_path=image_path.name,
            width=width,
            height=height,
            quality_status="UNCERTAIN",
        )
    )

    # 4. Formulate structured audit suggestion (Advisory Schema) and save
    suggestion_id = "sug_live_001"
    save_result = audit_suggestion_save(
        task_id=task_id,
        suggestion={
            "suggestion_id": suggestion_id,
            "sample_id": sample_id,
            "conclusion_status": "EVIDENCE_SUPPORTED",
            "recommended_action": "REVIEW",
            "confidence": 0.95,
            "visual_explanation": vlm_content[:200],
            "feature_flags": [],
        },
        db_path=db_file,
    )

    assert save_result.status == ToolStatus.OK
    assert save_result.metrics["suggestion_id"] == suggestion_id

    # 5. Verify advisory boundary: Suggestion does NOT alter raw sample quality
    raw_sample = sample_repo.get(sample_id)
    assert raw_sample.quality_status == "UNCERTAIN", "Sample quality_status must remain unaltered"

    # 6. Candidate merge: generate merged_candidates.json with candidates SSOT
    out_dir = str(tmp_path / "runs" / "candidates" / task_id)
    merge_res = candidate_merge(
        task_id=task_id,
        output_dir=out_dir,
        include_dino=False,
        include_llm=True,
        include_audit=False,
        db_path=db_file,
    )

    assert merge_res.status == ToolStatus.REVIEW_REQUIRED
    merged_path = Path(out_dir) / "merged_candidates.json"
    assert merged_path.exists()

    with open(merged_path, "r", encoding="utf-8") as f:
        merged_json = json.load(f)

    # Verify F01 SSOT schema contract
    assert "candidates" in merged_json
    assert len(merged_json["candidates"]) == 1
    top_cand = merged_json["candidates"][0]
    assert top_cand["sample_id"] == sample_id
    assert "LLM" in top_cand["sources"]

    # 7. Feed to ReviewQueueService: verify strict parsing of candidates SSOT
    queue_service = ReviewQueueService(task_id=task_id, db=db, candidates_json_path=str(merged_path))
    assert len(queue_service._candidates) == 1
    assert queue_service._candidates[0].sample_id == sample_id

    # 8. Human review decision: submit decision and verify state transition
    decision_record = queue_service.save_decision(
        sample_id=sample_id,
        decision="NORMAL",
        reviewer="expert_operator",
        comment=f"人工复核测试: {vlm_content[:60]}",
        review_session_id="live_review_sess_01",
    )

    assert decision_record.sample_id == sample_id
    assert decision_record.decision == "NORMAL"
    assert decision_record.reviewer == "expert_operator"

    # 9. Record acceptance evidence
    evidence = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "live_vlm": {
            "endpoint": endpoint,
            "model": model,
            "tokens": usage,
            "reasoning_sample": vlm_content[:300],
        },
        "real_sample": {
            "sample_id": sample_id,
            "image_path": str(image_path),
            "file_size_bytes": len(img_bytes),
        },
        "audit_suggestion": {
            "suggestion_id": suggestion_id,
            "status": "EVIDENCE_SUPPORTED",
            "action": "REVIEW",
            "confidence": 0.95,
        },
        "candidate_merge_ssot": {
            "candidates_count": len(merged_json["candidates"]),
            "top_candidate": top_cand["sample_id"],
            "sources": top_cand["sources"],
        },
        "human_review_decision": {
            "session_id": "live_review_sess_01",
            "decision": decision_record.decision,
            "reviewer": decision_record.reviewer,
        },
    }

    acceptance_dir = tmp_path / "acceptance"
    acceptance_dir.mkdir(parents=True, exist_ok=True)
    with open(acceptance_dir / "live_vlm_evidence.json", "w", encoding="utf-8") as f:
        json.dump(evidence, f, ensure_ascii=False, indent=2)

    print("\n[SUCCESS] Live VLM End-to-End Pipeline Verified Successfully!")
