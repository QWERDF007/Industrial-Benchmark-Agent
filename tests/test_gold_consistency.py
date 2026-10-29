from uuid import uuid4

import pytest

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.service import ConsistencyService
from iad_core.gold.builder import build_gold
from iad_core.storage.repositories import SampleRepository
from iad_core.task.config import GoldPolicyConfig
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.review_models import ConsistencyReviewSubmission


@pytest.fixture
def conflicting_content(dataset):
    db, registry, config = dataset
    config.annotations.policy_id = 'production-policy'
    config.annotations.annotation_role = 'REFERENCE'
    config.gold.trusted_quality_sources = ['production-fixture']
    config.gold.trusted_reviewers = ['gold-reviewer']
    registry.save(config, require_existing=True)
    samples = SampleRepository(db)
    identities = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    for identity, label in zip(identities, ['PASS', 'FAIL']):
        sample = samples.get(identity)
        sample.quality_status, sample.quality_source = label, 'production-fixture'
        samples.upsert(sample)
    result = ConsistencyService(db).compare(ConsistencyCompare(sample_a=identities[0], sample_b=identities[1]))
    return db, registry, config, identities, result


def test_same_policy_exact_quality_conflict_cannot_enter_confirmed_gold(conflicting_content):
    db, _, config, identities, result = conflicting_content
    assert result.annotation.confirmed_conflict
    built = build_gold(config.task.task_id, policy=GoldPolicyConfig(trusted_quality_sources=['production-fixture']),
        db_path=db.db_path, persist_to_db=False)
    records = {record.sample_id: record for record in built.records}
    assert [records[identity].gold_status for identity in identities] == ['CONFLICT', 'CONFLICT']
    assert built.conflict_count == 2
    assert all(records[identity].binary_label is None for identity in identities)
    assert [SampleRepository(db).get(identity).quality_status for identity in identities] == ['PASS', 'FAIL']


def test_actual_human_quality_resolution_allows_image_gold_but_not_unfixed_regions(conflicting_content):
    import json
    from pathlib import Path
    from iad_core.consistency.review_models import CorrectionVerification
    db, registry, config, identities, result = conflicting_content
    quality = next(item for item in result.annotation.differences if item.type == 'QUALITY_LABEL')
    ConsistencyReview(db).submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[quality.difference_id], reviewer='gold-reviewer', comment='确认两份副本均为异常',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': identity, 'quality': 'FAIL'} for identity in identities]}))
    built = build_gold(config.task.task_id, policy=GoldPolicyConfig(trusted_reviewers=['gold-reviewer'], trusted_quality_sources=['production-fixture']),
        db_path=db.db_path, persist_to_db=False)
    records = {record.sample_id: record for record in built.records}
    assert [records[identity].gold_status for identity in identities] == ['CONFIRMED', 'CONFIRMED']
    assert all(records[identity].binary_label == 'ANOMALY' for identity in identities)
    assert all(records[identity].annotations == [] for identity in identities)
    assert records[identities[0]].gold_source == 'HUMAN_REVIEW'
    assert records[identities[0]].provenance['consistency']['localization_state'] == 'UNRESOLVED'
    current = ConsistencyService(db).compare(ConsistencyCompare(sample_a=identities[0], sample_b=identities[1]))
    category = next(item for item in current.annotation.differences if item.type == 'CATEGORY')
    review = ConsistencyReview(db)
    proposed = review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=current.evidence_id,
        result_id=current.result_id, difference_ids=[category.difference_id], reviewer='gold-reviewer', comment='修正副本区域类别',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [{'operation': 'relabel', 'sample_id': identities[1],
            'annotation_id': category.right[0].annotation_id, 'category': 'dent'}]}))
    policy = GoldPolicyConfig(trusted_reviewers=['gold-reviewer'], trusted_quality_sources=['production-fixture'])
    pending = build_gold(config.task.task_id, policy=policy, db_path=db.db_path, persist_to_db=False)
    assert all(not record.annotations for record in pending.records if record.sample_id in identities)
    source = Path(config.annotations.root) / 'scratch.json'
    label = json.loads(source.read_text());label['shapes'][0]['label'] = 'dent';source.write_text(json.dumps(label))
    registry.rescan(config.dataset.id)
    corrected = ConsistencyService(db).compare(ConsistencyCompare(sample_a=identities[0], sample_b=identities[1]))
    assert review.verify(CorrectionVerification(client_request_id=uuid4(), decision_id=proposed.decision_id,
        evidence_id=corrected.evidence_id, reviewer='gold-reviewer')).correction_state == 'VERIFIED'
    verified = build_gold(config.task.task_id, policy=policy, db_path=db.db_path, persist_to_db=False)
    assert all(len(record.annotations) == 1 and record.annotations[0].annotation_type == 'bbox'
        and record.annotations[0].mask_path is None for record in verified.records if record.sample_id in identities)


