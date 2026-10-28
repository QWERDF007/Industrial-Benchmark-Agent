import os
import pytest

from iad_core.storage.database import Database
from iad_core.storage.repositories import BenchmarkRepository
from iad_core.benchmark.builder import preview_benchmark_pipeline, run_benchmark_pipeline
from iad_core.tools.benchmark_tools import benchmark_preview, benchmark_build
from iad_core.contracts import ToolStatus
from iad_core.candidate.schemas import CandidateRecord, CandidateSignals


def test_preview_benchmark_matches_build_counts(tmp_path):
    import yaml
    from PIL import Image
    from uuid import uuid4
    from iad_core.dataset.registry import DatasetRegistry, DatasetImport
    from iad_core.storage.repositories import SampleRepository
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    root = tmp_path / 'images'
    root.mkdir()
    for index in range(12):
        Image.new('RGB', (24, 24), (index * 15, 20, 30)).save(root / f'{index}.png')
    import json
    (root / '6.json').write_text(json.dumps({'imageWidth':24,'imageHeight':24,
        'shapes':[{'label':'dent','shape_type':'rectangle','points':[[2,2],[10,10]]}]}))
    db = Database(str(tmp_path / 'benchmark.db'))
    config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme', name='预览与构建', image_dir=str(root), annotation_dir=str(root)))
    config.gold.trusted_quality_sources = ['fixture']
    config.gold.trusted_reviewers = ['preview-reviewer']
    samples = SampleRepository(db)
    for index in range(12):
        sample = samples.get(config.dataset.id + ':' + str(index) + '.png')
        sample.quality_status, sample.quality_source = ('PASS' if index < 6 else 'FAIL'), 'fixture'
        samples.upsert(sample)
        if index < 2:
            HumanReview(db).submit(ReviewSubmission(submission_id=uuid4(), dataset_id=config.dataset.id,
                sample_id=sample.sample_id, reviewer='preview-reviewer', decision='HARD_NORMAL'))
    config_path = tmp_path / 'benchmark.yaml'
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    args = dict(task_id=config.task.task_id, config_path=str(config_path), seed=42, db_path=db.db_path)
    preview = preview_benchmark_pipeline(**args)
    assert preview.status == 'OK'
    assert (preview.normal, preview.anomaly, preview.hard_normal, preview.groups_count) == (6, 6, 2, 12)
    assert preview.projected_train + preview.projected_val + preview.projected_test == 12
    tool = benchmark_preview(**args)
    assert tool.status == ToolStatus.OK
    assert (tool.metrics['normal_gold'], tool.metrics['anomaly_gold']) == (6, 6)
    built = run_benchmark_pipeline(**args, output_dir=str(tmp_path / 'export'))
    assert (built.train_count, built.val_count, built.test_count) == (preview.projected_train, preview.projected_val, preview.projected_test)
    with open(built.gold_jsonl) as exported:
        anomaly = next(json.loads(line) for line in exported if json.loads(line)['sample_id'] == config.dataset.id + ':6.png')
    assert anomaly['annotations'][0]['annotation_type'] == 'bbox'
    assert anomaly['annotations'][0]['mask_path'] is None
    from iad_core.tools.benchmark_tools import benchmark_status
    partial = benchmark_build(**args, build_id='partial-track', output_dir=str(tmp_path / 'partial'))
    assert partial.status == ToolStatus.PARTIAL
    assert partial.metrics['status'] == 'PARTIAL'
    assert benchmark_status('partial-track', db_path=db.db_path).status == ToolStatus.PARTIAL
    from iad_core.task.config import ReadinessPolicyConfig, StandardADReadinessPolicy
    config.readiness_policy = ReadinessPolicyConfig(standard_ad=StandardADReadinessPolicy(min_pass=1, min_fail=1))
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    ready = benchmark_build(**args, build_id='ready-track', output_dir=str(tmp_path / 'ready'))
    assert ready.status == ToolStatus.OK
    assert ready.metrics['status'] == 'READY'
    assert benchmark_status('ready-track', db_path=db.db_path).status == ToolStatus.OK


