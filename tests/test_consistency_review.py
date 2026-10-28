from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
from uuid import uuid4, uuid5

import pytest

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.review_models import ConsistencyReviewSubmission
from iad_core.consistency.service import ConsistencyService
from iad_core.entry import sample_get


def test_expected_policy_difference_closes_review_without_erasing_facts_or_sources(dataset):
    db, _, config = dataset
    service = ConsistencyService(db)
    result = service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    difference = next(item for item in result.annotation.differences if item.type == 'CATEGORY')
    sources = {path: path.read_bytes() for path in Path(config.annotations.root).glob('*.json')}
    reviews = ConsistencyReview(db)
    request = ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='产线复核人',
        action={'kind': 'EXPECTED_POLICY_DIFFERENCE'}, comment='双方按不同产品规范标注')
    saved = reviews.submit(request)
    assert reviews.submit(request) == saved
    context = reviews.context(result.evidence_id)
    status = next(item for item in context.differences if item.difference_id == difference.difference_id)
    assert status.review_state == 'RESOLVED'
    assert status.correction_state == 'NOT_REQUIRED'
    assert len(context.decisions) == 1
    assert saved.review_decision_ids == []
    assert service.evidence(result.evidence_id).result == result
    assert all(path.read_bytes() == value for path, value in sources.items())
    from iad_core.consistency.context import ConsistencyContexts
    from iad_core.consistency.context_models import ConsistencyContextRequest
    explanation = ConsistencyContexts(db).get(ConsistencyContextRequest(evidence_id=result.evidence_id, result_id=result.result_id))
    assert explanation.review_context.decisions[0].decision_id == saved.decision_id
    assert next(item for item in explanation.review_context.differences if item.difference_id == difference.difference_id).review_state == 'RESOLVED'


def test_quality_decision_uses_existing_review_writer_once_for_explicit_targets(dataset):
    db, _, config = dataset
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    service = ConsistencyService(db)
    result = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    difference = next(item for item in result.annotation.differences if item.type == 'CATEGORY')
    review = ConsistencyReview(db)
    request = ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='质检', comment='仅裁决当前图',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': left, 'quality': 'PASS'}]})
    with ThreadPoolExecutor(max_workers=2) as pool:
        saved = list(pool.map(review.submit, [request, request]))
    assert saved[0] == saved[1]
    detail = sample_get({'sample_id': left}, db.db_path)
    assert detail['review_decision']['decision'] == 'PASS'
    assert len(detail['review_history']) == 1
    assert saved[0].review_decision_ids == [detail['review_decision']['decision_id']]
    assert detail['sample']['quality_status'] == 'UNCERTAIN'
    assert sample_get({'sample_id': right}, db.db_path)['review_history'] == []
    assert service.evidence(result.evidence_id).result.annotation.differences
    changed = request.model_copy(update={'comment': '不可复用原请求'})
    with pytest.raises(ValueError, match='client_request_id'):
        review.submit(changed)


def test_region_proposal_requires_real_source_fix_and_rescan_before_verified(dataset):
    from iad_core.consistency.review_models import CorrectionVerification
    db, registry, config = dataset
    config.annotations.policy_id = 'same'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    service = ConsistencyService(db)
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    result = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    difference = next(item for item in result.annotation.differences if item.type == 'CATEGORY')
    target = difference.right[0]
    source = Path(config.annotations.root) / 'scratch.json'
    original = source.read_bytes()
    review = ConsistencyReview(db)
    decision = review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='区域复核人', comment='统一为凹陷',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [{'operation': 'relabel', 'sample_id': right,
            'annotation_id': target.annotation_id, 'category': 'dent'}]}))
    assert source.read_bytes() == original
    assert sample_get({'sample_id': right}, db.db_path)['annotations'][0]['raw_label'] == 'scratch'
    status = next(item for item in review.context(result.evidence_id).differences if item.difference_id == difference.difference_id)
    assert status.correction_state == 'PROPOSED'
    review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='规范复核人', comment='还需补充规范来源',
        action={'kind': 'NEEDS_CONTEXT'}))
    needs = next(item for item in review.context(result.evidence_id).differences if item.difference_id == difference.difference_id)
    assert needs.review_state == 'NEEDS_CONTEXT' and needs.correction_state == 'PROPOSED'
    attempted = review.verify(CorrectionVerification(client_request_id=uuid4(), decision_id=decision.decision_id,
        evidence_id=result.evidence_id, reviewer='区域复核人'))
    assert attempted.correction_state == 'AWAITING_RESCAN'
    data = json.loads(original)
    data['shapes'][0]['label'] = 'dent'
    source.write_text(json.dumps(data))
    registry.rescan(config.dataset.id)
    corrected = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    assert corrected.annotation.differences == []
    request = CorrectionVerification(client_request_id=uuid4(), decision_id=decision.decision_id,
        evidence_id=corrected.evidence_id, reviewer='区域复核人')
    verified = review.verify(request)
    assert verified.correction_state == 'VERIFIED'
    assert review.verify(request) == verified
    status = next(item for item in review.context(result.evidence_id).differences if item.difference_id == difference.difference_id)
    assert status.correction_state == 'VERIFIED' and status.review_state == 'NEEDS_CONTEXT'
    assert service.evidence(result.evidence_id).result == result


