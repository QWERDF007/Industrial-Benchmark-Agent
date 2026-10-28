import base64
import hashlib
import json
from pathlib import Path

from iad_core.consistency.context_models import ConsistencyContext,ConsistencyContextRequest,ConsistencyReturnLocation,ContextCursor,ContextMedia,ContextSource
from iad_core.consistency.errors import ConsistencyError
from iad_core.evidence.consistency import ConsistencyEvidence
from iad_core.evidence.consistency_media import ConsistencyMedia
from iad_core.evidence.files import file_sha256
from iad_core.storage.database import Database
from iad_core.consistency.review import ConsistencyReview


class ConsistencyContexts:
    def __init__(self,db: Database):self.db=db

    def get(self,request: ConsistencyContextRequest) -> ConsistencyContext:
        request=ConsistencyContextRequest.model_validate(request)
        bundle=ConsistencyEvidence(self.db).get(request.evidence_id)
        if bundle.result.result_id!=request.result_id:raise ConsistencyError('INVALID_SCOPE','The result does not belong to this evidence')
        choices={item.difference_id:item for item in bundle.result.annotation.differences}
        if len(set(request.difference_ids))!=len(request.difference_ids) or not set(request.difference_ids).issubset(choices):
            raise ConsistencyError('INVALID_SCOPE','Requested difference references are not distinct members of this evidence')
        selected=[choices[identity] for identity in request.difference_ids] if request.difference_ids else list(choices.values())
        location=request.return_location or ConsistencyReturnLocation(evidenceId=request.evidence_id,resultId=request.result_id)
        if location.evidenceId not in (None,request.evidence_id) or location.resultId not in (None,request.result_id):
            raise ConsistencyError('INVALID_SCOPE','Return location belongs to a different result or evidence')
        if location.differenceId is not None and location.differenceId not in choices:
            raise ConsistencyError('INVALID_SCOPE','Return difference is outside this evidence')
        location=location.model_copy(update={'evidenceId':request.evidence_id,'resultId':request.result_id})
        fingerprint=hashlib.sha256(json.dumps(request.model_dump(mode='json',exclude={'cursor'}),sort_keys=True).encode()).hexdigest()
        start=0
        if request.cursor:
            try:cursor=ContextCursor.model_validate_json(base64.b64decode(request.cursor+'='*(-len(request.cursor)%4),altchars=b'-_',validate=True))
            except ValueError as error:raise ConsistencyError('INVALID_SCOPE','Invalid context cursor') from error
            if cursor.request_hash!=fingerprint:raise ConsistencyError('INVALID_SCOPE','Context cursor belongs to a different request')
            start=cursor.after
            if start>=len(selected):raise ConsistencyError('INVALID_SCOPE','Context cursor is outside the requested differences')
        renderer=ConsistencyMedia(self.db)
        rendered={}
        def media_for(differences):
            identities={item.difference_id for item in differences}
            descriptors=[item for item in bundle.media if item.available and ((not item.difference_id and item.representation in ('original','annotation_overlay'))
                or (item.difference_id in identities and item.representation in ('preview','annotation_overlay','reference_overlay')))]
            media=[];raw={}
            for descriptor in descriptors:
                if descriptor.representation=='original':
                    blob=getattr(bundle.sources,descriptor.side).image
                    if blob.sha256 in raw:
                        raw[blob.sha256].sides.append(descriptor.side)
                        continue
                if descriptor.media_id not in rendered:
                    path=Path(renderer.render(bundle,descriptor)['path'])
                    rendered[descriptor.media_id]=(path.stat().st_size,file_sha256(path))
                size,sha=rendered[descriptor.media_id]
                item=ContextMedia(descriptor=descriptor,sides=[descriptor.side],byte_count=size,sha256=sha)
                media.append(item)
                if descriptor.representation=='original':raw[blob.sha256]=item
            return media
        context=ConsistencyContext(evidence_id=request.evidence_id,result_id=request.result_id,source_states=bundle.source_states,
            review_context=ConsistencyReview(self.db).context(request.evidence_id),
            sources={side:ContextSource(sample=source.sample,review=source.review,policy=source.annotations.policy,
                annotation_count=len(source.annotations.annotations),issues=source.issues) for side in ('left','right') for source in [getattr(bundle.sources,side)]},
            verification=bundle.result.verification,differences=[],total_differences=len(choices),requested_differences=len(selected),
            unselected_differences=len(choices)-len(selected),remaining_differences=len(selected)-start,next_cursor=None,media=[],return_location=location,
            normalization_note='原图证据保留原始解码像素；模型附件还会由宿主按图像能力归一，叠加/裁剪为显示预览，16位预览按完整数值范围映射到8位。附件不是新的逐像素证明，严格关系以冻结验证为准。双方标注分层，虚线仅是另一来源参考，不是新增标注。')
        stop=min(len(selected),start+request.difference_page_size)
        baseline=media_for([])
        if len(baseline)>request.max_images or sum(item.byte_count for item in baseline)>request.max_image_bytes:
            raise ConsistencyError('RESOURCE_LIMIT','The shared original and source layers exceed the image budget')
        for end in range(stop,start-1,-1):
            if end==start and selected:continue
            differences=selected[start:end]
            media=media_for(differences)
            next_cursor=base64.urlsafe_b64encode(ContextCursor(request_hash=fingerprint,after=end).model_dump_json().encode()).decode().rstrip('=') if end<len(selected) else None
            result=context.model_copy(update={'differences':differences,'media':media,'remaining_differences':len(selected)-end,'next_cursor':next_cursor})
            if (len(media)<=request.max_images and sum(item.byte_count for item in media)<=request.max_image_bytes
                    and len(result.model_dump_json().encode())<=request.max_text_bytes):return result
        raise ConsistencyError('RESOURCE_LIMIT','Evidence context exceeds the image or text budget; request a smaller difference selection or an explicit larger budget')