def test_different_policies_do_not_exclude_legitimate_image_gold(dataset, tmp_path):
    import shutil
    from iad_core.dataset.registry import DatasetImport
    db, registry, config = dataset
    config.annotations.policy_id = 'policy-a'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    target = config.dataset.id + ':normal.png'
    sample = SampleRepository(db).get(target)
    sample.quality_status, sample.quality_source = 'PASS', 'production-fixture'
    SampleRepository(db).upsert(sample)
    root = tmp_path / 'other-policy'
    root.mkdir()
    shutil.copyfile(sample.image_path, root / 'copy.png')
    other = registry.import_labelme(DatasetImport(format='labelme', name='另一个规范', image_dir=str(root), annotation_dir=str(root),
        annotation_policy={'policy_id': 'policy-b', 'annotation_role': 'REFERENCE'}))
    copy = SampleRepository(db).get(other.dataset.id + ':copy.png')
    copy.quality_status, copy.quality_source = 'FAIL', 'production-fixture'
    SampleRepository(db).upsert(copy)
    for config, identity in ((config, target), (other, copy.sample_id)):
        built = build_gold(config.task.task_id, policy=GoldPolicyConfig(trusted_quality_sources=['production-fixture']),
            db_path=db.db_path, persist_to_db=False)
        assert next(record for record in built.records if record.sample_id == identity).gold_status == 'CONFIRMED'


def test_untrusted_review_cannot_clear_same_policy_content_conflict(conflicting_content):
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    db, _, config, identities, _ = conflicting_content
    HumanReview(db).submit(ReviewSubmission(submission_id=uuid4(), dataset_id=config.dataset.id, sample_id=identities[0],
        reviewer='untrusted', decision='FAIL'))
    built = build_gold(config.task.task_id, policy=GoldPolicyConfig(trusted_reviewers=['gold-reviewer'], trusted_quality_sources=['production-fixture']),
        db_path=db.db_path, persist_to_db=False)
    assert all(record.gold_status == 'CONFLICT' for record in built.records if record.sample_id in identities)


def test_scope_report_uses_frozen_gold_projection_and_real_human_resolution(conflicting_content):
    from iad_core.consistency.reports import ConsistencyReports
    from iad_core.consistency.result_models import ConsistencyQuery
    from iad_core.consistency.result_snapshot import ResultSnapshots
    db, _, _, identities, result = conflicting_content
    query = ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'samples', 'sample_ids': identities}})
    before = ConsistencyReports(db).report(query)
    assert before.gold_excluded == 2
    assert before.gold.total == before.gold.conflicts == 2
    quality = next(item for item in result.annotation.differences if item.type == 'QUALITY_LABEL')
    ConsistencyReview(db).submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[quality.difference_id], reviewer='gold-reviewer', comment='核实同图异常',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': identities[0], 'quality': 'FAIL'}]}))
    after = ConsistencyReports(db).report(query)
    assert after.gold_excluded == 0 and after.gold.confirmed == 2
    assert ResultSnapshots(db).get(before.page.query_id).gold.conflicts == 2


