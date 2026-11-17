from uuid import uuid4
import json

import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.workbench.runtime import WorkbenchRuntime
from tests.test_consistency_identity import similar_job


def test_native_commands_publish_result_pages_before_returning(indexed_dataset):
    from iad_core.consistency import agent_operations as operations
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.consistency.result_index import ConsistencyResultIndex
    from iad_core.workbench.runtime import close_workbenches

    database, _, config = indexed_dataset
    try:
        job = operations.consistency_agent_start({'request': {'submission_id': str(uuid4()),
            'dataset_ids': [config.dataset.id], 'mode': 'exact'}}, database.db_path)
        run_id, anchors = job['run_id'], job['sample_ids']
        results = ConsistencyAgentResults(database)
        with database.connection() as connection:
            assert ConsistencyResultIndex(connection, run_id).current(), '新作业返回时首页数据应已就绪'
        operations.consistency_agent_retrieve_many({'run_id': run_id, 'anchor_ids': anchors}, database.db_path)
        for anchor in anchors:
            arguments = {'run_id': run_id, 'anchor_id': anchor}
            operations.consistency_agent_session_created(arguments, database.db_path)
            prepared = operations.consistency_agent_verify(arguments, database.db_path)
            with database.connection() as writer:
                assert ConsistencyResultIndex(writer, run_id).current(), '正常结果写入不能积累到下次打开页面才刷新'
                writer.execute('BEGIN IMMEDIATE')
                page = results.images(run_id)
                assert page.total == len(anchors)
                item = next(item for item in page.items if item.sample.sample_id == anchor)
                assert item.summary.state == ('COMPLETED' if prepared['completed'] else 'RUNNING')
    finally:
        close_workbenches()


def test_result_publication_failure_preserves_the_original_command_error(indexed_dataset, caplog):
    from iad_core.consistency import agent_operations as operations
    from iad_core.workbench.runtime import close_workbenches

    database, _, config = indexed_dataset
    try:
        job = operations.consistency_agent_start({'request': {'submission_id': str(uuid4()),
            'dataset_ids': [config.dataset.id], 'mode': 'exact'}}, database.db_path)
        run_id, anchor = job['run_id'], job['sample_ids'][0]
        with database.connection() as connection:
            connection.execute('DELETE FROM consistency_result_index WHERE job_id=?', (run_id,))
        with database.connection() as writer:
            writer.execute('BEGIN IMMEDIATE')
            with pytest.raises(ValueError, match='过期的主图审核 attempt'):
                operations.consistency_agent_verify({'run_id': run_id, 'anchor_id': anchor,
                    'attempt': 999}, database.db_path)
            assert '结果索引刷新失败' in caplog.text and 'database is locked' in caplog.text
    finally:
        close_workbenches()


def test_successful_command_does_not_hide_result_publication_failure(indexed_dataset):
    import sqlite3
    from iad_core.consistency import agent_operations as operations
    from iad_core.workbench.analysis_job_views import AnalysisJobViews
    from iad_core.workbench.runtime import close_workbenches

    database, _, config = indexed_dataset
    try:
        job = operations.consistency_agent_start({'request': {'submission_id': str(uuid4()),
            'dataset_ids': [config.dataset.id], 'mode': 'exact'}}, database.db_path)
        run_id = job['run_id']
        with database.connection() as connection:
            connection.execute('DELETE FROM consistency_result_index WHERE job_id=?', (run_id,))
            connection.execute("""CREATE TRIGGER reject_result_publication BEFORE INSERT ON consistency_result_index
                BEGIN SELECT RAISE(ABORT, '投影写入被拒绝'); END""")
        with pytest.raises(sqlite3.IntegrityError, match='投影写入被拒绝'):
            operations.consistency_agent_cancel({'run_id': run_id}, database.db_path)
        assert AnalysisJobViews(database).view(run_id)['status'] == 'CANCELLED'
    finally:
        close_workbenches()


