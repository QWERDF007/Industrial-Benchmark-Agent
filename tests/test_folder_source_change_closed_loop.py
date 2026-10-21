import json
import httpx
from pathlib import Path
from uuid import uuid4
from PIL import Image
import pytest

from iad_core.entry import dataset_preview, dataset_import, dataset_scan, knowledge_get, report_get, review_submit_decision, sample_get
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_folder_classification_source_change_and_reaudit_closed_loop(tmp_path, mllm_api):
    root = tmp_path / "folder_loop"
    good = root / "good"
    bad = root / "bad"
    good.mkdir(parents=True)
    bad.mkdir(parents=True)

    Image.new("RGB", (100, 100), "white").save(good / "part-1.png")
    Image.new("RGB", (100, 100), "red").save(bad / "part-2.png")

    db_path = str(tmp_path / "closed_loop.db")
    import_request = {
        "format": "folder_classification",
        "name": "闭环测试数据集",
        "root_dir": str(root),
        "rules": [
            {"role": "normal", "path": "good"},
            {"role": "anomaly", "path": "bad"},
        ],
    }
    preview = dataset_preview({"root_dir": str(root), "rules": import_request["rules"]}, db_path)
    imported = dataset_import({**import_request, "preview_fingerprint": preview["preview_fingerprint"]}, db_path)
    dataset_id = imported["dataset_id"]

    client, bodies, responses = mllm_api
    fail_next_audit = False
    original_send = client.send
    def intercepted_send(request, *args, **kwargs):
        nonlocal fail_next_audit
        if fail_next_audit and request.url.path.endswith("/chat/completions"):
            fail_next_audit = False
            return httpx.Response(500, json={"error": {"message": "temporary failure"}}, request=request)
        return original_send(request, *args, **kwargs)

    client.send = intercepted_send
    db = Database(db_path)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))

    try:
        # 1. 挖掘良品知识与不良品知识
        mine_norm = runtime.knowledge.start(dataset_id=dataset_id, kind="normal")
        runtime.knowledge.wait(mine_norm["run_id"], 5)
        status_norm = runtime.knowledge.status(mine_norm["run_id"])
        assert status_norm["status"] == "COMPLETED", status_norm
        normal_v1 = status_norm["knowledge_version_id"]

        mine_def = runtime.knowledge.start(dataset_id=dataset_id, kind="defect", normal_version_id=normal_v1)
        runtime.knowledge.wait(mine_def["run_id"], 5)
        status_def = runtime.knowledge.status(mine_def["run_id"])
        assert status_def["status"] == "COMPLETED", (status_def["status"], status_def.get("errors"))
        defect_v1 = status_def["knowledge_version_id"]

        # 2. 启动联合审计，第1个样本失败，第2个样本成功 -> PARTIAL 状态
        fail_next_audit = True
        responses["VlmResult"].update(suggested_label="PASS", confidence=0.85)
        first_audit = runtime.audit.start(dataset_id=dataset_id)
        runtime.audit.wait(first_audit["run_id"], 5)
        audit_status = runtime.audit.status(first_audit["run_id"])
        assert audit_status["status"] == "PARTIAL"
        assert audit_status["completed"] == 1
        assert audit_status["failed"] == 1
        assert "500" in audit_status["errors"][0]["message"]
        assert "NameError" not in audit_status["errors"][0]["message"]

        # 3. 初始报告验证
        rep1 = report_get({"dataset_id": dataset_id}, db_path)
        assert rep1["total_samples"] == 2
        assert rep1["quality"]["audit_coverage"]["numerator"] == 1
        assert rep1["quality"]["audit_coverage"]["denominator"] == 2
        assert rep1["quality"]["audit_coverage"]["percent"] == 50
        assert rep1["quality"]["knowledge_versions"][0]["normal_version_id"] == normal_v1
        assert rep1["quality"]["knowledge_versions"][0]["defect_version_id"] == defect_v1
        lc1 = rep1["quality"]["label_comparison"]
        assert lc1 is not None
        assert lc1["raw_ok"] == 1
        assert lc1["raw_ng"] == 1
        assert lc1["source_changed_count"] == 0

        # 4. 模拟来源变更：修改失败的良品图片并重新扫描
        Image.new("RGB", (100, 100), "yellow").save(good / "part-1.png")
        dataset_scan({"dataset_id": dataset_id}, db_path)

        # 5. 验证知识新鲜度变更为 changed
        freshness = knowledge_get({"dataset_id": dataset_id, "kind": "normal"}, db_path)["freshness"]
        assert freshness["status"] == "changed"
        assert len(freshness["source_changes"]) > 0

        # 6. 验证旧执行拒绝重试已变动源（拒绝混入新输入）
        with pytest.raises(ValueError, match="重新启动|冻结输入不可恢复"):
            runtime.audit.retry(run_id=first_audit["run_id"])

        # 7. 挖掘后继良品知识版本
        normal_orig = knowledge_get({"dataset_id": dataset_id, "kind": "normal"}, db_path)["knowledge"]
        responses["KnowledgeDraft"]["revisions"] = [{
            "previous_check_id": check["check_id"],
            "current_check_titles": [check["title"]],
            "reason": "重新观察变化后的来源，保留同一表面判据"
        } for check in normal_orig["checks"]]
        mine_norm_v2 = runtime.knowledge.start(dataset_id=dataset_id, kind="normal")
        runtime.knowledge.wait(mine_norm_v2["run_id"], 5)
        status_norm_v2 = runtime.knowledge.status(mine_norm_v2["run_id"])
        assert status_norm_v2["status"] == "COMPLETED", (status_norm_v2["status"], status_norm_v2.get("errors"))
        normal_v2 = status_norm_v2["knowledge_version_id"]
        assert normal_v2 != normal_v1

        # 8. 使用后继知识重新审计
        second_audit = runtime.audit.start(dataset_id=dataset_id, normal_version_id=normal_v2)
        runtime.audit.wait(second_audit["run_id"], 5)
        assert runtime.audit.status(second_audit["run_id"])["status"] == "COMPLETED"

        # 9. 报告展示适用版本并保留历史
        rep2 = report_get({"dataset_id": dataset_id}, db_path)
        assert rep2["quality"]["audit_coverage"]["percent"] == 100
        # 确认当前使用的版本为 v2，最新审计作业更新为 second_audit
        assert any(u["normal_version_id"] == normal_v2 for u in rep2["quality"]["knowledge_versions"])
        assert rep2["quality"]["audit_run_ids"] == [second_audit["run_id"]]
        # 历史审计作业完整保存在作业仓储中
        all_runs = [j["run_id"] for j in runtime.audit.list(dataset_id)]
        assert first_audit["run_id"] in all_runs
        assert second_audit["run_id"] in all_runs
    finally:
        runtime.close()