def test_batch_audit_human_review_gold_split_and_reports_share_the_same_facts(conflicting_content, mllm_api, tmp_path):
    import json
    import time
    from pathlib import Path
    import yaml
    from iad_core.consistency.models import ConsistencyStart
    from iad_core.consistency.reports import ConsistencyReports
    from iad_core.consistency.result_models import ConsistencyQuery
    from iad_core.entry import sample_get, report_get
    from iad_core.tools.benchmark_tools import benchmark_build
    from iad_core.contracts import ToolStatus
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient

    db, _, config, identities, original = conflicting_content
    client, _, _ = mllm_api
    samples = SampleRepository(db)
    for name in ('normal', 'normal2'):
        sample = samples.get(config.dataset.id + ':' + name + '.png')
        sample.quality_status, sample.quality_source = 'PASS', 'production-fixture'
        samples.upsert(sample)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        started = runtime.consistency.start(ConsistencyStart(subjects={'kind': 'all_registered'}, request_id='full-workflow'))
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            batch = runtime.consistency.status(started.batch_id)
            if batch.status not in ('PENDING', 'RUNNING'):
                break
            time.sleep(.01)
        assert (batch.status, batch.completed, batch.total) == ('COMPLETED', 4, 4)
        pairs = runtime.consistency.results(batch.batch_id)
        assert len(pairs) == 1 and pairs[0].evidence_id == original.evidence_id
        query = ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}})
        before = ConsistencyReports(db).report(query)
        assert (before.gold.total, before.gold.conflicts, before.gold.confirmed) == (4, 2, 2)
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[identities[0]])
        runtime.audit.wait(job['run_id'], 10)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        detail = sample_get({'sample_id': identities[0]}, db.db_path)
        assert detail['suggestion']['suggested_label'] == 'PASS'
        proof = detail['consistency']['results'][0]
        assert proof['evidence_id'] == original.evidence_id
        assert any(item['type'] == 'QUALITY_LABEL' and item['confirmed_conflict'] for item in proof['annotation']['differences'])
        difference = next(item for item in original.annotation.differences if item.type == 'QUALITY_LABEL')
        decision = ConsistencyReview(db).submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=original.evidence_id,
            result_id=original.result_id, difference_ids=[difference.difference_id], reviewer='gold-reviewer',
            comment='受控流程选择图级FAIL，不修改原始标签或未修正区域',
            action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': identities[0], 'quality': 'FAIL'}]}))
        assert len(decision.review_decision_ids) == 1
        assert samples.get(identities[0]).quality_status == 'PASS'
        after = ConsistencyReports(db).report(query)
        assert (after.gold.total, after.gold.conflicts, after.gold.confirmed) == (4, 0, 4)
        assert before.gold.conflicts == 2
        config_path = tmp_path / 'workflow.yaml'
        config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
        built = benchmark_build(task_id=config.task.task_id, config_path=str(config_path), db_path=db.db_path,
            build_id='full-workflow', output_dir=str(tmp_path / 'benchmark'))
        assert built.status == ToolStatus.NOT_READY
        assert built.metrics['gold_count'] == 4 and built.metrics['leakage_passed']
        split = json.loads((tmp_path / 'benchmark/split.json').read_text())
        assert split['assignments'][identities[0]] == split['assignments'][identities[1]]
        exported = {record['sample_id']: record for record in map(json.loads, (tmp_path / 'benchmark/gold.jsonl').read_text().splitlines())}
        assert all(exported[identity]['binary_label'] == 'ANOMALY' and exported[identity]['annotations'] == [] for identity in identities)
        report = report_get({'dataset_id': config.dataset.id}, db.db_path)
        assert report['human_reviewed_count'] == 1
        assert ConsistencyService(db).evidence(original.evidence_id).result == original
    finally:
        runtime.close()


def test_unknown_annotation_policy_gold_does_not_read_unrelated_image_bytes(dataset, monkeypatch):
    from iad_core.gold.projection import GoldProjection
    from iad_core.consistency.retrieval_sources import SourceImage
    db, _, config = dataset
    reads = []
    original = SourceImage.read

    def record(path, published=None):
        reads.append(path)
        return original(path, published)

    monkeypatch.setattr(SourceImage, 'read', record)
    value = GoldProjection.capture(db, config.task.task_id, GoldPolicyConfig())
    assert len(value.records) == 4
    assert value.conflicts == []
    assert reads == [], '没有可比较规范或区域裁决时，Gold概览不应重读全库原图'
