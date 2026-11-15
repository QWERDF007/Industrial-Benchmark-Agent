import json
from pathlib import Path

import httpx
import pytest
from PIL import Image

from iad_core.consistency.pair_reviews import ConsistencyPairReviews
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.vision import VlmClient
from scripts.compare_consistency_inputs import compare_inputs
from tests.test_consistency_identity import identity_response, similar_job


@pytest.mark.parametrize(
    'mutation',
    [
        'bbox',
        'raw_label',
        'is_ignored',
        'annotation_type',
        'overview',
        'roi',
        'overview_metadata',
        'roi_metadata',
        'extra_image',
    ],
)
@pytest.mark.parametrize('pair_count', [1, 2])
def test_input_comparison_rejects_changed_http_context_with_unchanged_images(
    similar_job, mutation, pair_count
):
    runtime, _, run_id, _ = similar_job

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        response = (
            {
                key: identity_response(value, 'unverified', '两图局部无法可靠对应。')
                for key, value in context['pairs'].items()
            }
            if context['scope'] == 'pairs'
            else identity_response(context, 'unverified', '两图局部无法可靠对应。')
        )
        return httpx.Response(
            200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(response)}}]}
        )

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        reviews = ConsistencyPairReviews(runtime, client)
        tasks = reviews.plan(run_id)
        assert len(tasks) == 2
        reviews.review_many(run_id, [task.pair_key for task in tasks[:pair_count]])
    finally:
        client.close()
    with runtime.db.connection() as connection:
        pairs = [
            {'pair_key': key, 'result': json.loads(body)}
            for key, body in connection.execute(
                'SELECT pair_key,result_json FROM consistency_pair_reviews WHERE job_id=? AND result_json IS NOT NULL',
                (run_id,),
            )
        ]
        call_id = connection.execute(
            """SELECT call_id FROM model_calls WHERE run_id=?
            AND json_extract(summary_json,'$.operation')='generate'""",
            (run_id,),
        ).fetchone()[0]
    control = {'run_id': run_id, 'pairs': pairs}
    assert (
        compare_inputs(Path(runtime.db.db_path), control, run_id)[
            'visual_pairs_with_actual_original_and_all_roi_delivery'
        ]
        == pair_count
    )
    request, _ = runtime.db.call_payloads.read(run_id, call_id)
    body = json.loads(request)
    parts = body['messages'][-1]['content']
    context = json.loads(parts[1]['text'])
    first = context['pairs']['p0'] if pair_count == 2 else context
    if mutation == 'extra_image':
        start = next(
            index for index, part in enumerate(parts) if part.get('text', '').startswith('原图资料：')
        )
        extra = json.loads(json.dumps(parts[start : start + 3]))
        assert extra[-1]['type'] in ('image_url', 'input_image')
        bundle = json.loads(extra[0]['text'].split('：', 1)[1])
        bundle['evidence_id'] = 'unexpected_image'
        extra[0]['text'] = '原图资料：' + json.dumps(bundle)
        parts.extend(extra)
    elif mutation in ('overview_metadata', 'roi_metadata'):
        role = 'overview' if mutation == 'overview_metadata' else 'roi'
        part = next(
            part
            for part in parts
            if part.get('text', '').startswith('图像视图：')
            and json.loads(part['text'].split('：', 1)[1])['role'] == role
        )
        metadata = json.loads(part['text'].split('：', 1)[1])
        metadata.update(crop_bbox=[-999, -999, -998, -998], sent_size=[1, 1])
        part['text'] = '图像视图：' + json.dumps(metadata)
    elif mutation == 'overview':
        if pair_count == 2:
            second = context['pairs']['p1']
            assert first['required_image_ids'] != second['required_image_ids']
            first['required_image_ids'], second['required_image_ids'] = (
                second['required_image_ids'],
                first['required_image_ids'],
            )
        else:
            first['required_image_ids'].reverse()
    elif mutation == 'roi':
        region = next(
            region for region in [*first['windows'], *first['unmapped_regions']] if region['main_media_id']
        )
        region['main_media_id'] = first['required_image_ids'][0]
    else:
        annotation = first['annotations']['main'][0]
        annotation[mutation] = {
            'bbox': [1, 2, 3, 4],
            'raw_label': '错误类别',
            'is_ignored': not annotation['is_ignored'],
            'annotation_type': '错误类型',
        }[mutation]
    parts[1]['text'] = json.dumps(context)
    with runtime.db.call_payloads.prepare(run_id, call_id, 'request', json.dumps(body).encode()) as prepared:
        prepared.publish()
        prepared.commit()
    with pytest.raises(AssertionError):
        compare_inputs(Path(runtime.db.db_path), control, run_id)


