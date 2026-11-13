import hashlib
import json


from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.consistency.annotation_views import annotation_views
from iad_core.consistency.identity_regions import IdentityRegionPair, IdentityRegionSource
from iad_core.duplicate.verification_models import Registration
from iad_core.evidence.images import EvidenceImages


class IdentityInputPlan(AnalysisModel):
    geometry: Registration
    region_pairs: list[IdentityRegionPair]


class IdentityInputs:
    def __init__(self, db):
        self.db = db

    def freeze(self, run_id, anchor_id, candidate_id, sources, samples, prompts):
        fingerprint = hashlib.sha256(json.dumps([prompts, [source.model_dump(mode='json') for source in sources]],
            sort_keys=True).encode()).hexdigest()
        with self.db.connection() as connection:
            saved = connection.execute('''SELECT fingerprint,plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''', (run_id, anchor_id, candidate_id)).fetchone()
        if saved:
            if saved['fingerprint'] != fingerprint:
                raise ValueError('图像内容验证的冻结来源或提示词发生变化')
            return IdentityInputPlan.model_validate_json(saved['plan_json'])
        geometry = ImageCorrespondence.estimate(*(sample.image_path for sample in samples))
        sizes = [(sample.width, sample.height) for sample in samples]
        pairs = {}
        images = EvidenceImages(self.db.db_path)
        for side, source in enumerate(sources):
            if source.annotations.dataset_format != 'labelme':
                continue
            source.annotations.require_task('bbox_defect')
            originals = {item.annotation_id: item for item in source.annotations.annotations}
            for region in annotation_views(samples[side], source.annotations.annotations):
                box, mapped = tuple(region.crop_bbox), None
                if geometry.matrix is not None:
                    try:
                        projected = geometry.map_bounds(box, sizes[side], sizes[1 - side], to_main=side == 1)
                        if projected[0] < projected[2] and projected[1] < projected[3]:
                            mapped = tuple(projected)
                    except ValueError:
                        mapped = None
                main, candidate = (box, mapped) if side == 0 else (mapped, box)
                key = (main, candidate)
                origins = [IdentityRegionSource(side=('main','candidate')[side], annotation_id=origin.annotation_id,
                    original_bbox=originals[origin.annotation_id].bbox) for origin in region.origins]
                if key in pairs:
                    pairs[key].source_annotations.extend(origins)
                    continue
                identity = 'rp_' + hashlib.sha256(json.dumps([fingerprint, main, candidate]).encode()).hexdigest()
                pairs[key] = IdentityRegionPair(region_pair_id=identity, source_annotations=origins,
                    main_window=main, candidate_window=candidate, mapping='registered' if mapped else 'unverified',
                    limitation=None if mapped else '无法可靠定位另一侧的对应关注区域。',
                    main_media=images.capture(samples[0], 'roi', 'annotation', list(main), full_resolution=True).evidence if main else None,
                    candidate_media=images.capture(samples[1], 'roi', 'annotation', list(candidate), full_resolution=True).evidence if candidate else None)
        plan = IdentityInputPlan(geometry=geometry.facts, region_pairs=list(pairs.values()))
        return self.save(run_id, anchor_id, candidate_id, sources, prompts, plan)

    def save(self, run_id, anchor_id, candidate_id, sources, prompts, plan):
        fingerprint = hashlib.sha256(json.dumps([prompts, [source.model_dump(mode='json') for source in sources]],
            sort_keys=True).encode()).hexdigest()
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO consistency_identity_inputs(job_id,anchor_id,candidate_id,fingerprint,plan_json)
                VALUES(?,?,?,?,?) ON CONFLICT(job_id,anchor_id,candidate_id) DO NOTHING''',
                (run_id, anchor_id, candidate_id, fingerprint, plan.model_dump_json()))
            saved = connection.execute('''SELECT fingerprint,plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''', (run_id, anchor_id, candidate_id)).fetchone()
        if saved['fingerprint'] != fingerprint or IdentityInputPlan.model_validate_json(saved['plan_json']) != plan:
            raise ValueError('图像对观察与已冻结的来源或区域不一致')
        return plan

    def validate_record(self, run_id, anchor_id, record):
        if record.execution_status != 'completed' or record.relation == 'pixel_identical':
            return
        with self.db.connection() as connection:
            saved = connection.execute('''SELECT plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''', (run_id, anchor_id, record.candidate_id)).fetchone()
        if saved is None:
            raise ValueError('候选资格缺少冻结的实际观察输入')
        plan = IdentityInputPlan.model_validate_json(saved[0])
        if record.source != 'vision' or record.region_pairs != plan.region_pairs or record.geometry != plan.geometry:
            raise ValueError('候选区域与冻结的来源、坐标或媒体不一致')
        if record.required_region_pair_ids != [pair.region_pair_id for pair in plan.region_pairs]:
            raise ValueError('候选资格遗漏了必需关注区域')
        if {check.region_pair_id for check in record.region_checks} != {
                pair.region_pair_id for pair in plan.region_pairs if pair.mapping == 'registered'}:
            raise ValueError('联合身份验证必须完整保存全部已送达成对局部的观察，整图不同也不能省略')
        if {check.region_pair_id for check in record.unmapped_region_checks} != {
                pair.region_pair_id for pair in plan.region_pairs if pair.mapping != 'registered'}:
            raise ValueError('必须保存全部未配对区域的实际观察')
        pairs = {pair.region_pair_id: pair for pair in plan.region_pairs}
        media = {view.evidence_id for view in record.media}
        for check in record.region_checks:
            pair = pairs.get(check.region_pair_id)
            if (pair is None or pair.mapping != 'registered' or pair.main_media is None or pair.candidate_media is None
                    or check.main_media_id != pair.main_media.evidence_id or check.candidate_media_id != pair.candidate_media.evidence_id
                    or not {check.main_media_id, check.candidate_media_id} <= media):
                raise ValueError('区域判断必须引用当前可靠配对的实际双侧媒体')
        for check in record.unmapped_region_checks:
            pair = pairs[check.region_pair_id]
            expected = {view.evidence_id for view in (pair.main_media, pair.candidate_media) if view is not None}
            if len(check.media_ids) != len(expected) or set(check.media_ids) != expected or not expected <= media:
                raise ValueError('未配对区域只能引用实际提供的局部')
