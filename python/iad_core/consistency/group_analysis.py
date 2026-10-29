import hashlib
import json

from pathlib import Path

from iad_core.advisory.analysis import VisualEvidence
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.gallery import GalleryMemberQuery, GalleryQueries, GalleryReference
from iad_core.consistency.group_analysis_models import GROUP_ANALYSIS_SCHEMA, FrozenAnalysisGroup, GroupAnalysisDraft, GroupAnalysisStart, GroupAnalysisView
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.evidence.retained import RetainedImages
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
        fingerprint = gallery.analysis_fingerprint(reference,group.anchor,gallery.analysis_evidence_ids(reference))
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
            error=(payload['errors'][0]['message'] if payload['errors'] else row['message']) if row['status'] in ('FAILED','PARTIAL','CANCELLED','INTERRUPTED') else None)


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
                    'analysis_request_id': request.request_id, 'group_fingerprint': fingerprint,'analysis_schema':GROUP_ANALYSIS_SCHEMA,
                    'frozen_group': group.model_dump(mode='json'), 'model_name': self.client.resolve_model(),
                    'model_profile': self.client.profile.model_dump(), 'origin_session_id': origin_session_id}, self.execute, '正在分析冻结图组')
            with self.db.connection() as connection:
                row = connection.execute('SELECT * FROM job_runs WHERE job_id=?', (started['run_id'],)).fetchone()
            return self.view(row)

    def execute(self, context: JobContext):
        group = FrozenAnalysisGroup.model_validate(context.payload['frozen_group'])
        service = self.runtime.consistency_service
        images, seen, sources, contexts = [], {}, {}, []
        retained, previews = RetainedImages(self.db), EvidenceImages(self.db.db_path)
        references = {member.image.sample.sample_id: member for member in group.members}
        evidence_ids = list(dict.fromkeys([group.anchor.evidence_id,*[member.image.evidence_id for member in group.members],
            *[member.comparison.evidence_id for member in group.members if member.comparison]]))
        byte_count = 0
        for evidence_id in evidence_ids:
            context.checkpoint()
            saved = service.evidence(evidence_id)
            source_refs = {}
            for side in ('left','right'):
                source = getattr(saved.sources,side)
                source_key = 'source_'+hashlib.sha256(json.dumps([source.sample.sample_id,source.image.sha256,source.annotations.model_dump(mode='json')],sort_keys=True).encode()).hexdigest()
                source_refs[side] = source_key
                if source_key in sources:
                    continue
                path = retained.path(source.image)
                sample = source.sample.model_copy(update={'image_path':path})
                annotations = source.annotations.annotations
                original = PreparedImage(VisualEvidence(evidence_id=evidence_id+':'+side+'-original',role='overview',
                    source='coverage',original_size=[sample.width,sample.height],crop_bbox=[0,0,sample.width,sample.height],
                    sent_size=[sample.width,sample.height],sha256=source.image.sha256,source_sha256=source.image.sha256,
                    representation='raw'),path)
                regions = previews.plan(sample,annotations,[]) if source.annotations.annotation_coordinates=='RAW' else []
                prepared = [(original,None),*[(previews.capture(sample,'roi',region.source,region.crop_bbox,source.image.sha256),region)
                    for region in regions]]
                visual_inputs = []
                for image,region in prepared:
                    context.checkpoint()
                    if image.evidence.sha256 not in seen:
                        byte_count += Path(image.path).stat().st_size
                        if len(images)>=self.MAX_IMAGES or byte_count>64*1024*1024:
                            raise ConsistencyError('RESOURCE_LIMIT','Complete raw group evidence exceeds the model image budget; no partial group summary was generated')
                        images.append(image);seen[image.evidence.sha256]=image.evidence.evidence_id
                    visual_inputs.append({'evidence_id':seen[image.evidence.sha256],'crop_bbox':image.evidence.crop_bbox,
                        'annotation_origins':[origin.model_dump(mode='json') for origin in region.origins] if region else []})
                sources[source_key] = {'sample_id':sample.sample_id,'name':sample.relative_path,
                    'original_size':[sample.width,sample.height],'original_quality':sample.quality_status,
                    'quality_source':sample.quality_source,'policy':source.annotations.policy.model_dump(mode='json'),
                    'annotation_coordinates':source.annotations.annotation_coordinates,
                    'annotations':[annotation.model_dump(mode='json',exclude={'mask_path'}) for annotation in annotations],
                    'issues':source.issues,'visual_inputs':visual_inputs}
            contexts.append({'evidence_id':evidence_id,'result_id':saved.result.result_id,
                'source_states':saved.source_states.model_dump(mode='json'),'sources':source_refs,
                'verification':saved.result.verification.model_dump(mode='json'),
                'differences':[difference.model_dump(mode='json') for difference in saved.result.annotation.differences],
                'review':ConsistencyReview(self.db).context(evidence_id).model_dump(mode='json')})
        instruction = ('分析整个冻结图组；每条结论引用真实candidate_id。引用比较证据时填写comparison对象，'
            '其中result_id和evidence_id必须完整复制上下文中的配对引用，difference_id可选；无直接比较依据时comparison为null。'
            '像素/几何事实、模型视觉解释、标注规范和人工质量裁决必须区分；相似度不能证明缺陷，不能写Gold或人工裁决。'
            '标注匹配工具输出是待核对的候选解释，不是漏标结论。必须联合查看完整原图、原始标注数据和无叠加的局部原始像素裁剪，'
            '逐项核对单侧标注是否其实对应另一侧位置微移、范围变化或拆分合并的标注；不得照抄工具分类作为视觉结论。'
            '本任务只比较标注差异，不判断哪一侧标注正确。对应标注的原始类别值不同就是标注类别不同，'
            '例如15变为18，或图像级OK与NG不同，均属于MATERIAL类别差异；不需要先确认类别语义或等价性。'
            '不得预设类别映射或语义相近，不得用缺少映射、类别定义未知或两图像素相同将已确认的类别差异降为EQUIVALENT或UNCERTAIN。'
            '若独立查看原图和局部后发现两类所指对象视觉相近，视觉相近可以写入详细分析，但不能否定类别差异。'
            '不限于工具已报出的差异，也不限于现有分类：独立检查完整原图与标注，主动发现漏检差异、标错对象、'
            '无关背景、忽略区域、边界约定及其他有图像依据的问题。细微坐标变化不能直接等同标注错误；'
            '区分视觉基本一致、可能合理的标注浮动、实质差异与证据不足，未知公差不得自行编造。'
            '全部图像附件均为原始图像或原始裁剪，没有绘制标注框、文字或颜色。标注仅在JSON数据中，不能把标注颜色当产品特征。'
            '对完整图组联合分析后，overall.text只写一句简短的差异结论，仅概括差异类型，不写位置、数值、依据或建议。'
            '不要重复verdict，不加“整体结论为”等引导语，不写分析过程或理由。'
            '例如“标注类别不同”“标注位置或范围不同”“缺少或多出标注”“标注视觉基本一致”“标注差异证据不足”；'
            '多种差异用短语合并，其他实际发现据实概括，不局限于这些示例。详细依据、位置、数值、解释和限制写入conclusions与limitations。'
            'assessments必须对每个candidate_id恰好给出一次核对：EQUIVALENT表示视觉基本一致或仅轻微标注浮动，'
            'MATERIAL表示已确认的类别差异或其他实质标注差异，UNCERTAIN表示比较证据不足；findings自由描述问题，不受工具分类限制。'
            'assessments通过candidate_id绑定已提供的固定主图比较证据，不重复输出comparison；没有直接比较证据的候选只能UNCERTAIN。'
            '说明每个候选实际属于类别变化、位置/范围变化、实例划分、疑似缺多标注或无法判断，并引用对应差异证据。'
            '没有固定主图直接比较证据的成员只能保留未知。不得编造引用；仅记录实际影响差异判断的证据或覆盖限制，'
            '不要求裁决标注正误，不将缺少类别映射或语义定义列为已确认类别差异的判断限制。\n'
            + json.dumps({'anchor': {'sample_id':group.anchor.sample.sample_id,'evidence_id':group.anchor.evidence_id,'side':group.anchor.side},
                'candidates': {identity:{'evidence_id':member.image.evidence_id,'side':member.image.side,
                    'comparison':member.comparison.model_dump(mode='json') if member.comparison else None}
                    for identity,member in references.items()}, 'sources':sources,'evidence': contexts}, ensure_ascii=False,separators=(',',':')))
        if len(instruction.encode()) > self.MAX_TEXT_BYTES:
            raise ConsistencyError('RESOURCE_LIMIT', 'Complete group evidence exceeds the model text budget; no partial group summary was generated')
        context.checkpoint()
        plan = self.client.plan(GroupAnalysisDraft, instruction, images, context.payload['model_name'])
        context.checkpoint()
        result = self.client.generate(plan)
        if len(result.assessments)!=len(references) or {item.candidate_id for item in result.assessments}!=set(references):
            raise ValueError('Model assessments must cover every frozen candidate exactly once')
        for assessment in result.assessments:
            member=references[assessment.candidate_id]
            if member.comparison is None and assessment.verdict!='UNCERTAIN':
                raise ValueError('A candidate without direct evidence must remain uncertain')
        for reference in [*result.overall.references,*[ref for conclusion in result.conclusions for ref in conclusion.references]]:
            member = references.get(reference.candidate_id)
            if member is None:
                raise ValueError('Model reference points outside the frozen group')
            if citation := reference.comparison:
                allowed = {member.image.evidence_id, member.comparison.evidence_id if member.comparison else None}
                saved = ConsistencyRepository(self.db).get(citation.evidence_id) if citation.evidence_id in allowed else None
                if saved is None or saved.result.result_id != citation.result_id or (citation.difference_id and citation.difference_id not in {item.difference_id for item in saved.result.annotation.differences}):
                    raise ValueError('Model reference does not match this candidate and frozen comparison')
        context.record(context.payload['sample_ids'], group_analysis=result.model_dump(mode='json'), message='图组模型分析已保存')
