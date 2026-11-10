import json
from uuid import uuid4

import httpx
import pytest
from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize(('main_role', 'candidate_role', 'expected'), [
    ('normal', 'normal', 'passed'), ('anomaly', 'anomaly', 'passed'),
    ('normal', 'anomaly', 'discrepancy'), ('anomaly', 'normal', 'discrepancy')])
def test_imported_directory_labels_are_compared_without_model_calls(tmp_path, main_role, candidate_role, expected):
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database
    from iad_core.task.config import FolderRule
    from iad_core.workbench.calls import ModelCalls

    root = tmp_path / 'classified'
    for side in ('main', 'candidate'):
        (root / side).mkdir(parents=True)
        Image.new('RGB', (40, 40), 'blue').save(root / side / 'part.png')
    rules = [FolderRule(path='main', role=main_role), FolderRule(path='candidate', role=candidate_role)]
    preview = preview_folder_dataset(str(root), rules=rules)
    database = Database(str(tmp_path / 'classification.db'))
    config = DatasetRegistry(database).import_dataset({'format': 'folder_classification', 'name': '目录分类',
        'root_dir': str(root), 'rules': [rule.model_dump() for rule in rules], 'preview_fingerprint': preview.preview_fingerprint})
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':main/part.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime)
        review.verify(run_id, anchor)
        result = review.finish_rules(run_id, anchor)
        assert result.result == expected
        assert result.candidate_stats.assessed == 1
        from iad_core.consistency.agent_results import ConsistencyAgentResults
        assert ConsistencyAgentResults(database).detail(run_id, anchor).program_conclusion == ('类别不一致' if expected == 'discrepancy' else '一致')
        assert [issue.type for issue in result.issues] == (['image_label_mismatch'] if expected == 'discrepancy' else [])
        assert ModelCalls(database).list(run_id) == []
    finally:
        runtime.close()


def test_bbox_review_retains_multiple_independent_issues_with_real_ids(dataset):
    from pathlib import Path
    from iad_core.storage.repositories import SampleRepository

    database, registry, config = dataset
    sample = SampleRepository(database).get(config.dataset.id + ':scratch.png')
    labels = Path(config.annotations.root) / 'scratch.json'
    raw = json.loads(labels.read_text())
    raw['shapes'][0]['points'] = [[8, 8], [30, 30]]
    labels.write_text(json.dumps(raw))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        parts = json.loads(request.content)['messages'][-1]['content']
        facts = json.loads(parts[1]['text'])['facts']
        identity = next(iter(facts['candidates']))
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'observations': [{'candidate_id': identity, 'description': '同一对象的类别与覆盖范围不同。',
                'media_ids': facts['required_image_ids'][identity], 'limitations': []}]})}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        selected = checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime, client)
        observed = review.observe(run_id, anchor, {'request_id': 'actual-view', 'fingerprint': selected.fingerprint,
            'candidate_ids': [sample.sample_id], 'question': '比较同一对象的原始标注。'})
        evidence_id = observed.request.facts['candidates'][sample.sample_id]['comparison']['evidence_id']
        frozen = runtime.consistency_service.evidence(evidence_id)
        issue = dict(main_annotation_ids=[frozen.sources.left.annotations.annotations[0].annotation_id],
            candidate_annotation_ids=[frozen.sources.right.annotations.annotations[0].annotation_id],
            media_ids=observed.result.observations[0].media_ids)
        record = review.assess(run_id, anchor, {'fingerprint': selected.fingerprint,
            'observation_ids': [observed.observation_id], 'assessment': {'candidate_id': sample.sample_id,
                'verdict': 'MATERIAL', 'explanation': '类别不同，且框覆盖不同。', 'issues': [
                    dict(issue, type='category_mismatch', description='同一对象的原始类别不同。'),
                    dict(issue, type='position_difference', description='主图与候选对同一对象的覆盖边界不同。')]}})
        result = review.finalize(run_id, anchor, {'fingerprint': selected.fingerprint, 'assessment_ids': [record.assessment_id]})
        assert result.result == 'discrepancy'
        assert [item.type for item in result.issues] == ['category_mismatch', 'position_difference']
        assert all(item.supporting_assessment_ids == [record.assessment_id] for item in result.issues)
        assert result.candidate_stats.assessed == 1
        assert checks.anchor(run_id, anchor).result == result
    finally:
        client.close()
        runtime.close()