def test_second_target_failure_rolls_back_both_quality_and_consistency_events(dataset):
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    db, _, config = dataset
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    request_id = uuid4()
    HumanReview(db).submit(ReviewSubmission(submission_id=uuid5(request_id, right), dataset_id=config.dataset.id,
        sample_id=right, reviewer='原复核人', decision='PASS'))
    result = ConsistencyService(db).compare(ConsistencyCompare(sample_a=left, sample_b=right))
    difference = next(item for item in result.annotation.differences if item.type == 'CATEGORY')
    review = ConsistencyReview(db)
    request = ConsistencyReviewSubmission(client_request_id=request_id, evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='新复核人', comment='批量裁决',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [
            {'sample_id': left, 'quality': 'FAIL'}, {'sample_id': right, 'quality': 'FAIL'}]})
    with pytest.raises(ValueError, match='different review content'):
        review.submit(request)
    assert sample_get({'sample_id': left}, db.db_path)['review_history'] == []
    assert len(sample_get({'sample_id': right}, db.db_path)['review_history']) == 1
    assert review.context(result.evidence_id).decisions == []


def test_region_proposal_does_not_apply_old_annotation_index_to_changed_source(dataset):
    db, registry, config = dataset
    result = ConsistencyService(db).compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    difference = next(item for item in result.annotation.differences if item.type == 'CATEGORY')
    source = Path(config.annotations.root) / 'scratch.json'
    data = json.loads(source.read_text())
    data['shapes'][0]['label'] = 'changed-before-click'
    source.write_text(json.dumps(data))
    registry.rescan(config.dataset.id)
    request = ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='复核人', comment='旧区域请求',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [{'operation': 'remove', 'sample_id': config.dataset.id + ':scratch.png',
            'annotation_id': difference.right[0].annotation_id}]})
    with pytest.raises(ValueError, match='重新比较'):
        ConsistencyReview(db).submit(request)
    assert json.loads(source.read_text())['shapes'][0]['label'] == 'changed-before-click'


def test_report_freezes_review_and_correction_counts_without_erasing_differences(dataset):
    from iad_core.consistency.reports import ConsistencyReports
    from iad_core.consistency.result_models import ConsistencyQuery
    db, _, config = dataset
    result = ConsistencyService(db).compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
    request = ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}})
    reports = ConsistencyReports(db)
    before = reports.report(request)
    assert before.pending_review == len(result.annotation.differences)
    assert before.pending_correction == 0
    ConsistencyReview(db).submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[item.difference_id for item in result.annotation.differences],
        reviewer='统计复核人', comment='确认差异，待源文件修正', action={'kind': 'CONFIRM_DIFFERENCE'}))
    after = reports.report(request)
    assert after.pending_review == 0
    assert after.pending_correction == len(result.annotation.differences)
    assert after.statistics.current.differences == before.statistics.current.differences
    assert reports.report(ConsistencyQuery(selection=request.selection, review_state='OPEN')).page.total == 0
    assert reports.report(ConsistencyQuery(selection=request.selection, correction_state='PROPOSED')).page.total == 1
    from iad_core.consistency.result_snapshot import ResultSnapshots
    assert ResultSnapshots(db).get(before.page.query_id).statistics.current.pending_correction == 0


