import json
import cProfile
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest

from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.consistency.identity import CandidateIdentity
from iad_core.consistency.identity_models import candidate_pair_key
from iad_core.consistency.pair_reviews import ConsistencyPairReviews
from iad_core.consistency.workflow import ConsistencyWorkflow
from iad_core.workbench.vision import VlmClient
from tests.test_consistency_identity import identity_response, similar_job
from tests.test_consistency_program_workflow import pair_job


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
@pytest.mark.parametrize('concurrent', [False, True])
def test_annotation_pair_is_observed_once_and_reused_with_reversed_references(pair_job, concurrent):
    runtime, checks, run_id = pair_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][-1]['content']
        assert isinstance(content, list), content
        context = json.loads(content[1]['text'])
        if context.get('scope') == 'joint':
            answer = identity_response(context, 'transformed_same_content', '两图纹理对应。')
        else:
            facts = context['facts']
            assert len(facts['candidates']) == 1, 'Annotation requests must isolate each image pair'
            identity = next(iter(facts['candidates']))
            sources = {source['sample_id']: source for source in facts['sources'].values()}
            main, candidate = sources[facts['anchor']['sample_id']], sources[identity]
            sent.append((main['name'], candidate['name']))
            count = len(main['annotations']) - len(candidate['annotations'])
            issues = []
            if count:
                issues.append({'type': 'extra_annotation' if count > 0 else 'missing_annotation',
                    'main_annotation_ids': [a['annotation_id'] for a in main['annotations']] if count > 0 else [],
                    'candidate_annotation_ids': [a['annotation_id'] for a in candidate['annotations']] if count < 0 else [],
                    'description': '同一缺陷只在其中一张图中有标注。',
                    'region_pair_ids': facts['candidates'][identity]['gate']['verified_region_pair_ids']})
            answer = {'reviews': {identity: {'verdict': 'MATERIAL' if count else 'EQUIVALENT',
                'explanation': '两图对同一缺陷的标注数量不同。' if count else '两图标注一致。',
                'issues': issues, 'limitations': [], 'disputed_regions': []}}}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        for task in tasks:
            reviews.review(run_id, task.pair_key)
        selected = next(task for task in tasks if len(task.links) == 2)
        model_review = ConsistencyAgentReview(runtime, client)
        first, second = selected.links
        first_page = next(page for page in model_review.plan(run_id, first.anchor_id).pages
            if page.candidate_ids == [first.candidate_id])
        if concurrent:
            with ThreadPoolExecutor(max_workers=2) as executor:
                copies = list(executor.map(lambda _: model_review.observe(run_id, first.anchor_id, first_page), range(2)))
            assert copies[0].observation_id == copies[1].observation_id
            original = copies[0]
        else:
            original = model_review.observe(run_id, first.anchor_id, first_page)
        second_page = next(page for page in model_review.plan(run_id, second.anchor_id).pages
            if page.candidate_ids == [second.candidate_id])
        profile = cProfile.Profile()
        profile.enable()
        projected = model_review.observe(run_id, second.anchor_id, second_page)
        profile.disable()
        assert projected.shared_source.observation_id == original.observation_id
        assert projected.shared_source.call_ids == original.shared_source.call_ids
        assert projected.shared_source.reversed
        assert len(sent) == 1
        expensive = [(entry.code.co_name, entry.callcount) for entry in profile.getstats()
            if not isinstance(entry.code, str) and (
                entry.code.co_name in ('open', 'save') and entry.code.co_filename.endswith('/PIL/Image.py')
                or entry.code.co_name == 'estimate' and entry.code.co_filename.endswith('/identity_geometry.py'))]
        assert expensive == [], f'Reverse reuse must not decode, crop, encode or register images: {expensive}'
        workflow = ConsistencyWorkflow(runtime, client)
        anchors = checks.anchors(run_id)
        with ThreadPoolExecutor(max_workers=4 if concurrent else 1) as executor:
            results = list(executor.map(lambda anchor: workflow.audit(run_id, anchor.anchor_id), anchors))
        assert all(result['ready'] for result in results)
        keys = [candidate_pair_key(a, b) for a, b in sent]
        assert len(keys) >= 2
        assert len(keys) == len(set(keys)), 'A→B and B→A must share the actual annotation call'
        records = {anchor.anchor_id: ConsistencyAgentReview(runtime).assessments(run_id, anchor.anchor_id) for anchor in anchors}
        inverse = {'extra_annotation': 'missing_annotation', 'missing_annotation': 'extra_annotation'}
        for anchor_id, assessments in records.items():
            for record in assessments:
                candidate_id = record.submission.assessment.candidate_id
                reverse = next(r.submission.assessment for r in records[candidate_id]
                    if r.submission.assessment.candidate_id == anchor_id)
                forward = record.submission.assessment
                assert reverse.verdict == forward.verdict
                for issue, other in zip(forward.issues, reverse.issues):
                    assert other.type == inverse[issue.type]
                    assert other.main_annotation_ids == issue.candidate_annotation_ids
                    assert other.candidate_annotation_ids == issue.main_annotation_ids
                    assert set(other.media_ids) == set(issue.media_ids)
        from pathlib import Path
        from scripts.compare_consistency_inputs import compare_inputs
        proof = compare_inputs(Path(runtime.db.db_path), {'run_id': run_id, 'pairs': []}, run_id)
        assert proof['actual_http_annotation_requests_verified'] == len(sent)
        assert proof['visual_pairs_with_actual_original_and_all_roi_delivery'] == len(tasks)
        before = len(sent)
        for anchor in anchors:
            assert workflow.audit(run_id, anchor.anchor_id)['ready']
        assert len(sent) == before
        task = next(task for task in tasks if len(task.links) == 2)
        owner = task.links[0]
        gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, owner.anchor_id).gates
            if gate.candidate_id == owner.candidate_id)
        CandidateIdentity(runtime).recheck(run_id, owner.anchor_id, owner.candidate_id,
            expected_revision=gate.revision, request_id='renew-shared-pair')
        reviews.review(run_id, task.pair_key)
        for link in task.links:
            assert workflow.audit(run_id, link.anchor_id)['ready']
        assert len(sent) == before + 1, 'Renewed identity evidence must invalidate both annotation projections'
    finally:
        client.close()


