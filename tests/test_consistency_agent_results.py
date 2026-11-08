from uuid import uuid4
import json

import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.workbench.runtime import WorkbenchRuntime


def test_business_results_export_every_frozen_anchor_in_order_with_real_terminal_states(dataset, tmp_path):
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        identities = [config.dataset.id + ':' + name + '.png' for name in ['normal', 'dent', 'scratch']]
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': identities}})
        job_id = job['run_id']
        checks.session_created(job_id, identities[0])
        checks.retrieve(job_id, identities[0])
        checks.submit_empty(job_id, identities[0])
        checks.fail(job_id, identities[1], '图片解码失败', 'SOURCE_UNAVAILABLE')
        checks.cancel(job_id)

        results = ConsistencyAgentResults(database)
        frozen = results.snapshot(job_id)
        anchors = results.anchors(job_id)
        location = results.session_location(results.anchor(job_id, identities[0]).session_id)
        assert location.job_id == job_id
        assert location.image_name == 'normal.png'
        from iad_core.storage.models import sample_uuid
        assert location.image_id == sample_uuid(identities[0])
        assert location.submitted_at == job['submitted_at']
        exported = tmp_path / 'results.jsonl'
        with exported.open('w', encoding='utf-8') as output:
            results.export(job_id, output)
        lines = [json.loads(line) for line in exported.read_text().splitlines()]
        assert [line['anchor_id'] for line in lines] == [sample.sample_id for sample in frozen.scopes.subjects.samples]
        assert len(lines) == len(anchors) == 3
        assert len({(line['job_id'], line['anchor_id']) for line in lines}) == 3
        indexed = {line['anchor_id']: line for line in lines}
        assert indexed[identities[0]]['verdict'] == 'EQUIVALENT'
        assert indexed[identities[0]]['reason'] == 'NO_CANDIDATES'
        assert indexed[identities[0]]['selected_exact'] == 0
        assert indexed[identities[0]]['max_exact_candidates'] == 5
        assert indexed[identities[0]]['min_similarity'] is None
        assert indexed[identities[1]]['state'] == 'FAILED'
        assert indexed[identities[1]]['verdict'] is None
        assert indexed[identities[1]]['reason'] == 'SOURCE_UNAVAILABLE'
        assert indexed[identities[1]]['selected_exact'] is None
        assert indexed[identities[2]]['state'] == 'CANCELLED'
        assert indexed[identities[2]]['verdict'] is None
        detail = results.detail(job_id, identities[0])
        assert all(detail.model_dump(mode='json')[key] == value for key, value in indexed[identities[0]].items())
        assert detail.result.reason == 'NO_CANDIDATES'
        assert detail.observations == [] and detail.evidence == []
        zero = results.diagnostics(job_id, identities[0])
        assert zero.roles.agent.requests == zero.roles.vision.requests == 0
        assert zero.roles.agent.input_tokens == zero.roles.vision.input_tokens == 0
        assert zero.roles.agent.failed_requests == zero.roles.vision.failed_requests == 0
        assert zero.calls == []
        assert detail.diagnostics_ref.endswith('/diagnostics')
        assert detail.snapshot_ref.startswith('/api/iad/consistency/checks/')
        assert detail.trace_ref.endswith('/session.jsonl')
        assert results.detail(job_id, identities[1]).errors[0].code == 'SOURCE_UNAVAILABLE'
        with pytest.raises(LookupError, match='不属于'):
            results.detail(job_id, 'other-anchor')
        report = results.report(job_id)
        assert report.total == 3 and report.completed == 1
        assert report.verdicts == {'MATERIAL': 0, 'EQUIVALENT': 1, 'UNCERTAIN': 0}
        assert report.no_candidates == 1
        assert report.states['FAILED'] == report.states['CANCELLED'] == 1
    finally:
        runtime.close()