def test_job_list_summary_combines_scopes_without_call_payloads(dataset):
    from iad_core.workbench.analysis_job_views import AnalysisJobViews

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        job = ConsistencyAgentJobs(runtime).start({'submission_id': str(uuid4()),
            'dataset_ids': [config.dataset.id], 'mode': 'exact'})
        runtime.jobs.update(job['run_id'], current_sample_id=job['sample_ids'][0])
        listed = AnalysisJobViews(database).list([config.dataset.id, config.dataset.id], 'consistency', summary=True)
        assert len(listed) == 1
        assert listed[0]['run_id'] == job['run_id']
        assert listed[0]['total_samples'] == job['total_samples']
        assert listed[0]['current_sample']['sample_id'] == job['sample_ids'][0]
        assert not {'model_calls', 'sample_ids', 'completed_sample_ids', 'failed_sample_ids'} & listed[0].keys()
        assert len(AnalysisJobViews(database).view(job['run_id'])['sample_ids']) == job['total_samples']
        checks = ConsistencyAgentJobs(runtime)
        checks.snapshot(job['run_id'])
        checks.cancel(job['run_id'])
        runtime.jobs.delete(job['run_id'], ('ANALYSIS_WORKFLOW',), family=True)
        with pytest.raises(LookupError):
            checks.snapshot(job['run_id'])
    finally:
        runtime.close()


def test_changing_phase_or_cancelling_keeps_image_pages_readable_while_another_writer_is_active(dataset):
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact'})
        run_id, anchor = job['run_id'], job['sample_ids'][0]
        results = ConsistencyAgentResults(database)
        checks.session_created(run_id, anchor)
        results.images(run_id)
        checks.phase(run_id, anchor, 'VERIFYING_CONTENT')
        with database.connection() as writer:
            writer.execute('BEGIN IMMEDIATE')
            page = results.images(run_id)
            item = next(item for item in page.items if item.sample.sample_id == anchor)
            assert item.summary.phase == 'VERIFYING_CONTENT'
            assert item.summary.program_conclusion == '内容核对中'
        checks.cancel(run_id)
        with database.connection() as writer:
            writer.execute('BEGIN IMMEDIATE')
            assert all(item.summary.state == 'CANCELLED' for item in results.images(run_id).items)
            assert all(item.summary.program_conclusion == '已取消' for item in results.images(run_id).items)
    finally:
        runtime.close()


def test_retrieval_publishes_candidate_counts_and_page_projections_in_the_same_transaction(dataset):
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.consistency.result_index import ConsistencyResultIndex
    from iad_core.duplicate.index import PixelIndex

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact'})
        run_id, anchors = job['run_id'], job['sample_ids']
        PixelIndex(database).prepare(anchors)
        results = ConsistencyAgentResults(database)
        results.prepare_indexes(run_id)
        selected = checks.retrieve_many(run_id, anchors)
        with database.connection() as writer:
            writer.execute('BEGIN IMMEDIATE')
            assert ConsistencyResultIndex(writer, run_id).current(), '候选发布后不能让首个读者重建整批投影'
            page = results.images(run_id)
            summaries = {item.summary.anchor_id: item.summary for item in page.items}
            for item in selected:
                summary = summaries[item.anchor_id]
                assert summary.selected_exact == item.candidates.exact.selected
                assert summary.outcome.candidate_stats.retrieved == len(item.candidates.candidates)
            assert page.counts['NO_CANDIDATES'] == sum(not item.candidates.candidates for item in selected)
    finally:
        runtime.close()