@pytest.mark.parametrize('operation', ['add', 'remove', 'reshape'])
def test_region_operations_verify_actual_annotation_contents_after_rescan(dataset, operation):
    from iad_core.consistency.review_models import CorrectionVerification
    db, registry, config = dataset
    config.annotations.policy_id = 'same'
    config.annotations.annotation_role = 'REFERENCE'
    config.annotations.annotation_coverage = 'EXHAUSTIVE'
    registry.save(config, require_existing=True)
    labels = Path(config.annotations.root)
    left_path, right_path = labels / 'dent.json', labels / 'scratch.json'
    template = json.loads(left_path.read_text())
    if operation in ('add', 'remove'):
        left_path.write_text(json.dumps({**template, 'shapes': []}))
        right_path.write_text(json.dumps(template))
    else:
        moved = json.loads(json.dumps(template))
        moved['shapes'][0]['points'] = [[40, 40], [60, 60]]
        right_path.write_text(json.dumps(moved))
    registry.rescan(config.dataset.id)
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    service = ConsistencyService(db)
    result = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    difference = next(item for item in result.annotation.differences if item.type != 'POLICY_UNCONFIRMED' and (operation == 'add' or item.right))
    change = {'operation': operation, 'sample_id': left if operation == 'add' else right}
    if operation != 'add':
        change['annotation_id'] = difference.right[0].annotation_id
    if operation in ('add', 'reshape'):
        change['geometry'] = {'kind': 'bbox', 'coordinates': [10, 10, 30, 30]}
    if operation == 'add':
        change['category'] = 'dent'
    review = ConsistencyReview(db)
    decision = review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[difference.difference_id], reviewer='修正验收人', comment='按原图核实区域',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [change]}))
    if operation == 'add':
        left_path.write_text(json.dumps(template))
    else:
        right_path.write_text(json.dumps(template if operation == 'reshape' else {**template, 'shapes': []}))
    registry.rescan(config.dataset.id)
    after = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    assert after.annotation.differences == []
    checked = review.verify(CorrectionVerification(client_request_id=uuid4(), decision_id=decision.decision_id,
        evidence_id=after.evidence_id, reviewer='修正验收人'))
    assert checked.correction_state == 'VERIFIED'


def test_matching_new_annotation_index_does_not_verify_an_unapplied_old_proposal(dataset):
    from iad_core.consistency.review_models import CorrectionVerification
    db, registry, config = dataset
    config.annotations.policy_id = 'same'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    service = ConsistencyService(db)
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    before = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    difference = next(item for item in before.annotation.differences if item.type == 'CATEGORY')
    review = ConsistencyReview(db)
    decision = review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=before.evidence_id,
        result_id=before.result_id, difference_ids=[difference.difference_id], reviewer='复核人', comment='改原区域类别',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [{'operation': 'relabel', 'sample_id': right,
            'annotation_id': difference.right[0].annotation_id, 'category': 'dent'}]}))
    for name in ('dent', 'scratch'):
        path = Path(config.annotations.root) / (name + '.json')
        data = json.loads(path.read_text())
        data['shapes'][0].update(label='dent', points=[[40, 40], [60, 60]])
        path.write_text(json.dumps(data))
    registry.rescan(config.dataset.id)
    after = service.compare(ConsistencyCompare(sample_a=left, sample_b=right))
    assert after.annotation.differences == []
    check = review.verify(CorrectionVerification(client_request_id=uuid4(), decision_id=decision.decision_id,
        evidence_id=after.evidence_id, reviewer='复核人'))
    assert check.correction_state == 'AWAITING_RESCAN'


@pytest.mark.parametrize('quality,expected', [('FAIL', 'RESOLVED'), ('PASS', 'OPEN'), ('UNCERTAIN', 'OPEN')])
def test_quality_difference_only_resolves_when_explicit_effective_decisions_agree(dataset, quality, expected):
    from iad_core.storage.repositories import SampleRepository
    db, registry, config = dataset
    config.annotations.policy_id = 'same'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    left, right = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    samples = SampleRepository(db)
    for identity, label in ((left, 'PASS'), (right, 'FAIL')):
        sample = samples.get(identity)
        sample.quality_status, sample.quality_source = label, 'production-fixture'
        samples.upsert(sample)
    result = ConsistencyService(db).compare(ConsistencyCompare(sample_a=left, sample_b=right))
    quality_difference = next(item for item in result.annotation.differences if item.type == 'QUALITY_LABEL')
    review = ConsistencyReview(db)
    review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=result.evidence_id,
        result_id=result.result_id, difference_ids=[quality_difference.difference_id], reviewer='质量复核人', comment='明确当前样本质量',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': left, 'quality': quality}]}))
    context = review.context(result.evidence_id)
    assert next(item for item in context.differences if item.difference_id == quality_difference.difference_id).review_state == expected
    assert next(item for item in context.differences if item.difference_id != quality_difference.difference_id).review_state == 'OPEN'
    assert sample_get({'sample_id': left}, db.db_path)['sample']['quality_status'] == 'PASS'