@pytest.mark.parametrize('kind,reverse_kind,main_count,candidate_count', [
    ('category_mismatch', 'category_mismatch', 1, 1),
    ('missing_annotation', 'extra_annotation', 0, 1),
    ('extra_annotation', 'missing_annotation', 1, 0),
    ('missing_content', 'extra_content', 1, 1),
    ('extra_content', 'missing_content', 1, 1),
    ('split', 'merge', 2, 1),
    ('merge', 'split', 1, 2),
    ('position_difference', 'position_difference', 1, 1),
])
def test_direction_reversal_preserves_evidence_and_reverses_every_issue(kind, reverse_kind, main_count, candidate_count):
    from iad_core.consistency.annotation_direction import AnnotationDirection
    from iad_core.consistency.agent_review_models import CandidateVisualObservation

    finding = CandidateVisualObservation(candidate_id='B', description='两图同一对象的标注有差异。',
        media_ids=['image-A', 'image-B'], assessment={'candidate_id': 'B', 'verdict': 'MATERIAL',
            'explanation': '两图同一对象的标注有差异。', 'issues': [{'type': kind,
                'main_annotation_ids': ['A'+str(i) for i in range(main_count)],
                'candidate_annotation_ids': ['B'+str(i) for i in range(candidate_count)],
                'media_ids': ['image-A', 'image-B'], 'description': '两图标注不同。',
                'coverage_effect': 'material_change' if kind in ('missing_content', 'extra_content') else None,
                'coverage_reason': '两侧轮廓覆盖相差一大片区域。' if kind in ('missing_content', 'extra_content') else None,
                'region_pair_ids': ['region-1']}]})
    reversed_finding = AnnotationDirection.reverse(finding, 'A')
    assert reversed_finding.assessment.issues[0].type == reverse_kind
    assert reversed_finding.media_ids == ['image-B', 'image-A']
    assert reversed_finding.assessment.issues[0].region_pair_ids == ['region-1']
    assert AnnotationDirection.reverse(reversed_finding, 'B') == finding


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_visual_plan_cannot_overwrite_a_concurrent_identity_invalidation(pair_job, monkeypatch):
    from threading import Event, current_thread
    from concurrent.futures import TimeoutError
    from iad_core.consistency.agent_visual_pages import AnchorVisualPages

    runtime, checks, run_id = pair_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        answer = identity_response(context, 'transformed_same_content', '两图纹理对应。')
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        tasks = pairs.plan(run_id)
        for task in tasks:
            pairs.review(run_id, task.pair_key)
        link = next(link for task in tasks for link in task.links
            if any(gate.candidate_id == link.candidate_id and gate.source == 'vision'
                for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates))
        gate = next(gate for gate in CandidateIdentity(runtime).read(run_id, link.anchor_id).gates
            if gate.candidate_id == link.candidate_id)
        captured, release = Event(), Event()
        read = CandidateIdentity.read

        def paused_read(identity, *args, **kwargs):
            state = read(identity, *args, **kwargs)
            if current_thread().name.startswith('visual-plan'):
                captured.set()
                assert release.wait(5)
            return state

        monkeypatch.setattr(CandidateIdentity, 'read', paused_read)
        try:
            with ThreadPoolExecutor(max_workers=1, thread_name_prefix='visual-plan') as planner, \
                    ThreadPoolExecutor(max_workers=1) as updater:
                planned = planner.submit(AnchorVisualPages(runtime, client).plan, run_id, link.anchor_id)
                assert captured.wait(5)
                invalidated = updater.submit(CandidateIdentity(runtime).recheck, run_id, link.anchor_id,
                    link.candidate_id, expected_revision=gate.revision, request_id='invalidate-while-planning')
                try:
                    with pytest.raises(TimeoutError):
                        invalidated.result(timeout=.2)
                finally:
                    release.set()
                planned.result(timeout=5)
                invalidated.result(timeout=5)
        finally:
            release.set()
        current = AnchorVisualPages(runtime, client).plan(run_id, link.anchor_id)
        assert all(link.candidate_id not in page.candidate_ids for page in current.pages)
    finally:
        client.close()


