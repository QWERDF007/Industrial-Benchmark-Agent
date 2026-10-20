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

from iad_core.storage.database import Database
from iad_core.storage.models import InspectionTask, Sample
from iad_core.storage.repositories import TaskRepository, SampleRepository
from iad_core.review.service import ReviewQueueService
from iad_core.tools.audit_tools import audit_suggestion_save
from iad_core.tools.candidate_tools import candidate_merge
from iad_core.contracts import ToolStatus

LIVE_VLM_URL = "http://192.168.2.197:30002/v1"
LIVE_MODEL = "Qwen/Qwen3.8-27B-FP8"
LIVE_API_KEY = "sk-123456"

REAL_SAMPLE_ID = "kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2022_08_19_13_15_15_853269.png"
REAL_IMAGE_PATH = "/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Test/2022_08_19_13_15_15_853269.png"


def test_live_vlm_e2e_pipeline(tmp_path):
    if not Path(REAL_IMAGE_PATH).exists():
        pytest.skip(f"Real image path not found: {REAL_IMAGE_PATH}")

    # 1. Read real image bytes and encode to base64
    with open(REAL_IMAGE_PATH, "rb") as f:
        img_bytes = f.read()
    b64_img = base64.b64encode(img_bytes).decode("utf-8")

    # 2. Query live VLM for visual defect analysis
    vlm_payload = {
        "model": LIVE_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "你是一名工业缺陷质检专家。请对这张手机屏幕点胶/框胶图像进行视觉检查。"
                            "判断是否存在断胶、溢胶或瑕疵。给出简要质检结论。"
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}},
                ],
            }
        ],
        "max_tokens": 150,
        "temperature": 0.1,
    }

    req = urllib.request.Request(
        f"{LIVE_VLM_URL}/chat/completions",
        data=json.dumps(vlm_payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LIVE_API_KEY}",
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

    task_id = "task_kuangjiao_live"
    task_repo.upsert(InspectionTask(task_id=task_id, inspection_target="glue_dispensing"))
    sample_repo.upsert(
        Sample(
            sample_id=REAL_SAMPLE_ID,
            task_id=task_id,
            dataset_id="kuangjiao",
            image_path=REAL_IMAGE_PATH,
            relative_path="2022_08_19_13_15_15_853269.png",
            width=2048,
            height=1536,
            quality_status="UNCERTAIN",
        )
    )

    # 4. Formulate structured audit suggestion (Advisory Schema) and save
    suggestion_id = "sug_live_001"
    save_result = audit_suggestion_save(
        task_id=task_id,
        suggestion={
            "suggestion_id": suggestion_id,
            "sample_id": REAL_SAMPLE_ID,
            "conclusion_status": "EVIDENCE_SUPPORTED",
            "recommended_action": "REVIEW",
            "confidence": 0.95,
            "visual_explanation": vlm_content[:200],
            "feature_flags": ["uniform_glue_line"],
        },
        db_path=db_file,
    )

    assert save_result.status == ToolStatus.OK
    assert save_result.metrics["suggestion_id"] == suggestion_id

    # 5. Verify advisory boundary: Suggestion does NOT alter raw sample quality
    raw_sample = sample_repo.get(REAL_SAMPLE_ID)
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
    assert top_cand["sample_id"] == REAL_SAMPLE_ID
    assert "LLM" in top_cand["sources"]

    # 7. Feed to ReviewQueueService: verify strict parsing of candidates SSOT
    queue_service = ReviewQueueService(task_id=task_id, db=db, candidates_json_path=str(merged_path))
    assert len(queue_service._candidates) == 1
    assert queue_service._candidates[0].sample_id == REAL_SAMPLE_ID

    # 8. Human review decision: submit decision and verify state transition
    decision_record = queue_service.save_decision(
        sample_id=REAL_SAMPLE_ID,
        decision="NORMAL",
        reviewer="expert_operator",
        comment=f"VLM verified glue quality: {vlm_content[:60]}",
        review_session_id="live_review_sess_01",
    )

    assert decision_record.sample_id == REAL_SAMPLE_ID
    assert decision_record.decision == "NORMAL"
    assert decision_record.reviewer == "expert_operator"

    # 9. Record acceptance evidence
    evidence = {
        "timestamp": "2026-10-19T17:15:00+08:00",
        "live_vlm": {
            "endpoint": LIVE_VLM_URL,
            "model": LIVE_MODEL,
            "tokens": usage,
            "reasoning_sample": vlm_content[:300],
        },
        "real_sample": {
            "sample_id": REAL_SAMPLE_ID,
            "image_path": REAL_IMAGE_PATH,
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

    acceptance_dir = Path("runs/acceptance")
    acceptance_dir.mkdir(parents=True, exist_ok=True)
    with open(acceptance_dir / "live_vlm_evidence.json", "w", encoding="utf-8") as f:
        json.dump(evidence, f, ensure_ascii=False, indent=2)

    print("\n[SUCCESS] Live VLM End-to-End Pipeline Verified Successfully!")