def test_folder_classification_rule_mapping_change_preserves_human_review_and_marks_source_changed(tmp_path, mllm_api):
    root = tmp_path / "mapping_loop"
    folder_a = root / "folder_a"
    folder_b = root / "folder_b"
    folder_a.mkdir(parents=True)
    folder_b.mkdir(parents=True)

    Image.new("RGB", (100, 100), "white").save(folder_a / "img1.png")
    Image.new("RGB", (100, 100), (254, 254, 254)).save(folder_a / "img1_b.png")
    Image.new("RGB", (100, 100), "red").save(folder_b / "img2.png")

    db_path = str(tmp_path / "mapping.db")
    import_request = {
        "format": "folder_classification",
        "name": "映射重扫闭环测试",
        "root_dir": str(root),
        "rules": [
            {"role": "normal", "path": "folder_a"},
            {"role": "anomaly", "path": "folder_b"},
        ],
    }
    preview = dataset_preview({"root_dir": str(root), "rules": import_request["rules"]}, db_path)
    imported = dataset_import({**import_request, "preview_fingerprint": preview["preview_fingerprint"]}, db_path)
    dataset_id = imported["dataset_id"]
    sample_a = f"{dataset_id}:folder_a/img1.png"
    sample_b = f"{dataset_id}:folder_b/img2.png"

    # 1. 提交人工复核
    review_submit_decision({
        "submission_id": str(uuid4()),
        "dataset_id": dataset_id,
        "reviewer": "质检工程师",
        "sample_id": sample_a,
        "decision": "PASS",
        "comment": "确认良品",
    }, db_path)

    # 2. 挖掘良品知识并完成审计
    client, bodies, responses = mllm_api
    db = Database(db_path)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))

    try:
        mine = runtime.knowledge.start(dataset_id=dataset_id, kind="normal")
        runtime.knowledge.wait(mine["run_id"], 5)
        normal_v = runtime.knowledge.status(mine["run_id"])["knowledge_version_id"]

        responses["VlmResult"].update(suggested_label="PASS", confidence=0.9)
        audit = runtime.audit.start(dataset_id=dataset_id)
        runtime.audit.wait(audit["run_id"], 5)
        assert runtime.audit.status(audit["run_id"])["status"] == "COMPLETED"

        # 检查审计后初始报告
        rep1 = report_get({"dataset_id": dataset_id}, db_path)
        assert rep1["human_reviewed_count"] == 1
        assert rep1["quality"]["human_verification_coverage"]["numerator"] == 1
        assert rep1["quality"]["human_verification_coverage"]["denominator"] == 3
        assert rep1["quality"]["label_comparison"]["source_changed_count"] == 0
        assert rep1["quality"]["label_comparison"]["inconsistency_ratio"]["denominator"] == 3

        Image.new("RGB", (100, 100), "blue").save(folder_b / "img2.png")
        dataset_scan({"dataset_id": dataset_id}, db_path)
        changed = report_get({"dataset_id": dataset_id}, db_path)["quality"]["label_comparison"]
        assert changed["source_changed_count"] == 1, "同尺寸换图必须使旧审计退出有效对照范围"
        assert changed["inconsistency_ratio"]["denominator"] == 2
        Image.new("RGB", (100, 100), "red").save(folder_b / "img2.png")
        dataset_scan({"dataset_id": dataset_id}, db_path)
        restored = report_get({"dataset_id": dataset_id}, db_path)["quality"]["label_comparison"]
        assert restored["source_changed_count"] == 0, "相同内容不因扫描时间改变而失效"
        (folder_b / "img2.png").write_bytes(b'not an image')
        dataset_scan({"dataset_id": dataset_id}, db_path)
        unavailable = report_get({"dataset_id": dataset_id}, db_path)["quality"]["label_comparison"]
        assert unavailable["source_changed_count"] == 1
        assert unavailable["inconsistency_ratio"]["denominator"] == 2
        Image.new("RGB", (100, 100), "red").save(folder_b / "img2.png")
        dataset_scan({"dataset_id": dataset_id}, db_path)

        # 3. 业务修改目录映射规则并重扫：将 folder_a 规则由 normal 改为 anomaly
        updated_rules = [
                {"role": "anomaly", "path": "folder_a"},
                {"role": "anomaly", "path": "folder_b"},
        ]
        preview = dataset_preview({"root_dir": str(root), "rules": updated_rules}, db_path)
        dataset_scan({"dataset_id": dataset_id, "rules": updated_rules,
                      "preview_fingerprint": preview["preview_fingerprint"]}, db_path)

        # 4. 验证人工复核仍然完整保留（SSOT 与历史独立）
        detail_a = sample_get({"sample_id": sample_a}, db_path)
        assert detail_a["review_decision"]["decision"] == "PASS"
        assert detail_a["review_decision"]["reviewer"] == "质检工程师"
        assert detail_a["sample"]["quality_status"] == "FAIL"
        freshness = knowledge_get({"dataset_id": dataset_id, "kind": "normal"}, db_path)["freshness"]
        assert sample_a in {change['sample_id'] for change in freshness['source_changes']}, "人审资格未改变也须记录原始标签/规则变化"

        # 5. 验证质量报告：因为 folder_a 在审计后来源规则发生了变更，标示为来源变动
        # 且不把旧记录伪装成核验新标签的结果（被排除出可比较分母）
        rep2 = report_get({"dataset_id": dataset_id}, db_path)
        lc2 = rep2["quality"]["label_comparison"]
        assert lc2["source_changed_count"] == 2
        # folder_a 规则变动后排除，仅剩 sample_b (raw FAIL, model PASS -> inconsistent)
        assert lc2["inconsistency_ratio"]["denominator"] == 1
        assert lc2["inconsistency_ratio"]["numerator"] == 1
        assert lc2["inconsistency_ratio"]["percent"] == 100.0

        # 6. 新启动审计后，更新最新审计建议，来源变动计数归零
        re_audit = runtime.audit.start(dataset_id=dataset_id, normal_version_id=normal_v)
        runtime.audit.wait(re_audit["run_id"], 5)
        assert runtime.audit.status(re_audit["run_id"])["status"] == "COMPLETED"

        rep3 = report_get({"dataset_id": dataset_id}, db_path)
        lc3 = rep3["quality"]["label_comparison"]
        assert lc3["source_changed_count"] == 0
        assert lc3["inconsistency_ratio"]["denominator"] == 3
    finally:
        runtime.close()
