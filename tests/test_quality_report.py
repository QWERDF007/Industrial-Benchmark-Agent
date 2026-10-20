from pathlib import Path

from PIL import Image

from iad_core.entry import dataset_import, report_get, review_start_session, review_submit_decision


def test_quality_dimensions_include_rejected_images_and_distinguish_human_verification(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for name in ('valid', 'invalid-label', 'skipped', 'uncertain'):
        Image.new('RGB', (80, 60), 'gray').save(images / (name + '.png'))
    (images / 'unreadable.png').write_bytes(b'not an image')
    (labels / 'invalid-label.json').write_text('broken json')
    db_path = str(tmp_path / 'quality.db')
    imported = dataset_import({'name': '质量分项', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    scope = {'dataset_id': imported['dataset_id'], 'task_id': imported['task_id']}
    session = review_start_session({**scope, 'reviewer': '检验员'}, db_path)
    for name, decision in [('valid', 'HARD_NORMAL'), ('skipped', 'SKIP'), ('uncertain', 'UNCERTAIN')]:
        review_submit_decision({'session_id': session['session_id'],
            'sample_id': imported['dataset_id'] + ':' + name + '.png', 'decision': decision}, db_path)
    report = report_get(scope, db_path)
    quality = report['quality']
    assert quality['scope']['observed_inputs'] == 5
    assert quality['scope']['registered_samples'] == 4
    assert quality['scope']['unregistered_inputs'] == 1
    assert quality['technical_usability']['numerator'] == 3
    assert quality['technical_usability']['denominator'] == 5
    assert quality['technical_usability']['percent'] == 60
    assert quality['audit_coverage']['numerator'] == 0
    assert quality['audit_coverage']['denominator'] == 4
    assert quality['audit_coverage']['percent'] == 0
    assert quality['human_verification_coverage']['numerator'] == 1
    assert quality['human_verification_coverage']['denominator'] == 4
    assert quality['human_verification_coverage']['percent'] == 25
    assert report['human_reviewed_count'] == 3
    assert report['human_skipped_count'] == 1
    assert report['human_uncertain_count'] == 1
    assert quality['knowledge_versions'] == []
    assert all(dimension['basis'] for dimension in (quality['technical_usability'], quality['audit_coverage'], quality['human_verification_coverage']))
    assert 'total_score' not in quality
    assert 'accuracy' not in quality


def test_model_risks_missing_evidence_and_frozen_versions_remain_separate(dataset, mllm_api):
    from iad_core.entry import knowledge_get, sample_get
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient
    db, _, config = dataset
    client, _, responses = mllm_api
    normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        responses['VlmResult'].update(suggested_label='FAIL', confidence=0.99)
        first = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(first['run_id'], 5)
        assert runtime.audit.status(first['run_id'])['status'] == 'COMPLETED'
        original = sample_get({'sample_id': target}, db.db_path)
        report = report_get({'dataset_id': config.dataset.id}, db.db_path)
        quality = report['quality']
        assert quality['audit_coverage']['percent'] == 25
        assert quality['model']['suspect_samples'] == 1
        assert quality['model']['finding_count'] == len(original['suggestion']['analysis']['findings'])
        assert quality['model']['missing_evidence_samples'] == 0
        assert quality['model']['uncertain_samples'] == 0
        assert quality['knowledge_versions'] == [{'normal_version_id': normal['version_id'],
            'defect_version_id': None, 'legacy_profile_id': None, 'sample_count': 1}]
        assert quality['audit_run_ids'] == [first['run_id']]
        responses['VlmResult'].update(suggested_label='UNCERTAIN', confidence=0.01,
            missing_evidence=['反光遮挡，缺少补充角度'], conflicts=['位置判断存在冲突'])
        second = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(second['run_id'], 5)
        assert runtime.audit.status(second['run_id'])['status'] == 'COMPLETED'
        quality = report_get({'dataset_id': config.dataset.id}, db.db_path)['quality']
        assert quality['audit_coverage']['numerator'] == 1
        assert quality['audit_coverage']['percent'] == 25
        assert quality['model']['suspect_samples'] == 0
        assert quality['model']['missing_evidence_samples'] == 1
        assert quality['model']['conflict_samples'] == 1
        assert quality['model']['uncertain_samples'] == 1
        assert quality['model']['finding_count'] == 0
        assert quality['audit_run_ids'] == [second['run_id']]
        assert quality['knowledge_versions'][0]['sample_count'] == 1
        assert quality['human_verification_coverage']['percent'] == 0
        assert sample_get({'sample_id': target}, db.db_path)['review_decision'] is None
    finally:
        runtime.close()


def test_empty_and_intersected_scopes_never_claim_evaluated_quality(dataset, mllm_api):
    db, _, config = dataset
    mismatched = report_get({'dataset_id': config.dataset.id, 'task_id': 'unrelated'}, db.db_path)
    assert mismatched['total_samples'] == 0
    assert mismatched['quality']['scope']['observed_inputs'] == 0
    for dimension in ('technical_usability', 'audit_coverage', 'human_verification_coverage'):
        ratio = mismatched['quality'][dimension]
        assert ratio['numerator'] == 0
        assert ratio['denominator'] == 0
        assert ratio['percent'] is None
    empty = report_get({'task_id': 'empty'}, db.db_path)
    assert empty['quality']['scope']['limitations']
    assert empty['quality']['knowledge_versions'] == []
    assert empty['quality']['audit_run_ids'] == []


def test_human_coverage_uses_latest_submitted_decision(dataset):
    db, _, config = dataset
    scope = {'dataset_id': config.dataset.id, 'task_id': config.task.task_id}
    session = review_start_session({**scope, 'reviewer': '检验员'}, db.db_path)
    for decision in ['PASS', 'SKIP', 'FAIL']:
        review_submit_decision({'session_id': session['session_id'], 'sample_id': config.dataset.id + ':normal.png',
            'decision': decision}, db.db_path)
        quality = report_get(scope, db.db_path)['quality']
        assert quality['human_verification_coverage']['percent'] == (0 if decision == 'SKIP' else 25)
        assert quality['technical_usability']['percent'] == 100


def test_report_discloses_mixed_frozen_versions_instead_of_current_head(dataset, mllm_api):
    from iad_core.entry import knowledge_get
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient
    db, _, config = dataset
    client, _, responses = mllm_api
    original = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        first = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        runtime.audit.wait(first['run_id'], 5)
        assert runtime.audit.status(first['run_id'])['status'] == 'COMPLETED'
        with Image.open(Path(config.root) / 'normal2.png') as source:
            image = source.convert('RGB')
        image.putpixel((0, 0), (1, 2, 3))
        image.save(Path(config.root) / 'normal2.png')
        responses['KnowledgeDraft']['revisions'] = [{'previous_check_id': check['check_id'],
            'current_check_titles': [check['title']], 'reason': '重新观察变化后的来源，保留同一表面判据'}
            for check in original['checks']]
        mining = runtime.knowledge.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':normal.png', config.dataset.id + ':normal2.png'])
        runtime.knowledge.wait(mining['run_id'], 5)
        updated = runtime.knowledge.status(mining['run_id'])
        assert updated['status'] == 'COMPLETED', updated['errors']
        assert updated['knowledge_version_id'] != original['version_id']
        quality = report_get({'dataset_id': config.dataset.id}, db.db_path)['quality']
        assert quality['knowledge_versions'][0]['normal_version_id'] == original['version_id']
        second = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':scratch.png'])
        runtime.audit.wait(second['run_id'], 5)
        assert runtime.audit.status(second['run_id'])['status'] == 'COMPLETED'
        quality = report_get({'dataset_id': config.dataset.id}, db.db_path)['quality']
        assert quality['audit_coverage']['percent'] == 50
        assert {usage['normal_version_id'] for usage in quality['knowledge_versions']} == {
            original['version_id'], updated['knowledge_version_id']}
        assert [usage['sample_count'] for usage in quality['knowledge_versions']] == [1, 1]
        assert set(quality['audit_run_ids']) == {first['run_id'], second['run_id']}
    finally:
        runtime.close()
