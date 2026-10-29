import hashlib
import json

from PIL import Image

from iad_core.advisory.analysis import VisualEvidence
from iad_core.consistency.context import ConsistencyContexts
from iad_core.consistency.context_models import ConsistencyContextRequest
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.gallery import GalleryMemberQuery, GalleryQueries, GalleryReference
from iad_core.consistency.group_analysis_models import FrozenAnalysisGroup, GroupAnalysisDraft, GroupAnalysisStart, GroupAnalysisView
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.evidence.images import PreparedImage
from iad_core.storage.database import Database
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


class GroupAnalysisQueries:
    def __init__(self, db: Database):
        self.db = db

    def freeze(self, reference: GalleryReference) -> tuple[FrozenAnalysisGroup, str]:
        query = GalleryMemberQuery(**reference.model_dump(include=set(GalleryReference.model_fields)), page_size=100)
        gallery = GalleryQueries(self.db)
        first = gallery.members(query)
        members = list(first.items)
        for page in range(2, (first.total + 99) // 100 + 1):
            members.extend(gallery.members(query.model_copy(update={'page': page})).items)
        group = FrozenAnalysisGroup(kind=reference.kind, group_id=reference.group_id, facts_state=reference.facts_state,
            anchor=first.anchor, members=members)
        fingerprint = hashlib.sha256(json.dumps(group.model_dump(mode='json'), sort_keys=True).encode()).hexdigest()
        return group, fingerprint

    def read(self, reference: GalleryReference) -> GroupAnalysisView:
        _, fingerprint = self.freeze(reference)
        with self.db.connection() as connection:
            row = connection.execute('''SELECT * FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS'
                AND json_extract(payload_json,'$.request.group_fingerprint')=? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1''', (fingerprint,)).fetchone()
        if row is None:
            return GroupAnalysisView(group_id=reference.group_id, status='NOT_ANALYZED')
        return self.view(row)

    @staticmethod
    def view(row) -> GroupAnalysisView:
        payload = json.loads(row['payload_json'])
        result = GroupAnalysisDraft.model_validate(payload['group_analysis']) if row['status'] == 'COMPLETED' else None
        return GroupAnalysisView(group_id=payload['request']['frozen_group']['group_id'], status=row['status'], run_id=row['job_id'],
            model_name=payload['request']['model_name'], result=result,
            error=(payload['errors'][0]['message'] if payload['errors'] else row['message']) if row['status'] in ('FAILED','PARTIAL','CANCELLED','INTERRUPTED') else None,
            candidate_offsets={member['image']['sample']['sample_id']:index for index,member in enumerate(payload['request']['frozen_group']['members'])})


class GroupAnalyses(GroupAnalysisQueries):
    MAX_IMAGES = 16
    MAX_TEXT_BYTES = 128 * 1024

    def __init__(self, runtime: WorkbenchRuntime, client: VlmClient | None = None):
        super().__init__(runtime.db)
        self.runtime, self.client = runtime, client

    def start(self, request: GroupAnalysisStart, origin_session_id: str | None = None) -> GroupAnalysisView:
        if self.client is None:
            raise ValueError('A resolved workbench model is required to analyze a group')
        group, fingerprint = self.freeze(request)
        with self.runtime.jobs.lock:
            with self.db.connection() as connection:
                previous = connection.execute('''SELECT * FROM job_runs WHERE job_type='CONSISTENCY_ANALYSIS'
                    AND json_extract(payload_json,'$.request.analysis_request_id')=?''', (request.request_id,)).fetchone()
            if previous is not None:
                if json.loads(previous['payload_json'])['request']['group_fingerprint'] != fingerprint:
                    raise ConsistencyError('INVALID_SCOPE', 'Analysis request_id belongs to a different frozen group')
                return self.view(previous)
            sample = group.anchor.sample
            started = self.runtime.jobs.start('CONSISTENCY_ANALYSIS', sample.task_id,
                {'dataset_id': sample.dataset_id, 'sample_ids': [sample.sample_id, *[member.image.sample.sample_id for member in group.members]],
                    'analysis_request_id': request.request_id, 'group_fingerprint': fingerprint,
                    'frozen_group': group.model_dump(mode='json'), 'model_name': self.client.resolve_model(),
                    'model_profile': self.client.profile.model_dump(), 'origin_session_id': origin_session_id}, self.execute, '正在分析冻结图组')
            with self.db.connection() as connection:
                row = connection.execute('SELECT * FROM job_runs WHERE job_id=?', (started['run_id'],)).fetchone()
            return self.view(row)

    def execute(self, context: JobContext):
        group = FrozenAnalysisGroup.model_validate(context.payload['frozen_group'])
        service = self.runtime.consistency_service
        contexts, images, seen = [], [], set()
        references = {member.image.sample.sample_id: member for member in group.members}
        for member in group.members:
            context.checkpoint()
            if not member.comparison:
                contexts.append({'candidate_id': member.image.sample.sample_id, 'limitation': 'No direct saved comparison with the fixed anchor'})
                evidence_ids = [member.image.evidence_id]
            else:
                evidence_ids = [member.comparison.evidence_id]
            for evidence_id in evidence_ids:
                saved = ConsistencyRepository(self.db).get(evidence_id)
                query = ConsistencyContextRequest(evidence_id=evidence_id, result_id=saved.result.result_id,
                    difference_page_size=10, max_images=16, max_image_bytes=64*1024*1024, max_text_bytes=self.MAX_TEXT_BYTES)
                while True:
                    context.checkpoint()
                    value = ConsistencyContexts(self.db).get(query)
                    contexts.append({'candidate_id': member.image.sample.sample_id, 'evidence_id': value.evidence_id,
                        'result_id': value.result_id, 'source_states': value.source_states.model_dump(mode='json'),
                        'sources': {side: {'sample_id': source.sample.sample_id, 'name': source.sample.relative_path,
                            'original_quality': source.sample.quality_status, 'quality_source': source.sample.quality_source,
                            'policy': source.policy.model_dump(mode='json'), 'issues': source.issues}
                            for side, source in value.sources.items()},
                        'verification': value.verification.model_dump(mode='json'),
                        'differences': [difference.model_dump(mode='json') for difference in value.differences],
                        'review': value.review_context.model_dump(mode='json')})
                    for media in value.media:
                        if media.sha256 in seen:
                            continue
                        if len(images) >= self.MAX_IMAGES:
                            raise ConsistencyError('RESOURCE_LIMIT', 'Complete group evidence exceeds the model image budget; no partial group summary was generated')
                        path = service.evidence_media(evidence_id, media.descriptor.media_id)['path']
                        with Image.open(path) as image:
                            size = list(image.size)
                        side = getattr(saved.sources, media.descriptor.side)
                        descriptor = media.descriptor
                        visual = VisualEvidence(evidence_id=evidence_id + ':' + descriptor.media_id, role='roi' if descriptor.difference_id else 'overview',
                            source='annotation' if 'overlay' in descriptor.representation else 'coverage',
                            original_size=[side.sample.width, side.sample.height], crop_bbox=list(descriptor.bbox), sent_size=size,
                            sha256=media.sha256, source_sha256=side.image.sha256,
                            representation='annotation_overlay' if 'overlay' in descriptor.representation else 'raw')
                        images.append(PreparedImage(evidence=visual, path=path));seen.add(media.sha256)
                    if not value.next_cursor:
                        break
                    query = query.model_copy(update={'cursor': value.next_cursor})
        instruction = ('分析整个冻结图组；每条结论引用真实candidate_id。引用比较证据时填写comparison对象，'
            '其中result_id和evidence_id必须完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。'
            '像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。'
            '标注匹配工具输出是待核对的候选解释，不是漏标结论。必须独立查看原图、双侧标注层和局部图，'
            '逐项核对单侧标注是否其实对应另一侧位置微移、范围变化或拆分合并的标注；不得照抄工具分类作为视觉结论。'
            '说明每个候选实际属于类别变化、位置/范围变化、实例划分、疑似缺多标注或无法判断，并引用对应差异证据。'
            '没有固定主图直接比较证据的成员只能保留未知。不得编造引用；明确未核实规范和任何覆盖限制。\n'
            + json.dumps({'anchor': group.anchor.model_dump(mode='json'), 'candidates': list(references), 'evidence': contexts}, ensure_ascii=False))
        if len(instruction.encode()) > self.MAX_TEXT_BYTES:
            raise ConsistencyError('RESOURCE_LIMIT', 'Complete group evidence exceeds the model text budget; no partial group summary was generated')
        context.checkpoint()
        plan = self.client.plan(GroupAnalysisDraft, instruction, images, context.payload['model_name'])
        context.checkpoint()
        result = self.client.generate(plan)
        for conclusion in result.conclusions:
            for reference in conclusion.references:
                member = references.get(reference.candidate_id)
                if member is None:
                    raise ValueError('Model reference points outside the frozen group')
                if citation := reference.comparison:
                    allowed = {member.image.evidence_id, member.comparison.evidence_id if member.comparison else None}
                    saved = ConsistencyRepository(self.db).get(citation.evidence_id) if citation.evidence_id in allowed else None
                    if saved is None or saved.result.result_id != citation.result_id or (citation.difference_id and citation.difference_id not in {item.difference_id for item in saved.result.annotation.differences}):
                        raise ValueError('Model reference does not match this candidate and frozen comparison')
        context.record(context.payload['sample_ids'], group_analysis=result.model_dump(mode='json'), message='图组模型分析已保存')