@pytest.mark.parametrize('similar_job', ['registered'], indirect=True)
def test_annotation_pair_finishes_while_unrelated_identities_are_pending(pair_job):
    from iad_core.consistency.annotation_pair_reviews import AnnotationPairReviews

    runtime, checks, run_id = pair_job
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        if context.get('scope') == 'joint':
            answer = identity_response(context, 'transformed_same_content', '两图纹理对应。')
        else:
            candidate = next(iter(context['facts']['candidates']))
            sent.append(candidate)
            answer = {'reviews': {candidate: {'verdict': 'EQUIVALENT', 'explanation': '两图标注一致。',
                'issues': [], 'limitations': [], 'disputed_regions': []}}}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop',
            'message': {'content': json.dumps(answer)}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        pairs = ConsistencyPairReviews(runtime, client)
        task = next(task for task in pairs.plan(run_id) if len(task.links) == 2)
        pairs.review(run_id, task.pair_key)
        assert any(not CandidateIdentity(runtime).read(run_id, link.anchor_id).completed for link in task.links)
        receipt = AnnotationPairReviews(runtime, client).review(run_id, task)
        assert receipt['ready']
        assert len(sent) == 1
        for link in task.links:
            assert any(record.submission.assessment.candidate_id == link.candidate_id
                for record in ConsistencyAgentReview(runtime, client).assessments(run_id, link.anchor_id))
    finally:
        client.close()