@pytest.mark.parametrize(
    ('source_case', 'mutation'),
    [
        (source_case, mutation)
        for source_case in ('distinct', 'same_pixels_distinct_rois', 'same_pixels_jpeg_distinct_rois')
        for mutation in (
            'bbox',
            'raw_label',
            'overview',
            'missing_roi',
            'moved_roi',
            'frozen_and_wire_missing_roi',
            'missing_roi_everywhere',
            'missing_mapped_roi_everywhere',
        )
        if mutation != 'missing_mapped_roi_everywhere' or source_case != 'distinct'
    ],
)
def test_input_comparison_checks_actual_annotation_review_requests(
    dataset, tmp_path, request, mutation, source_case
):
    if source_case.startswith('same_pixels_'):
        _, registry, config = dataset
        (tmp_path / 'images/normal.png').write_bytes((tmp_path / 'images/dent.png').read_bytes())
        (tmp_path / 'labels/normal.json').write_text(
            json.dumps(
                {
                    'imageWidth': 320,
                    'imageHeight': 240,
                    'shapes': [
                        {'label': 'dent', 'shape_type': 'rectangle', 'points': [[100, 100], [130, 130]]}
                    ],
                }
            )
        )
        if source_case == 'same_pixels_jpeg_distinct_rois':
            for name in ('normal', 'dent', 'scratch'):
                path = tmp_path / 'images' / (name + '.png')
                with Image.open(path) as original:
                    image = original.copy()
                image.save(path, format='JPEG')
        registry.rescan(config.dataset.id)
    runtime, _, run_id, anchor = request.getfixturevalue('similar_job')

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        context = json.loads(json.loads(request.content)['messages'][-1]['content'][1]['text'])
        response = (
            {
                'reviews': {
                    candidate: {
                        'verdict': 'EQUIVALENT',
                        'explanation': '两侧框覆盖相同。',
                        'issues': [],
                        'limitations': [],
                        'disputed_regions': [],
                    }
                    for candidate in context['facts']['candidates']
                }
            }
            if 'facts' in context
            else identity_response(context, 'unverified', '两图内容无法可靠确认。')
        )
        return httpx.Response(
            200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(response)}}]}
        )

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        review = ConsistencyAgentReview(runtime, client)
        state = review.verify(run_id, anchor)
        review.observe(
            run_id,
            anchor,
            {
                'request_id': 'wire-audit',
                'fingerprint': state.fingerprint,
                'candidate_ids': state.eligible_ids,
                'question': '比较两侧原始标注。',
            },
        )
    finally:
        client.close()
    control = {'run_id': run_id, 'pairs': []}
    compare_inputs(Path(runtime.db.db_path), control, run_id)
    with runtime.db.connection() as connection:
        call_id = connection.execute(
            """SELECT call_id FROM model_calls WHERE run_id=?
            AND json_extract(summary_json,'$.schema_name')='AnnotationReview'
            AND json_extract(summary_json,'$.operation')='generate'""",
            (run_id,),
        ).fetchone()[0]
    request, _ = runtime.db.call_payloads.read(run_id, call_id)
    body = json.loads(request)
    parts = body['messages'][-1]['content']
    context = json.loads(parts[1]['text'])
    if mutation in (
        'missing_roi',
        'moved_roi',
        'frozen_and_wire_missing_roi',
        'missing_roi_everywhere',
        'missing_mapped_roi_everywhere',
    ):
        mapped_window = None
        if mutation == 'missing_mapped_roi_everywhere':
            mapped_window = next(
                view['crop_bbox']
                for view in context['facts']['sources']['main']['visual_inputs']
                if view['window_source'] == 'mapped_window' and view['crop_bbox'] == [97, 97, 133, 133]
            )
        index = next(
            index
            for index, part in enumerate(parts)
            if part.get('text', '').startswith('图像视图：')
            and json.loads(part['text'].split('：', 1)[1])['role'] == 'roi'
            and (
                mapped_window is None
                or json.loads(part['text'].split('：', 1)[1])['crop_bbox'] == mapped_window
            )
        )
        removed = parts[index : index + 2]
        assert removed[-1]['type'] in ('image_url', 'input_image')
        del parts[index : index + 2]
        if mutation == 'moved_roi':
            parts.extend(removed)
        elif mutation in (
            'frozen_and_wire_missing_roi',
            'missing_roi_everywhere',
            'missing_mapped_roi_everywhere',
        ):
            with runtime.db.connection() as connection:
                frozen = json.loads(
                    connection.execute(
                        '''SELECT request_json FROM consistency_visual_requests
                    WHERE job_id=? AND anchor_id=? AND request_id='wire-audit' ''',
                        (run_id, anchor),
                    ).fetchone()[0]
                )
                index = next(
                    index
                    for index, media in enumerate(frozen['media'])
                    if media['role'] == 'roi'
                    and (mapped_window is None or media['crop_bbox'] == mapped_window)
                )
                missing = frozen['media'].pop(index)
                if mutation in ('missing_roi_everywhere', 'missing_mapped_roi_everywhere'):
                    sources = [
                        next(iter(frozen['facts']['sources'].values())),
                        context['facts']['sources']['main'],
                    ]
                    for source in sources:
                        source['visual_inputs'] = [
                            view
                            for view in source['visual_inputs']
                            if view['crop_bbox'] != missing['crop_bbox']
                            or view['representation'] != missing['representation']
                        ]
                    header = next(part for part in parts if part.get('text', '').startswith('原图资料：'))
                    bundle = json.loads(header['text'].split('：', 1)[1])
                    bundle['visual_inputs'] = context['facts']['sources']['main']['visual_inputs']
                    header['text'] = '原图资料：' + json.dumps(bundle)
                connection.execute(
                    '''UPDATE consistency_visual_requests SET request_json=?
                    WHERE job_id=? AND anchor_id=? AND request_id='wire-audit' ''',
                    (json.dumps(frozen), run_id, anchor),
                )
    elif mutation == 'overview':
        candidate = next(iter(context['facts']['required_image_ids']))
        context['facts']['required_image_ids'][candidate] = ['main_image', 'main_image']
    else:
        context['facts']['sources']['main']['annotations'][0][mutation] = (
            [1, 2, 3, 4] if mutation == 'bbox' else '错误类别'
        )
    parts[1]['text'] = json.dumps(context)
    with runtime.db.call_payloads.prepare(run_id, call_id, 'request', json.dumps(body).encode()) as prepared:
        prepared.publish()
        prepared.commit()
    with pytest.raises(AssertionError):
        compare_inputs(Path(runtime.db.db_path), control, run_id)
