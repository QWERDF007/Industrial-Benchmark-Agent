from uuid import uuid4

from PIL import Image

from iad_core.entry import dataset_import, report_get, review_submit_decision
from iad_core.storage.database import Database


def test_quality_dimensions_include_rejected_images_and_distinguish_human_verification(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for name in ('valid', 'invalid-label', 'skipped', 'uncertain'):
        Image.new('RGB', (80, 60), 'gray').save(images / (name + '.png'))
    (images / 'unreadable.png').write_bytes(b'not an image')
    (labels / 'invalid-label.json').write_text('broken json')
    db_path = str(tmp_path / 'quality.db')
    imported = dataset_import({'format': 'labelme', 'name': '质量分项', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    scope = {'dataset_id': imported['dataset_id'], 'task_id': imported['task_id']}
    for name, decision in [('valid', 'HARD_NORMAL'), ('skipped', 'SKIP'), ('uncertain', 'UNCERTAIN')]:
        review_submit_decision({'submission_id': str(uuid4()), 'dataset_id': scope['dataset_id'], 'reviewer': '检验员',
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


def test_model_risks_missing_evidence_and_frozen_versions_remain_separate(native_knowledge_versions, advisory_record):
    from iad_core.entry import sample_get
    db, dataset_id, publications = native_knowledge_versions
    version_id = publications[0].version_id
    target = dataset_id + ':dent.png'
    first = advisory_record(db, target, label='FAIL', knowledge_version_id=version_id, finding_count=3)
    original = sample_get({'sample_id': target}, db.db_path)
    quality = report_get({'dataset_id': dataset_id}, db.db_path)['quality']
    assert quality['audit_coverage']['percent'] == 25
    assert quality['model']['suspect_samples'] == 1
    assert quality['model']['finding_count'] == len(original['suggestion']['analysis']['findings']) == 3
    assert quality['model']['missing_evidence_samples'] == 0
    assert quality['model']['uncertain_samples'] == 0
    assert quality['knowledge_versions'] == [{'knowledge_version_id': version_id, 'legacy_profile_id': None, 'sample_count': 1}]
    assert quality['audit_run_ids'] == [first.audit_run_id]
    second = advisory_record(db, target, label='UNCERTAIN', knowledge_version_id=version_id,
        missing_evidence=['缺少补充角度'], conflicts=['位置判断存在冲突'])
    quality = report_get({'dataset_id': dataset_id}, db.db_path)['quality']
    assert quality['audit_coverage']['numerator'] == 1
    assert quality['audit_coverage']['percent'] == 25
    assert quality['model']['suspect_samples'] == 0
    assert quality['model']['missing_evidence_samples'] == 1
    assert quality['model']['conflict_samples'] == 1
    assert quality['model']['uncertain_samples'] == 1
    assert quality['model']['finding_count'] == 0
    assert quality['audit_run_ids'] == [second.audit_run_id]
    assert quality['knowledge_versions'][0]['sample_count'] == 1
    assert quality['human_verification_coverage']['percent'] == 0
    assert sample_get({'sample_id': target}, db.db_path)['review_decision'] is None


def test_empty_and_intersected_scopes_never_claim_evaluated_quality(dataset):
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
    for decision in ['PASS', 'SKIP', 'FAIL']:
        review_submit_decision({'submission_id': str(uuid4()), 'dataset_id': scope['dataset_id'], 'reviewer': '检验员', 'sample_id': config.dataset.id + ':normal.png',
            'decision': decision}, db.db_path)
        quality = report_get(scope, db.db_path)['quality']
        assert quality['human_verification_coverage']['percent'] == (0 if decision == 'SKIP' else 25)
        assert quality['technical_usability']['percent'] == 100


def test_report_discloses_mixed_frozen_versions_instead_of_current_head(native_knowledge_versions, advisory_record):
    db, dataset_id, publications = native_knowledge_versions
    original, updated = (publication.version_id for publication in publications)
    first = advisory_record(db, dataset_id + ':dent.png', knowledge_version_id=original)
    quality = report_get({'dataset_id': dataset_id}, db.db_path)['quality']
    assert quality['knowledge_versions'][0]['knowledge_version_id'] == original
    second = advisory_record(db, dataset_id + ':scratch.png', knowledge_version_id=updated)
    quality = report_get({'dataset_id': dataset_id}, db.db_path)['quality']
    assert quality['audit_coverage']['percent'] == 50
    assert {usage['knowledge_version_id'] for usage in quality['knowledge_versions']} == {original, updated}
    assert [usage['sample_count'] for usage in quality['knowledge_versions']] == [1, 1]
    assert set(quality['audit_run_ids']) == {first.audit_run_id, second.audit_run_id}


def test_folder_label_comparison_and_inconsistency_ratio(tmp_path, advisory_record):
    from iad_core.entry import dataset_preview, dataset_scan
    root = tmp_path / 'folder_ds'
    for directory in ('good', 'bad', 'unknown'):
        (root / directory).mkdir(parents=True)
    for name, color in [('good/s1', 'white'), ('good/s2', (254, 254, 254)), ('bad/s3', 'red'), ('unknown/s4', 'gray')]:
        Image.new('RGB', (100, 100), color).save(root / (name + '.png'))
    db_path = str(tmp_path / 'comparison.db')
    preview = dataset_preview({'root_dir': str(root)}, db_path)
    imported = dataset_import({'format': 'folder_classification', 'name': '目录对照测试', 'root_dir': str(root),
        'rules': [{'path': item['path'], 'role': item['role']} for item in preview['items']],
        'preview_fingerprint': preview['preview_fingerprint']}, db_path)
    dataset_id = imported['dataset_id']
    scope = {'dataset_id': dataset_id}
    before = report_get(scope, db_path)['quality']['label_comparison']
    assert (before['raw_ok'], before['raw_ng'], before['raw_unlabeled'], before['unaudited']) == (2, 1, 1, 4)
    assert before['inconsistency_ratio']['percent'] is None
    db = Database(db_path)
    for label, paths in [('PASS', ['good/s1', 'bad/s3']), ('FAIL', ['good/s2']), ('UNCERTAIN', ['unknown/s4'])]:
        for path in paths:
            advisory_record(db, dataset_id + ':' + path + '.png', label=label)
    Image.new('RGB', (100, 100), 'blue').save(root / 'good/s1.png')
    dataset_scan(scope, db_path)
    lc = report_get(scope, db_path)['quality']['label_comparison']
    assert (lc['raw_ok'], lc['raw_ng'], lc['raw_unlabeled']) == (2, 1, 1)
    assert (lc['model_pass'], lc['model_fail'], lc['model_uncertain'], lc['unaudited']) == (2, 1, 1, 0)
    assert lc['source_changed_count'] == 1
    assert lc['source_unverified_count'] == 0
    assert lc['inconsistency_ratio']['denominator'] == 2
    assert lc['inconsistency_ratio']['numerator'] == 2
    assert lc['inconsistency_ratio']['percent'] == 100


def test_unstructured_advisory_does_not_claim_complete_evidence(dataset, advisory_record):
    db, _, config = dataset
    advisory_record(db, config.dataset.id + ':dent.png', structured=False)
    model = report_get({'dataset_id': config.dataset.id}, db.db_path)['quality']['model']
    assert model['unstructured_samples'] == 1
    assert model['missing_evidence_samples'] == 0
