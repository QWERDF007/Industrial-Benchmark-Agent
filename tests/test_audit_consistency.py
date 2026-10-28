import json
import threading

import httpx

from iad_core.entry import sample_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_visual_pass_keeps_unknown_policy_conflict_on_independent_axis(dataset, mllm_api):
    db, _, config = dataset
    client, bodies, _ = mllm_api
    target = config.dataset.id + ':dent.png'
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion']['analysis']['conclusion']['suggested_label'] == 'PASS'
        axis = detail['consistency']
        assert axis['run_id'] == job['run_id']
        assert detail['suggestion']['analysis']['consistency']['check_id'] == axis['check_id']
        assert axis['status'] == 'COMPLETE'
        assert len(axis['results']) == 1
        result = axis['results'][0]
        assert detail['suggestion']['analysis']['consistency']['results'] == [
            {'result_id': result['result_id'], 'evidence_id': result['evidence_id']}]
        assert result['verification']['relation'] == 'EXACT'
        assert not result['annotation']['confirmed_conflict']
        assert result['annotation']['policy_relation'] == 'UNKNOWN'
        assert any(item['type'] == 'CATEGORY' for item in result['annotation']['differences'])
        assert axis['references'][0]['evidence_id'] == result['evidence_id']
        audit_requests = [body for body in bodies if body['response_format']['json_schema']['name'] == 'JointAnalysis']
        assert audit_requests
        assert all('consistency_' not in str(body) for body in audit_requests)
    finally:
        runtime.close()



def test_model_failure_retains_evidence_and_continues_other_samples(dataset, mllm_api):
    db, _, config = dataset
    targets = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    client = httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(503, text='unavailable')))
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=targets)
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'FAILED', status
        assert status['failed'] == 2
        for target in targets:
            detail = sample_get({'sample_id': target}, db.db_path)
            assert detail['suggestion'] is None
            assert detail['consistency']['status'] == 'COMPLETE'
            assert len(detail['consistency']['results']) == 1
            assert detail['consistency']['results'][0]['verification']['relation'] == 'EXACT'
        db_again = type(db)(db.db_path)
        assert sample_get({'sample_id': targets[0]}, db_again.db_path)['consistency']['run_id'] == job['run_id']
    finally:
        runtime.close()


def test_missing_model_catalog_does_not_prevent_deterministic_audit(dataset, mllm_api, monkeypatch):
    db, _, config = dataset
    monkeypatch.delenv('LIVE_VLM_MODEL', raising=False)
    calls = []
    def unavailable(request):
        calls.append(request.method)
        return httpx.Response(503, text='no configured model')
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(unavailable))))
    target = config.dataset.id + ':dent.png'
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'FAILED', status
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion'] is None
        assert detail['consistency']['status'] == 'COMPLETE'
        assert len(detail['consistency']['results']) == 1
        assert calls == ['GET']
    finally:
        runtime.close()


def test_visual_opt_in_reports_missing_vectors_without_loading_encoder(dataset, mllm_api, tmp_path):
    from tests.feature_fixtures import configure_test_encoder
    db, _, config = dataset
    client, _, _ = mllm_api
    profile = configure_test_encoder(db, tmp_path).profile
    target = config.dataset.id + ':dent.png'
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target],
            consistency_mode='combined', consistency_profile_id=profile.profile_id)
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion']['suggested_label'] == 'PASS'
        assert detail['consistency']['status'] == 'PARTIAL'
        assert detail['consistency']['error_code'] == 'INDEX_NOT_READY'
        assert len(detail['consistency']['results']) == 1
    finally:
        runtime.close()


def test_new_dataset_during_visual_audit_stays_outside_frozen_corpus(dataset, mllm_api, tmp_path):
    from iad_core.dataset.registry import DatasetImport
    from iad_core.feature.profiles import ImageEncoders, ImageEncoderEdit
    from tests.feature_fixtures import configure_test_encoder
    from PIL import Image
    db, registry, config = dataset
    client, _, _ = mllm_api
    entered, release = threading.Event(), threading.Event()
    def respond(request):
        if json.loads(request.content).get('response_format', {}).get('json_schema', {}).get('name') == 'JointAnalysis':
            entered.set()
            assert release.wait(5)
        return client.send(request)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    target = config.dataset.id + ':dent.png'
    profile = configure_test_encoder(db, tmp_path).profile
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target], consistency_mode='combined')
        assert entered.wait(5)
        encoders = ImageEncoders(db)
        encoders.save(ImageEncoderEdit(expected_revision=encoders.read().revision, selection=None))
        root = tmp_path / 'new-corpus'
        root.mkdir()
        Image.new('RGB', (320, 240), 'blue').save(root / 'new-copy.png')
        added = registry.import_labelme(DatasetImport(format='labelme', name='启动后注册', image_dir=str(root), annotation_dir=str(root)))
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        assert added.dataset.id not in status['request']['consistency_scopes']['corpus']['dataset_ids']
        axis = sample_get({'sample_id': target}, db.db_path)['consistency']
        assert axis['profile_id'] == profile.profile_id
        assert [ref['sample_id'] for ref in axis['references']] == [config.dataset.id + ':scratch.png']
    finally:
        release.set()
        runtime.close()


def test_cancel_preserves_finished_evidence_without_marking_current_sample_completed(dataset, mllm_api):
    db, _, config = dataset
    client, _, _ = mllm_api
    entered, release = threading.Event(), threading.Event()
    generations = 0
    def respond(request):
        nonlocal generations
        if json.loads(request.content).get('response_format', {}).get('json_schema', {}).get('name') == 'JointAnalysis':
            generations += 1
            if generations == 2:
                entered.set()
                assert release.wait(5)
        return client.send(request)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    targets = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=targets)
        assert entered.wait(5)
        runtime.audit.cancel(job['run_id'])
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'CANCELLED', status
        assert status['completed'] == 1 and status['unprocessed'] == 1
        assert len(sample_get({'sample_id': targets[0]}, db.db_path)['consistency']['results']) == 1
        assert sample_get({'sample_id': targets[1]}, db.db_path)['suggestion'] is None
    finally:
        release.set()
        runtime.close()


