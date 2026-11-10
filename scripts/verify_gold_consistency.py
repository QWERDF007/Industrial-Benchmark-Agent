"""Verify Gold and split gates on local industrial copies with controlled labels."""

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image
import yaml

from iad_core.benchmark.builder import run_benchmark_pipeline
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.review_models import ConsistencyReviewSubmission, CorrectionVerification
from iad_core.consistency.service import ConsistencyService
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.repository import load_leakage_relations
from iad_core.duplicate.pair_repository import PairObservations
from iad_core.duplicate.verify import PairVerifier
from iad_core.gold.builder import build_gold
from iad_core.split.group import build_split_groups
from iad_core.split.builder import build_group_split
from iad_core.split.leakage import check_leakage
from iad_core.storage.database import Database
from iad_core.storage.repositories import BenchmarkRepository, GoldRepository, SampleRepository


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    if any(args.output_dir.iterdir()):
        parser.error('Use a fresh output directory to retain previous verification evidence')
    with Image.open(args.image) as original:
        width, height = original.size
    root = args.output_dir / 'workspace'
    root.mkdir(parents=True, exist_ok=True)
    images = root / 'images'
    images.mkdir()
    for name, category in [('left', 'surface-a'), ('right', 'surface-b')]:
        shutil.copyfile(args.image, images / (name + args.image.suffix))
        (images / (name + '.json')).write_text(json.dumps({'imageWidth': width, 'imageHeight': height,
            'shapes': [{'label': category, 'shape_type': 'rectangle', 'points': [[width // 4, height // 4], [width // 2, height // 2]]}]}))
    db = Database(str(root / 'benchmark.db'))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(format='labelme', name='本地工业图Gold闭环', image_dir=str(images), annotation_dir=str(images),
        annotation_policy={'policy_id': 'controlled-production-policy', 'annotation_role': 'REFERENCE', 'annotation_coverage': 'EXHAUSTIVE'}))
    config.gold.trusted_quality_sources = ['controlled-production']
    config.gold.trusted_reviewers = ['local-gold-verification']
    registry.save(config, require_existing=True)
    identities = [config.dataset.id + ':' + name + args.image.suffix for name in ('left', 'right')]
    observation = PairObservations(db).verify(*identities, verifier=PairVerifier())
    assert observation.verification.relation == 'EXACT'
    assert PairObservations(db).current(config.task.task_id) == [observation]
    samples = SampleRepository(db)
    for identity, label in zip(identities, ['PASS', 'FAIL']):
        sample = samples.get(identity)
        sample.quality_status, sample.quality_source = label, 'controlled-production'
        samples.upsert(sample)
    service, reviews = ConsistencyService(db), ConsistencyReview(db)
    pair = ConsistencyCompare(sample_a=identities[0], sample_b=identities[1])
    compared = service.compare(pair)
    before = build_gold(config.task.task_id, policy=config.gold, db_path=db.db_path, persist_to_db=False)
    expected_total = 2
    assert before.conflict_count == 2 and before.gold_confirmed_count == expected_total - 2
    quality = next(item for item in compared.annotation.differences if item.type == 'QUALITY_LABEL')
    reviews.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=compared.evidence_id, result_id=compared.result_id,
        difference_ids=[quality.difference_id], reviewer='local-gold-verification', comment='受控质量裁决',
        action={'kind': 'SET_EFFECTIVE_QUALITY', 'targets': [{'sample_id': identity, 'quality': 'FAIL'} for identity in identities]}))
    image_gold = build_gold(config.task.task_id, policy=config.gold, db_path=db.db_path, persist_to_db=False)
    assert image_gold.gold_confirmed_count == expected_total and all(not record.annotations for record in image_gold.records)
    current = service.compare(pair)
    category = next(item for item in current.annotation.differences if item.type == 'CATEGORY')
    proposed = reviews.submit(ConsistencyReviewSubmission(client_request_id=uuid4(), evidence_id=current.evidence_id, result_id=current.result_id,
        difference_ids=[category.difference_id], reviewer='local-gold-verification', comment='受控区域修正建议',
        action={'kind': 'PROPOSE_REGION_CHANGE', 'changes': [{'operation': 'relabel', 'sample_id': identities[1],
            'annotation_id': category.right[0].annotation_id, 'category': 'surface-a'}]}))
    source = images / 'right.json'
    payload = json.loads(source.read_text());payload['shapes'][0]['label'] = 'surface-a';source.write_text(json.dumps(payload))
    registry.rescan(config.dataset.id)
    fixed = service.compare(pair)
    assert reviews.verify(CorrectionVerification(client_request_id=uuid4(), decision_id=proposed.decision_id,
        evidence_id=fixed.evidence_id, reviewer='local-gold-verification')).correction_state == 'VERIFIED'
    final = build_gold(config.task.task_id, policy=config.gold, db_path=db.db_path, persist_to_db=False)
    assert final.gold_confirmed_count == expected_total and all(len(record.annotations) == 1 and record.annotations[0].mask_path is None
        for record in final.records if record.sample_id in identities)
    relations = load_leakage_relations(db, config.task.task_id)
    members = samples.list_by_task(config.task.task_id)
    groups, mapping = build_split_groups(members, verified_pairs=relations.near_leakage_pairs,
        verified_groups=relations.groups, gold_records={record.sample_id: record for record in final.records})
    split = build_group_split(members, groups, mapping, config.split)
    assert split.assignments[identities[0]] == split.assignments[identities[1]]
    forced = check_leakage(members, {identities[0]: 'train', identities[1]: 'test'}, strict_content_groups=relations.strict_content_groups)
    assert not forced.is_passed and forced.strict_content_leakages
    config_path = root / 'formal.yaml'
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    published = run_benchmark_pipeline(config.task.task_id, build_id='industrial-consistency-verification',
        config_path=str(config_path), db_path=db.db_path, output_dir=str(args.output_dir / 'benchmark'))
    assert published.gold_count == expected_total
    assert published.train_count + published.val_count + published.test_count == expected_total
    assert published.leakage_passed
    persisted_build = BenchmarkRepository(db).get_build(published.build_id)
    assert persisted_build is not None and persisted_build.output_dir == published.output_dir
    assert len(GoldRepository(db).list_by_task(config.task.task_id)) == expected_total
    exported_gold = [json.loads(line) for line in Path(published.gold_jsonl).read_text().splitlines()]
    assert {record['sample_id'] for record in exported_gold} == {sample.sample_id for sample in members}
    assert all(len(record['annotations']) == 1 and record['annotations'][0]['mask_path'] is None
        for record in exported_gold if record['sample_id'] in identities)
    exported_split = json.loads(Path(published.split_json).read_text())
    assert exported_split['assignments'][identities[0]] == exported_split['assignments'][identities[1]]
    artifacts = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in Path(published.output_dir).iterdir()}
    assert len(artifacts) == 9
    report = {'source': str(args.image), 'source_size': [width, height], 'controlled_labels': True,
        'before_conflicts': before.conflict_count, 'image_gold_confirmed': image_gold.gold_confirmed_count,
        'unfixed_localization_annotations': sum(len(record.annotations) for record in image_gold.records),
        'after_confirmed': final.gold_confirmed_count, 'after_annotations': sum(len(record.annotations) for record in final.records),
        'same_split': True, 'forced_leakage': forced.model_dump(),
        'persisted_pair_relation': observation.verification.relation,
        'formal_benchmark': published.model_dump(), 'artifact_sha256': artifacts,
        'persisted_build_verified': True,
        'current_pair_preserved_after_annotation_rescan': PairObservations(db).current(config.task.task_id) == [observation],
        'no_encoder_import': not any(name in sys.modules for name in ('torch', 'faiss', 'transformers'))}
    assert report['current_pair_preserved_after_annotation_rescan']
    assert report['no_encoder_import']
    (args.output_dir / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'forced_leakage'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
