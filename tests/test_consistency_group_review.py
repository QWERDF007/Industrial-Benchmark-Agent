from uuid import uuid4

import pytest
from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_results import ConsistencyAgentResults
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.dataset.folder_preview import preview_folder_dataset
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.task.config import FolderRule
from iad_core.workbench.runtime import WorkbenchRuntime


@pytest.fixture
def completed_groups(tmp_path):
    root = tmp_path / 'images'
    rules = [FolderRule(path=name, role=role) for name, role in
        [('main', 'normal'), ('same', 'normal'), ('different', 'anomaly')]]
    for rule in rules:
        (root / rule.path).mkdir(parents=True)
        Image.new('RGB', (40, 40), 'blue').save(root / rule.path / 'part.png')
    preview = preview_folder_dataset(str(root), rules=rules)
    db = Database(str(tmp_path / 'groups.db'))
    config = DatasetRegistry(db).import_dataset({'format': 'folder_classification', 'name': '整组复核',
        'root_dir': str(root), 'rules': [rule.model_dump() for rule in rules],
        'preview_fingerprint': preview.preview_fingerprint})
    runtime = WorkbenchRuntime(db)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchors = [config.dataset.id + ':' + rule.path + '/part.png' for rule in rules]
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': anchors}})['run_id']
        review = ConsistencyAgentReview(runtime)
        for anchor in anchors:
            checks.session_created(run_id, anchor)
            checks.retrieve(run_id, anchor)
            review.verify(run_id, anchor)
            review.finish_rules(run_id, anchor)
        runtime.jobs.finish_external(run_id)
        yield db, runtime, run_id, anchors
    finally:
        runtime.close()


def test_group_review_persists_one_decision_for_all_comparisons_without_changing_pair_reviews(completed_groups):
    from iad_core.consistency.group_review import ConsistencyGroupReview
    from iad_core.consistency.review import ConsistencyReview

    db, _, run_id, anchors = completed_groups
    reviews = ConsistencyGroupReview(db)
    context = reviews.context(run_id, anchors[0])
    assert context.disposition == 'pending'
    assert len(context.references) == 2
    request = {'client_request_id': str(uuid4()), 'result_fingerprint': context.result_fingerprint,
        'reviewer': 'user', 'comment': '确认主图整组存在标签冲突', 'action': {'kind': 'CONFIRM_DIFFERENCE'}}
    decision = reviews.submit(run_id, anchors[0], request)
    assert len(decision.references) == 2
    assert any(reference.difference_ids for reference in decision.references)
    assert len({reference.candidate_id for reference in decision.references}) == 2
    assert reviews.submit(run_id, anchors[0], request) == decision
    reopened = ConsistencyGroupReview(Database(db.db_path)).context(run_id, anchors[0])
    assert reopened.disposition == 'confirmed'
    assert reopened.decisions == [decision]
    assert reviews.context(run_id, anchors[1]).disposition == 'pending'
    results = ConsistencyAgentResults(db)
    assert next(item for item in results.gallery(run_id).items if item.group_id == anchors[0]).review_state == 'confirmed'
    for member in results.members(run_id, anchors[0]).items:
        assert ConsistencyReview(db).context(member.comparison.evidence_id).decisions == []
    with pytest.raises(ValueError, match='client_request_id'):
        reviews.submit(run_id, anchors[0], {**request, 'comment': '不同内容'})
    assert reviews.context(run_id, anchors[0]).decisions == [decision]


def test_group_review_rejects_stale_versions_and_incomplete_groups_and_tracks_latest_action(completed_groups):
    from iad_core.consistency.group_review import ConsistencyGroupReview

    db, runtime, run_id, anchors = completed_groups
    reviews = ConsistencyGroupReview(db)
    context = reviews.context(run_id, anchors[0])
    request = {'client_request_id': str(uuid4()), 'result_fingerprint': '0' * 64,
        'reviewer': 'user', 'comment': '整组复核依据', 'action': {'kind': 'CONFIRM_DIFFERENCE'}}
    with pytest.raises(ValueError, match='版本'):
        reviews.submit(run_id, anchors[0], request)
    assert reviews.context(run_id, anchors[0]).decisions == []
    for action, disposition in [('CONFIRM_DIFFERENCE', 'confirmed'), ('REJECT_DIFFERENCE', 'rejected'), ('NEEDS_CONTEXT', 'pending')]:
        reviews.submit(run_id, anchors[0], {**request, 'client_request_id': str(uuid4()),
            'result_fingerprint': context.result_fingerprint, 'action': {'kind': action}})
        assert reviews.context(run_id, anchors[0]).disposition == disposition
        assert next(item for item in ConsistencyAgentResults(db).gallery(run_id).items
            if item.group_id == anchors[0]).review_state == disposition
    second = ConsistencyAgentJobs(runtime).start({'submission_id': str(uuid4()),
        'dataset_ids': [anchors[0].split(':')[0]], 'mode': 'exact',
        'subjects': {'kind': 'samples', 'sample_ids': [anchors[0]]}})['run_id']
    with pytest.raises(ValueError, match='完成'):
        reviews.submit(second, anchors[0], {**request, 'client_request_id': str(uuid4())})
    with pytest.raises(ValueError, match='版本'):
        reviews.submit(run_id, anchors[1], {**request, 'client_request_id': str(uuid4()),
            'result_fingerprint': context.result_fingerprint})
    assert reviews.context(run_id, anchors[1]).decisions == []