def test_cancel_current_visual_request_keeps_already_verified_same_image_evidence(dataset, mllm_api):
    from iad_core.consistency.evidence_models import ConsistencyCompare
    db, _, config = dataset
    client, _, _ = mllm_api
    entered, release = threading.Event(), threading.Event()
    def respond(request):
        if json.loads(request.content).get('response_format', {}).get('json_schema', {}).get('name') == 'JointAnalysis':
            entered.set()
            assert release.wait(5)
        return client.send(request)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    target = config.dataset.id + ':dent.png'
    proof = runtime.consistency_service.compare(ConsistencyCompare(sample_a=target, sample_b=config.dataset.id + ':scratch.png'))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        assert entered.wait(5)
        runtime.audit.cancel(job['run_id'])
        release.set()
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'CANCELLED', status
        assert status['completed'] == 0 and status['failed'] == 0 and status['unprocessed'] == 1
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion'] is None
        assert detail['consistency']['status'] == 'PARTIAL'
        assert [result['evidence_id'] for result in detail['consistency']['results']] == [proof.evidence_id]
    finally:
        release.set()
        runtime.close()


def test_same_policy_quality_conflict_remains_reviewable_when_model_says_pass(dataset, mllm_api):
    from iad_core.storage.repositories import SampleRepository
    from iad_core.workbench.query import WorkbenchQuery, SampleQuery
    db, registry, config = dataset
    client, _, _ = mllm_api
    config.annotations.policy_id = 'production-policy'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    target, other = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    samples = SampleRepository(db)
    for sample_id, label in ((target, 'PASS'), (other, 'FAIL')):
        sample = samples.get(sample_id)
        sample.quality_status, sample.quality_source = label, 'production-fixture'
        samples.upsert(sample)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        detail = sample_get({'sample_id': target}, db.db_path)
        assert detail['suggestion']['suggested_label'] == 'PASS'
        result = detail['consistency']['results'][0]
        assert result['annotation']['confirmed_conflict']
        assert any(diff['type'] == 'QUALITY_LABEL' and diff['confirmed_conflict'] for diff in result['annotation']['differences'])
        queue = WorkbenchQuery(db).samples(SampleQuery(dataset_id=config.dataset.id, review_status='pending', model_status='PASS'))
        assert [item['sample_id'] for item in queue['items']] == [target]
        assert detail['sample']['quality_status'] == 'PASS'
        assert sample_get({'sample_id': other}, db.db_path)['sample']['quality_status'] == 'FAIL'
        assert detail['review_decision'] is None
    finally:
        runtime.close()


def test_resolved_catalog_model_is_frozen_in_retry_input(dataset, mllm_api, monkeypatch):
    db, _, config = dataset
    client, _, _ = mllm_api
    monkeypatch.delenv('LIVE_VLM_MODEL', raising=False)
    def respond(request):
        if request.method == 'GET':
            return httpx.Response(200, json={'data': [{'id': 'catalog-model'}]})
        return client.send(request)
    runtime = WorkbenchRuntime(db, VlmClient(http_client=httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[config.dataset.id + ':dent.png'])
        runtime.audit.wait(job['run_id'], 5)
        status = runtime.audit.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        assert status['model_name'] == status['request']['model_name'] == 'catalog-model'
    finally:
        runtime.close()


def test_standalone_audit_reuses_one_runtime_for_read_only_visual_candidates(dataset, mllm_api, tmp_path):
    from iad_core.workbench.audit import AuditService
    from tests.feature_fixtures import configure_test_encoder
    db, _, config = dataset
    client, _, _ = mllm_api
    configure_test_encoder(db, tmp_path)
    service = AuditService(db, VlmClient(http_client=client))
    target = config.dataset.id + ':dent.png'
    try:
        job = service.start(dataset_id=config.dataset.id, sample_ids=[target], consistency_mode='combined')
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        axis = sample_get({'sample_id': target}, db.db_path)['consistency']
        assert axis['status'] == 'PARTIAL'
        assert axis['error_code'] == 'INDEX_NOT_READY'
        assert len(axis['results']) == 1
    finally:
        service.close()


def test_audit_links_existing_exact_evidence_even_without_annotation_differences(dataset, mllm_api):
    from pathlib import Path
    from iad_core.consistency.evidence_models import ConsistencyCompare
    db, registry, config = dataset
    client, _, _ = mllm_api
    config.annotations.policy_id = 'same'
    config.annotations.annotation_role = 'REFERENCE'
    registry.save(config, require_existing=True)
    (Path(config.annotations.root) / 'scratch.json').write_bytes((Path(config.annotations.root) / 'dent.json').read_bytes())
    registry.rescan(config.dataset.id)
    target = config.dataset.id + ':dent.png'
    runtime = WorkbenchRuntime(db, VlmClient(http_client=client))
    try:
        proof = runtime.consistency_service.compare(ConsistencyCompare(sample_a=target, sample_b=config.dataset.id + ':scratch.png'))
        assert proof.annotation.differences == []
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 5)
        assert runtime.audit.status(job['run_id'])['status'] == 'COMPLETED'
        detail = sample_get({'sample_id': target}, db.db_path)
        assert [result['evidence_id'] for result in detail['consistency']['results']] == [proof.evidence_id]
    finally:
        runtime.close()