@pytest.mark.parametrize('cancelled', [False, True])
@pytest.mark.parametrize('similar_job', ['original_resolution'], indirect=True)
def test_finished_content_checks_without_eligible_candidates_are_not_shown_as_unfinished(similar_job, cancelled):
    import httpx
    from iad_core.consistency.identity import CandidateIdentity
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.workbench.vision import VlmClient
    from tests.test_consistency_identity import identity_response

    runtime, checks, run_id, anchor = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        body = json.loads(request.content)
        context = json.loads(body['messages'][-1]['content'][1]['text'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(
            identity_response(context, 'content_different', '两图胶线中央的形状不同。'))}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        identity = CandidateIdentity(runtime, client).verify(run_id, anchor)
        assert identity.completed and not identity.eligible_ids
        if cancelled:
            checks.cancel(run_id)
        results = ConsistencyAgentResults(runtime.db)
        detail = results.detail(run_id, anchor)
        assert detail.program_conclusion == '无有效候选'
        assert detail.reason == 'NO_ELIGIBLE_CANDIDATES'
        assert detail.annotation_review_status == 'not_required'
        assert detail.annotation_review_label == '无需标注审核'
        assert detail.identity_model_reviewed is True
        assert detail.model_conclusion is None and detail.result is None
        assert detail.state == ('CANCELLED' if cancelled else 'RUNNING')
        page = results.images(run_id, query={'group': 'NO_ELIGIBLE_CANDIDATES'})
        assert page.total == 1 and page.items[0].summary.program_conclusion == detail.program_conclusion
        assert page.counts['NO_ELIGIBLE_CANDIDATES'] == 1
    finally:
        client.close()


def test_business_results_export_every_frozen_anchor_in_order_with_real_terminal_states(dataset, tmp_path):
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        identities = [config.dataset.id + ':' + name + '.png' for name in ['normal', 'dent', 'scratch']]
        from iad_core.duplicate.preparation import PixelPreparation
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': identities}})
        job_id = job['run_id']
        PixelPreparation(database).prepare([sample.sample_id for sample in checks.snapshot(job_id).scopes.corpus.samples])
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
        exported_outcome = detail.outcome.model_dump(mode='json')
        assert indexed[identities[0]]['schema_version'] == '8.0'
        assert indexed[identities[0]]['task_type'] == 'bbox_defect'
        assert indexed[identities[0]]['candidate_record_ids'] == []
        assert all(indexed[identities[0]][key] == value for key, value in exported_outcome.items())
        assert indexed[identities[1]]['execution_status'] == 'failed'
        assert indexed[identities[1]]['result'] == indexed[identities[2]]['result'] == 'incomplete'
        assert detail.result.reason == 'NO_CANDIDATES'
        assert detail.result.conclusion == '通过（无候选）'
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
        images = results.images(job_id)
        assert images.total == 3
        indexed_images = {item.summary.anchor_id: item for item in images.items}
        assert indexed_images[identities[0]].summary.reason == 'NO_CANDIDATES'
        assert indexed_images[identities[0]].summary.program_conclusion == '无候选'
        assert detail.program_conclusion == '无候选'
        assert detail.model_conclusion is None
        assert indexed_images[identities[0]].image is None
        assert indexed_images[identities[1]].summary.state == 'FAILED'
        assert indexed_images[identities[1]].summary.program_conclusion == '核对失败'
        assert indexed_images[identities[2]].summary.state == 'CANCELLED'
    finally:
        runtime.close()


@pytest.mark.parametrize('reverse,expected', [(False, '多类别'), (True, '少类别')])
def test_tabs_use_severe_primary_category_and_refresh_outdated_projection(dataset, tmp_path, reverse, expected):
    from PIL import Image
    from tests.consistency_support import start_prepared
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.consistency.result_index import ConsistencyResultIndex

    database, registry, config = dataset
    polygons = [[[10, 10], [30, 10], [30, 30], [10, 30]],
        [[70, 70], [140, 70], [140, 120], [70, 120]]]
    small = [[[100, 80], [120, 80], [120, 100], [100, 100]]]
    for name, points in zip(('dent', 'scratch'), (small, polygons) if reverse else (polygons, small)):
        Image.new('RGB', (320, 240), '#778899').save(tmp_path / 'images' / (name + '.png'))
        (tmp_path / 'labels' / (name + '.json')).write_text(json.dumps({'imageWidth':320,'imageHeight':240,
            'shapes':[{'label':'dent','shape_type':'polygon','points':polygon} for polygon in points]}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run_id = start_prepared(checks, {'submission_id':str(uuid4()),'dataset_ids':[config.dataset.id],
            'mode':'exact','subjects':{'kind':'samples','sample_ids':[anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        checks.retrieve(run_id, anchor)
        ConsistencyAgentReview(runtime).verify(run_id, anchor)
        results = ConsistencyAgentResults(database)
        page = results.images(run_id, query={'group':expected})
        assert [item.sample.sample_id for item in page.items] == [anchor]
        assert page.items[0].summary.original_conclusion == expected
        assert set(page.items[0].summary.original_categories) == {'少标内容' if reverse else '多标内容', expected}
        assert page.counts[expected] == 1 and page.counts.get('位置差异', 0) == 0
        assert results.images(run_id, query={'group':'位置差异'}).total == 0
        with database.connection() as connection:
            connection.execute('UPDATE consistency_result_index SET projection_version=0 WHERE job_id=?', (run_id,))
            assert not ConsistencyResultIndex(connection, run_id).current()
        assert results.images(run_id, query={'group':expected}).total == 1
        with database.connection() as connection:
            assert ConsistencyResultIndex(connection, run_id).current()
    finally:
        runtime.close()