def test_review_gate_non_required_candidates_do_not_block(tmp_path):
    """NV-13 / NS-04: Non-required UNCERTAIN candidates (is_required=False) do NOT block benchmark_build."""
    from iad_core.storage.models import InspectionTask, Sample, QualityStatus, GoldRecord
    from iad_core.storage.repositories import TaskRepository, SampleRepository, GoldRepository
    from iad_core.storage.review_repository import ReviewRepository

    db_path = str(tmp_path / "test_gate.db")
    db = Database(db_path)
    task_repo = TaskRepository(db)
    sample_repo = SampleRepository(db)
    gold_repo = GoldRepository(db)
    review_repo = ReviewRepository(db)

    task_id = "test_task_nonreq"
    task_repo.upsert(InspectionTask(task_id=task_id, task_name="Task NonReq", inspection_target="t"))

    # Create samples: 4 pass, 2 fail, 1 uncertain
    samples = []
    golds = []
    for i in range(4):
        sid = f"norm_{i}"
        samples.append(Sample(sample_id=sid, task_id=task_id, dataset_id="ds", image_path=f"/{sid}.png", relative_path=f"{sid}.png", width=10, height=10, quality_status=QualityStatus.PASS))
        golds.append(GoldRecord(sample_id=sid, task_id=task_id, policy_name="default", gold_quality="PASS", binary_label="NORMAL", gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path=f"/{sid}.png", relative_path=f"{sid}.png"))

    for i in range(2):
        sid = f"anom_{i}"
        samples.append(Sample(sample_id=sid, task_id=task_id, dataset_id="ds", image_path=f"/{sid}.png", relative_path=f"{sid}.png", width=10, height=10, quality_status=QualityStatus.FAIL))
        golds.append(GoldRecord(sample_id=sid, task_id=task_id, policy_name="default", gold_quality="FAIL", binary_label="ANOMALY", gold_source="HUMAN_REVIEW", gold_status="CONFIRMED", image_path=f"/{sid}.png", relative_path=f"{sid}.png"))

    # 1 uncertain sample
    samples.append(Sample(sample_id="unc_1", task_id=task_id, dataset_id="ds", image_path="/unc_1.png", relative_path="unc_1.png", width=10, height=10, quality_status=QualityStatus.UNCERTAIN))

    sample_repo.upsert_batch(samples)
    gold_repo.upsert_batch(golds)

    # Note: unc_1 is not required (is_required=False in fallback, or not in required_review_ids)
    # When benchmark_build runs without required review candidates, it should succeed (not halt with REVIEW_REQUIRED)
    import yaml
    cfg_data = {
        "dataset": {"id": "ds", "name": "DS"},
        "root": str(tmp_path),
        "task": {"task_id": task_id, "name": "Task", "inspection_target": "t"},
        "gold": {"policy_name": "default", "source_priority": ["HUMAN_REVIEW", "EXISTING_QUALITY"]},
        "split": {"policy_name": "default", "seed": 42},
        "review_policy": {"policy_name": "default", "required_review_ids": []},
    }
    cfg_path = str(tmp_path / "config.yaml")
    with open(cfg_path, "w", encoding="utf-8") as f:
        yaml.dump(cfg_data, f)

    from PIL import Image
    from pathlib import Path
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.task.config import load_config
    from iad_core.duplicate.index import PixelScan
    import hashlib
    DatasetRegistry(db).save(load_config(cfg_path))
    for index, sample in enumerate(samples):
        path = tmp_path / (sample.sample_id + '.png')
        Image.new('RGB', (10, 10), (index * 20, 30, 50)).save(path)
        sample.image_path = str(path)
    sample_repo.upsert_batch(samples)
    with db.connection() as connection:
        scan = PixelScan(connection)
        for sample in samples:
            path = Path(sample.image_path)
            scan.stage(sample.sample_id, str(path), hashlib.sha256(path.read_bytes()).hexdigest())
        scan.publish('ds')

    res = benchmark_build(
        task_id=task_id,
        config_path=cfg_path,
        db_path=db_path,
        output_dir=str(tmp_path / "build_out"),
    )
    assert res.status == ToolStatus.NOT_READY
    assert res.metrics['status'] == 'NOT_READY'
    assert res.artifacts
    assert "Benchmark build" in res.summary