def test_failed_group_review_write_rolls_back_without_changing_current_state(completed_groups):
    from iad_core.consistency.group_review import ConsistencyGroupReview

    db, _, run_id, anchors = completed_groups
    reviews = ConsistencyGroupReview(db)
    context = reviews.context(run_id, anchors[0])
    request = {'client_request_id': str(uuid4()), 'result_fingerprint': context.result_fingerprint,
        'reviewer': 'user', 'comment': '整组复核依据', 'action': {'kind': 'CONFIRM_DIFFERENCE'}}
    with db.connection() as connection:
        connection.execute("""CREATE TRIGGER reject_group_write AFTER INSERT ON consistency_group_decisions
            BEGIN SELECT RAISE(ABORT, 'injected storage failure'); END""")
    with pytest.raises(Exception, match='injected storage failure'):
        reviews.submit(run_id, anchors[0], request)
    assert reviews.context(run_id, anchors[0]).decisions == []
    with db.connection() as connection:
        connection.execute('DROP TRIGGER reject_group_write')
    assert reviews.submit(run_id, anchors[0], request).references == context.references


def test_retrieved_candidate_previews_preserve_frozen_branch_rank_and_media(completed_groups):
    db, _, run_id, anchors = completed_groups
    results = ConsistencyAgentResults(db)
    previews = results.candidates(run_id, anchors[0])
    assert previews.job_id == run_id
    assert previews.anchor_id == anchors[0]
    assert len(previews.items) == 2
    assert [item.rank for item in previews.items] == [1, 2]
    assert all(item.kind == 'exact' for item in previews.items)
    assert {item.sample_id for item in previews.items} == set(anchors[1:])
    assert all(item.image.sample.sample_id == item.sample_id for item in previews.items)
    assert all(item.annotations.sample_id == item.sample_id for item in previews.items)
    assert all(item.annotations.dataset_format == 'folder_classification' for item in previews.items)
    for item in previews.items:
        evidence = results.detail(run_id, anchors[0]).captured_evidence
        assert item.image.evidence_id in {record.evidence_id for record in evidence}


def test_all_images_are_frozen_job_subjects_with_real_pagination_and_unfinished_states(completed_groups):
    db, runtime, run_id, anchors = completed_groups
    results = ConsistencyAgentResults(db)
    pages = [results.images(run_id, page=index, page_size=2) for index in (1, 2)]
    assert [page.total for page in pages] == [3, 3]
    items = [item for page in pages for item in page.items]
    assert [item.summary.anchor_id for item in items] == [sample.sample_id for sample in results.snapshot(run_id).scopes.subjects.samples]
    assert all(item.summary.state == 'COMPLETED' for item in items)
    assert all(item.summary.program_conclusion == '类别不一致' for item in items)
    assert all(item.image.sample.sample_id == item.sample.sample_id for item in items)
    second = ConsistencyAgentJobs(runtime).start({'submission_id': str(uuid4()),
        'dataset_ids': [anchors[0].split(':')[0]], 'mode': 'exact',
        'subjects': {'kind': 'samples', 'sample_ids': [anchors[0]]}})['run_id']
    before = results.images(second)
    assert before.total == 1 and before.items[0].sample.sample_id == anchors[0]
    assert before.items[0].image is None
    assert before.items[0].summary.state == 'PENDING'
    assert before.items[0].summary.program_conclusion == '未完成'
    ConsistencyAgentJobs(runtime).cancel(second)
    assert results.images(second).items[0].summary.state == 'CANCELLED'
    assert results.images(second).items[0].summary.program_conclusion == '未完成'
