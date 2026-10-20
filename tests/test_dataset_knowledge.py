import json
import threading
from pathlib import Path

import httpx
import pytest
from PIL import Image, ImageDraw

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database


@pytest.fixture
def knowledge_dataset(tmp_path):
    images, labels = tmp_path / "images", tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for index in range(6):
        image = Image.new("RGB", (320, 240), "#cccccc")
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill="#333333")
        for x in (100, 220):
            draw.ellipse((x - 15, 105, x + 15, 135), fill="#cccccc")
        image.save(images / f"part-{index}.png")
    db = Database(str(tmp_path / "knowledge.db"))
    config = DatasetRegistry(db).import_labelme(DatasetImport(
        name="双孔部件", image_dir=str(images), annotation_dir=str(labels),
    ))
    return db, config


def test_operator_mines_and_reopens_evidence_backed_normal_knowledge(knowledge_dataset):
    from iad_core.entry import knowledge_evidence, knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    sent = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith("/tokenize"):
            return httpx.Response(200, json={"count": 4000, "max_model_len": 262144})
        content = body["messages"][0]["content"]
        sent.extend(json.loads(item["text"].removeprefix("视觉证据："))
                    for item in content if item["type"] == "text" and item["text"].startswith("视觉证据："))
        result = {
            "summary": "矩形部件包含两个横向排列的圆孔",
            "checks": [{
                "title": "双孔相对位置", "subject": "圆孔与部件主体", "location": "部件中部",
                "criterion": "两个圆孔沿主体长边排列，中心位于同一横向带内",
                "allowed_variations": ["整体平移", "均匀亮度变化"],
                "support_evidence_ids": [sent[0]["evidence_id"], sent[1]["evidence_id"]],
                "counter_evidence_ids": [], "limitations": ["没有标尺，不能推断绝对孔径"],
                "status": "supported",
            }],
            "suspects": [], "limitations": ["无标注是初始良品约定，未经人工确认"],
        }
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        service.wait(job["run_id"], 5)
        finished = service.status(job["run_id"])
        assert finished["status"] == "COMPLETED", finished
        assert finished["completed"] == finished["total_samples"] == 6
        snapshot = knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"]
        assert snapshot["version_id"] == finished["knowledge_version_id"]
        assert snapshot["checks"][0]["title"] == "双孔相对位置"
        assert snapshot["checks"][0]["criterion"] == "两个圆孔沿主体长边排列，中心位于同一横向带内"
        assert len(snapshot["sources"]) == 6
        assert {source["qualification"] for source in snapshot["sources"]} == {"initial_unannotated"}
        assert len({image["source_sha256"] for image in sent}) == 1
        assert len(sent) == 6
        reopened = knowledge_get({"version_id": snapshot["version_id"]}, db.db_path)["knowledge"]
        assert reopened == snapshot
        with pytest.raises(ValueError, match="kind"):
            knowledge_get({"version_id": snapshot["version_id"], "kind": "defect"}, db.db_path)
        evidence_id = snapshot["checks"][0]["support_evidence_ids"][0]
        media = knowledge_evidence({"version_id": snapshot["version_id"], "evidence_id": evidence_id}, db.db_path)
        with Image.open(media["path"]) as image:
            assert image.size == (320, 240)
            assert image.getpixel((100, 120)) == (204, 204, 204)
            assert image.getpixel((160, 120)) == (51, 51, 51)
        assert Path(media["path"]).is_file()
    finally:
        service.close()


def test_cancelling_mining_retains_unprocessed_scope_and_does_not_publish_late_knowledge(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    entered, release = threading.Event(), threading.Event()

    def respond(request):
        if request.url.path.endswith("/tokenize"):
            return httpx.Response(200, json={"count": 4000, "max_model_len": 262144})
        entered.set()
        assert release.wait(5)
        result = {"summary": "迟到结果", "checks": [], "suspects": [], "limitations": []}
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        assert entered.wait(3)
        stopping = service.cancel(job["run_id"])
        assert stopping["status"] == "RUNNING"
        assert "正在停止" in stopping["message"]
        with pytest.raises(ValueError, match="active job"):
            service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        release.set()
        service.wait(job["run_id"], 5)
        finished = service.status(job["run_id"])
        assert finished["status"] == "CANCELLED"
        assert finished["completed"] == finished["failed"] == 0
        assert finished["unprocessed"] == 6
        assert knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"] is None
    finally:
        release.set()
        service.close()


def test_mining_reuses_unchanged_knowledge_and_preserves_history_after_source_change(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    generated = []

    def respond(request):
        if request.url.path.endswith("/tokenize"):
            return httpx.Response(200, json={"count": 4000, "max_model_len": 262144})
        generated.append(request)
        result = {"summary": "尚不能建立可靠共识", "checks": [], "suspects": [], "limitations": ["需更多独立来源"]}
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        service.wait(first["run_id"], 5)
        original = knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"]
        again = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        service.wait(again["run_id"], 5)
        assert service.status(again["run_id"])["knowledge_version_id"] == original["version_id"]
        assert len(generated) == 1
        Image.new("RGB", (320, 240), "white").save(Path(config.root) / "part-0.png")
        changed = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        service.wait(changed["run_id"], 5)
        current = knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"]
        assert service.status(changed["run_id"])["status"] == "COMPLETED"
        assert current["version_id"] != original["version_id"]
        assert current["parent_version_id"] == original["version_id"]
        assert current["signature"] != original["signature"]
        assert knowledge_get({"version_id": original["version_id"]}, db.db_path)["knowledge"] == original
        assert len(generated) == 2
    finally:
        service.close()


def test_invalid_model_localization_cannot_be_published_as_knowledge(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset

    def respond(request):
        if request.url.path.endswith("/tokenize"):
            return httpx.Response(200, json={"count": 4000, "max_model_len": 262144})
        content = json.loads(request.content)["messages"][0]["content"]
        image = next(json.loads(item["text"].removeprefix("视觉证据：")) for item in content
                     if item["type"] == "text" and item["text"].startswith("视觉证据："))
        result = {"summary": "无效区域", "checks": [], "limitations": [], "suspects": [{
            "evidence_id": image["evidence_id"], "bbox_1000": [900, 100, 200, 300],
            "description": "框左右坐标颠倒", "normal_explanation": "不能定位",
        }]}
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind="normal", model_name="test-mllm")
        service.wait(job["run_id"], 5)
        result = service.status(job["run_id"])
        assert result["status"] == "FAILED", result
        assert result["completed"] == 0
        assert knowledge_get({"dataset_id": config.dataset.id, "kind": "normal"}, db.db_path)["knowledge"] is None
    finally:
        service.close()
