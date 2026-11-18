from sqlite3 import Connection
import json

from iad_core.advisory.analysis import VisualEvidence
from iad_core.consistency.agent_review_models import AnchorVisualRequest
from iad_core.consistency.annotation_inspection import AnnotationModelContext
from iad_core.consistency.annotation_views import annotation_views
from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.identity_inputs import IdentityInputPlan


class RecordedModelInputs:
    """Verify transmitted pair references against immutable sources and region plans."""

    def __init__(self, connection: Connection, run_id: str):
        self.connection, self.run_id = connection, run_id

    def evidence(self, anchor_id: str, candidate_id: str) -> FrozenEvidence:
        row = self.connection.execute(
            '''SELECT r.snapshot_json FROM consistency_anchor_evidence a
            JOIN consistency_results r USING(evidence_id)
            WHERE a.job_id=? AND a.anchor_id=? AND a.candidate_id=?''',
            (self.run_id, anchor_id, candidate_id),
        ).fetchone()
        assert row is not None, '缺少图像对的冻结来源'
        return FrozenEvidence.model_validate_json(row[0])

    def annotations(self, anchor_id: str, candidate_id: str) -> list:
        sources = self.evidence(anchor_id, candidate_id).sources
        return sorted(
            [
                (
                    source.sample.sample_id,
                    source.image.sha256,
                    source.annotations.model_dump(
                        mode='json',
                        include={
                            'dataset_format',
                            'annotation_coordinates',
                            'annotations',
                            'policy',
                            'errors',
                            'availability',
                        },
                    ),
                )
                for source in (sources.left, sources.right)
            ],
            key=lambda value: value[0],
        )

    def verify_pair(
        self,
        anchor_id: str,
        candidate_id: str,
        context: dict,
        images: dict[str, tuple[dict, str]],
        record_media: list[dict],
    ) -> set[str]:
        captured = self.evidence(anchor_id, candidate_id).sources
        sources = {source.image.sha256: source for source in (captured.left, captured.right)}
        roots = {
            view.sha256: view
            for item in record_media
            if (view := VisualEvidence.model_validate(item)).role == 'overview'
        }
        overviews = [images[alias][1] for alias in context['required_image_ids']]
        assert len(overviews) == 2 and set(overviews) == roots.keys(), '实际请求的原图引用与图像对不符'
        ordered = [sources[roots[sha].source_sha256] for sha in overviews]
        expected_views = {alias: roots[sha] for alias, sha in zip(context['required_image_ids'], overviews)}
        annotation_aliases = {}
        if ordered[0].annotations.dataset_format == 'labelme':
            assert set(context['annotations']) == {'main', 'candidate'}, '实际标注来源不完整'
            for side, source in zip(('main', 'candidate'), ordered):
                annotations = source.annotations.annotations
                actual = context['annotations'][side]
                expected = [
                    annotation.model_dump(
                        mode='json', include={'annotation_type', 'raw_label', 'bbox', 'polygon', 'is_ignored'}
                    )
                    for annotation in annotations
                ]
                assert [
                    {key: value for key, value in item.items() if key != 'annotation_id'} for item in actual
                ] == expected, '实际HTTP标注的坐标、类别、类型或忽略状态改变'
                for annotation, item in zip(annotations, actual):
                    annotation_aliases[(side, annotation.annotation_id)] = item['annotation_id']
            assert len(set(annotation_aliases.values())) == len(annotation_aliases), '实际HTTP标注短引用重复'
        else:
            assert 'annotations' not in context, '图像分类请求不应包含矩形标注'
        main_id, candidate_id = (source.sample.sample_id for source in ordered)
        row = self.connection.execute(
            '''SELECT plan_json FROM consistency_identity_inputs
            WHERE job_id=? AND anchor_id=? AND candidate_id=?''',
            (self.run_id, main_id, candidate_id),
        ).fetchone()
        assert row is not None, '缺少本次原图方向的冻结局部计划'
        plan = IdentityInputPlan.model_validate_json(row[0])
        assert context['geometry'] == plan.geometry.model_dump(
            mode='json', exclude_none=True
        ), '实际配准参数改变'
        assert context['required_region_pair_ids'] == [
            f'r{index}' for index in range(len(plan.region_pairs))
        ], '实际请求没有按顺序包含全部局部'
        for section, registered in (('windows', True), ('unmapped_regions', False)):
            expected_regions = [
                (index, region)
                for index, region in enumerate(plan.region_pairs)
                if (region.mapping == 'registered') == registered
            ]
            actual_regions = context[section]
            assert len(actual_regions) == len(expected_regions), '实际请求局部数量改变'
            for actual, (index, region) in zip(actual_regions, expected_regions):
                for side in ('main', 'candidate'):
                    media = getattr(region, side + '_media')
                    alias = actual[side + '_media_id']
                    assert (images[alias][1] if alias is not None else None) == (
                        media.sha256 if media else None
                    ), '实际请求的局部图片引用不符'
                    if media is not None:
                        expected_views[alias] = media
                expected = {
                    'window_index': index,
                    'ref': f'r{index}',
                    'region_pair_id': f'r{index}',
                    'mapping': region.mapping,
                    'source_annotations': [
                        {
                            **origin.model_dump(mode='json'),
                            'annotation_id': annotation_aliases[(origin.side, origin.annotation_id)],
                        }
                        for origin in region.source_annotations
                    ],
                    'main_window': list(region.main_window) if region.main_window is not None else None,
                    'candidate_window': (
                        list(region.candidate_window) if region.candidate_window is not None else None
                    ),
                    'main_media_id': actual['main_media_id'],
                    'candidate_media_id': actual['candidate_media_id'],
                    'limitation': region.limitation,
                }
                assert actual == expected, '实际请求的局部坐标或标注归属改变'
        for alias, view in expected_views.items():
            metadata = view.model_context()
            metadata.pop('evidence_id')
            assert images[alias] == (metadata, view.sha256), '实际图片视图坐标、尺寸或表示改变'
        return set(expected_views)

    def verify_audit(
        self, call_id: str, context: dict, image_groups: dict[str, list[tuple[dict, str]]]
    ) -> None:
        row = self.connection.execute(
            '''SELECT v.request_json FROM model_calls c
            JOIN consistency_visual_requests v ON v.job_id=c.run_id
            AND v.anchor_id=json_extract(c.summary_json,'$.sample_id')
            AND v.request_id=json_extract(c.summary_json,'$.request_id') WHERE c.call_id=?''',
            (call_id,),
        ).fetchone()
        assert row is not None, '缺少标注审核的冻结请求'
        request = AnchorVisualRequest.model_validate_json(row[0])
        captured = {}
        required_windows = {}
        for candidate_id in request.candidate_ids:
            evidence = self.evidence(request.anchor_id, candidate_id)
            pair = evidence.sources
            captured.update({source.sample.sample_id: source for source in (pair.left, pair.right)})
            for source, other in ((pair.left, pair.right), (pair.right, pair.left)):
                if (
                    source.annotations.dataset_format != 'labelme'
                    or source.annotations.annotation_coordinates != 'RAW'
                ):
                    continue
                annotation_sources = [source.annotations]
                if (
                    evidence.result.verification.relation == 'EXACT'
                    and other.annotations.annotation_coordinates == 'RAW'
                ):
                    annotation_sources.append(other.annotations)
                for annotations in annotation_sources:
                    required_windows.setdefault(source.sample.sample_id, set()).update(
                        (tuple(region.crop_bbox), 'raw')
                        for region in annotation_views(source.sample, annotations.annotations)
                    )
        for source in request.facts['sources'].values():
            frozen = captured[source['sample_id']]
            assert source['annotations'] == [
                annotation.model_dump(mode='json', exclude={'mask_path'})
                for annotation in frozen.annotations.annotations
            ], '标注审核原始标注改变'
            assert (
                source['category_mapping'] == frozen.annotations.policy.category_mapping
            ), '标注类别映射改变'
        projection = AnnotationModelContext(request)
        assert context == projection.model_context(), '实际标注审核上下文与冻结请求不同'
        original_ids = {source['evidence_id'] for source in request.facts['sources'].values()}
        expected_aliases = {projection.references.public[identity] for identity in original_ids}
        assert set(image_groups) == expected_aliases, '标注审核实际图片来源改变'
        expected_groups = {}
        window_groups = {}
        original = None
        for media in request.media:
            if media.evidence_id in original_ids:
                assert media.is_whole_image, '冻结图片组必须以原图开始'
                original = media
            assert original is not None, '冻结局部缺少所属原图'
            assert media.source_sha256 == original.source_sha256, '冻结局部与所属原图的源文件不同'
            alias = projection.references.public[original.evidence_id]
            metadata = media.model_context()
            metadata.pop('evidence_id')
            expected_groups.setdefault(alias, set()).add((json.dumps(metadata, sort_keys=True), media.sha256))
            window_groups.setdefault(alias, set()).add((tuple(media.crop_bbox), media.representation))
        assert expected_groups.keys() == expected_aliases, '冻结标注审核图片来源不完整'
        for source in request.facts['sources'].values():
            windows = window_groups[projection.references.public[source['evidence_id']]]
            assert windows == {
                (tuple(view['crop_bbox']), view['representation']) for view in source['visual_inputs']
            }, '冻结媒体遗漏图组声明的局部视图'
            assert (
                required_windows.get(source['sample_id'], set()) <= windows
            ), '冻结媒体遗漏原始标注或精确同图对侧标注要求的局部视图'
        for alias, expected in expected_groups.items():
            actual = {(json.dumps(metadata, sort_keys=True), sha) for metadata, sha in image_groups[alias]}
            assert actual == expected, '标注审核实际原图或局部图片与来源不符'
