from uuid import uuid4

from PIL import Image
import pytest

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.entry import dataset_preview, dataset_import, dataset_scan, report_get, review_submit_decision, sample_get
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database


@pytest.fixture
def folder_dataset(tmp_path):
    root = tmp_path / 'folder_loop'
    for directory in ('good', 'bad'):
        (root / directory).mkdir(parents=True)
    for name, color in [('good/part-1', 'white'), ('good/part-1b', (254, 254, 254)), ('bad/part-2', 'red')]:
        Image.new('RGB', (100, 100), color).save(root / (name + '.png'))
    db_path = str(tmp_path / 'closed_loop.db')
    rules = [{'role': 'normal', 'path': 'good'}, {'role': 'anomaly', 'path': 'bad'}]
    preview = dataset_preview({'root_dir': str(root), 'rules': rules}, db_path)
    imported = dataset_import({'format': 'folder_classification', 'name': '来源变更验证', 'root_dir': str(root),
        'rules': rules, 'preview_fingerprint': preview['preview_fingerprint']}, db_path)
    return Database(db_path), imported['dataset_id'], root


def test_folder_source_change_excludes_old_advisory_until_new_source_is_observed(folder_dataset, advisory_record):
    db, dataset_id, root = folder_dataset
    first = [advisory_record(db, dataset_id + ':' + name + '.png') for name in ('good/part-1', 'bad/part-2')]
    scope = {'dataset_id': dataset_id}
    initial = report_get(scope, db.db_path)['quality']
    assert initial['audit_coverage']['numerator'] == 2
    assert initial['audit_coverage']['denominator'] == 3
    assert initial['audit_coverage']['percent'] == pytest.approx(200 / 3, abs=.01)
    assert initial['label_comparison']['source_changed_count'] == 0
    original = first[0].source_fingerprint
    Image.new('RGB', (100, 100), 'yellow').save(root / 'good/part-1.png')
    dataset_scan(scope, db.db_path)
    assert SampleContent.capture(db, first[0].sample_id).fingerprint != original
    changed = report_get(scope, db.db_path)['quality']['label_comparison']
    assert changed['source_changed_count'] == 1
    assert changed['inconsistency_ratio']['denominator'] == 1
    updated = [advisory_record(db, dataset_id + ':' + name + '.png')
        for name in ('good/part-1', 'good/part-1b', 'bad/part-2')]
    final = report_get(scope, db.db_path)['quality']
    assert final['audit_coverage']['percent'] == 100
    assert final['label_comparison']['source_changed_count'] == 0
    assert final['label_comparison']['inconsistency_ratio']['denominator'] == 3
    assert set(final['audit_run_ids']) == {item.audit_run_id for item in updated}
    assert AuditSuggestionRepository(db).get(first[0].suggestion_id).source_fingerprint == original
    assert sample_get({'sample_id': first[0].sample_id}, db.db_path)['suggestion']['suggestion_id'] == updated[0].suggestion_id


def test_folder_mapping_change_preserves_human_review_and_invalidates_prior_source(folder_dataset, advisory_record):
    db, dataset_id, root = folder_dataset
    scope = {'dataset_id': dataset_id}
    sample_a, sample_b = dataset_id + ':good/part-1.png', dataset_id + ':bad/part-2.png'
    review_submit_decision({'submission_id': str(uuid4()), 'dataset_id': dataset_id, 'reviewer': '质检工程师',
        'sample_id': sample_a, 'decision': 'PASS', 'comment': '确认良品'}, db.db_path)
    for name in ('good/part-1', 'good/part-1b', 'bad/part-2'):
        advisory_record(db, dataset_id + ':' + name + '.png')
    initial = report_get(scope, db.db_path)
    assert initial['human_reviewed_count'] == 1
    assert initial['quality']['human_verification_coverage']['numerator'] == 1
    assert initial['quality']['human_verification_coverage']['denominator'] == 3
    assert initial['quality']['label_comparison']['source_changed_count'] == 0
    assert initial['quality']['label_comparison']['inconsistency_ratio']['denominator'] == 3
    Image.new('RGB', (100, 100), 'blue').save(root / 'bad/part-2.png')
    dataset_scan(scope, db.db_path)
    changed = report_get(scope, db.db_path)['quality']['label_comparison']
    assert changed['source_changed_count'] == 1
    assert changed['inconsistency_ratio']['denominator'] == 2
    Image.new('RGB', (100, 100), 'red').save(root / 'bad/part-2.png')
    dataset_scan(scope, db.db_path)
    assert report_get(scope, db.db_path)['quality']['label_comparison']['source_changed_count'] == 0
    (root / 'bad/part-2.png').write_bytes(b'not an image')
    dataset_scan(scope, db.db_path)
    unavailable = report_get(scope, db.db_path)['quality']['label_comparison']
    assert unavailable['source_changed_count'] == 1
    assert unavailable['inconsistency_ratio']['denominator'] == 2
    Image.new('RGB', (100, 100), 'red').save(root / 'bad/part-2.png')
    dataset_scan(scope, db.db_path)
    rules = [{'role': 'anomaly', 'path': 'good'}, {'role': 'anomaly', 'path': 'bad'}]
    preview = dataset_preview({'root_dir': str(root), 'rules': rules}, db.db_path)
    dataset_scan({**scope, 'rules': rules, 'preview_fingerprint': preview['preview_fingerprint']}, db.db_path)
    detail = sample_get({'sample_id': sample_a}, db.db_path)
    assert detail['review_decision']['decision'] == 'PASS'
    assert detail['review_decision']['reviewer'] == '质检工程师'
    assert detail['sample']['quality_status'] == 'FAIL'
    comparison = report_get(scope, db.db_path)['quality']['label_comparison']
    assert comparison['source_changed_count'] == 2
    assert comparison['inconsistency_ratio']['denominator'] == comparison['inconsistency_ratio']['numerator'] == 1
    assert comparison['inconsistency_ratio']['percent'] == 100
    for name in ('good/part-1', 'good/part-1b', 'bad/part-2'):
        advisory_record(db, dataset_id + ':' + name + '.png')
    final = report_get(scope, db.db_path)
    assert final['human_reviewed_count'] == 1
    assert final['quality']['label_comparison']['source_changed_count'] == 0
    assert final['quality']['label_comparison']['inconsistency_ratio']['denominator'] == 3
    assert sample_get({'sample_id': sample_b}, db.db_path)['review_decision'] is None
