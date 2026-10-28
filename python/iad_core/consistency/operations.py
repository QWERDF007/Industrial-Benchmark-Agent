import base64
import binascii

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Identifier, ImageRetrieve,ImageIndexPrepare,ConsistencyStart
from iad_core.consistency.job_models import ConsistencyBatchReference,ConsistencyBatchRetry
from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
from iad_core.consistency.reports import ConsistencyReports
from iad_core.consistency.gallery import GalleryQueries,GalleryQuery,GalleryMemberQuery
from iad_core.consistency.group_queries import GroupQueries,GroupQuery,GroupMemberQuery
from iad_core.consistency.context import ConsistencyContexts,ConsistencyContextRequest
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.review_models import ConsistencyReviewSubmission, CorrectionVerification
from iad_core.consistency.service import ConsistencyService
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare, ConsistencyEvidenceReference, ConsistencyEvidenceMediaReference
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.workbench.runtime import workbench


class RetrievalInvocation(AnalysisModel):
    request: ImageRetrieve
    owner_id: Identifier | None = None


class TemporaryImageAdmission(AnalysisModel):
    data_base64: str = Field(max_length=4 * ((SourceImage.MAX_SOURCE_BYTES + 2) // 3))
    owner_id: Identifier
    source_ref: Identifier | None = None


class TemporaryImageRelease(AnalysisModel):
    owner_id: Identifier
    image_ref: Identifier


class TemporaryImageOwner(AnalysisModel):
    owner_id: Identifier


def image_retrieve(args: dict, db_path: str) -> dict:
    invocation = RetrievalInvocation.model_validate(args)
    return ConsistencyService(workbench(db_path).db).retrieve(invocation.request,
        owner_id=invocation.owner_id).model_dump(mode='json')


def image_index_prepare(args: dict,db_path: str) -> dict:
    return workbench(db_path).consistency.prepare(ImageIndexPrepare.model_validate(args)).model_dump(mode='json')


def consistency_start(args: dict,db_path: str) -> dict:
    return workbench(db_path).consistency.start(ConsistencyStart.model_validate(args)).model_dump(mode='json')


def consistency_status(args: dict,db_path: str) -> dict:
    return workbench(db_path).consistency.status(ConsistencyBatchReference.model_validate(args).batch_id).model_dump(mode='json')


def consistency_list(args: dict,db_path: str) -> dict:
    return workbench(db_path).consistency.list().model_dump(mode='json')


def consistency_cancel(args: dict,db_path: str) -> dict:
    return workbench(db_path).consistency.cancel(ConsistencyBatchReference.model_validate(args).batch_id).model_dump(mode='json')


def consistency_retry(args: dict,db_path: str) -> dict:
    request=ConsistencyBatchRetry.model_validate(args)
    return workbench(db_path).consistency.retry(request.batch_id,request_id=request.request_id,sample_ids=request.sample_ids).model_dump(mode='json')


def consistency_query(args: dict,db_path: str) -> dict:
    return ResultQueries(workbench(db_path).db).query(ConsistencyQuery.model_validate(args)).model_dump(mode='json')


def consistency_report(args: dict,db_path: str) -> dict:
    return ConsistencyReports(workbench(db_path).db).report(ConsistencyQuery.model_validate(args)).model_dump(mode='json')


def consistency_groups(args: dict,db_path: str) -> dict:
    return GroupQueries(workbench(db_path).db).query(GroupQuery.model_validate(args)).model_dump(mode='json')


def consistency_group_members(args: dict,db_path: str) -> dict:
    return GroupQueries(workbench(db_path).db).members(GroupMemberQuery.model_validate(args)).model_dump(mode='json')


def consistency_context(args: dict,db_path: str) -> dict:
    return ConsistencyContexts(workbench(db_path).db).get(ConsistencyContextRequest.model_validate(args)).model_dump(mode='json')


def consistency_review_context(args: dict, db_path: str) -> dict:
    reference = ConsistencyEvidenceReference.model_validate(args)
    return ConsistencyReview(workbench(db_path).db).context(reference.evidence_id).model_dump(mode='json')


def consistency_review_submit(args: dict, db_path: str) -> dict:
    return ConsistencyReview(workbench(db_path).db).submit(ConsistencyReviewSubmission.model_validate(args)).model_dump(mode='json')


def consistency_correction_verify(args: dict, db_path: str) -> dict:
    return ConsistencyReview(workbench(db_path).db).verify(CorrectionVerification.model_validate(args)).model_dump(mode='json')


def consistency_compare(args: dict, db_path: str) -> dict:
    return ConsistencyService(workbench(db_path).db).compare(ConsistencyCompare.model_validate(args)).model_dump(mode='json')


def consistency_evidence(args: dict, db_path: str) -> dict:
    reference=ConsistencyEvidenceReference.model_validate(args)
    return ConsistencyService(workbench(db_path).db).evidence(reference.evidence_id).model_dump(mode='json')


def consistency_evidence_media(args: dict, db_path: str) -> dict:
    reference=ConsistencyEvidenceMediaReference.model_validate(args)
    return ConsistencyService(workbench(db_path).db).evidence_media(reference.evidence_id,reference.media_id)


def consistency_evidence_export(args: dict, db_path: str) -> dict:
    reference=ConsistencyEvidenceReference.model_validate(args)
    return ConsistencyService(workbench(db_path).db).evidence_export(reference.evidence_id).model_dump(mode='json')

def temporary_image_accept(args: dict, db_path: str) -> dict:
    admission = TemporaryImageAdmission.model_validate(args)
    try:
        payload = base64.b64decode(admission.data_base64, validate=True)
    except (ValueError, binascii.Error) as error:
        raise ConsistencyError('UNSUPPORTED_IMAGE', 'Image payload is not valid base64') from error
    return workbench(db_path).temporary_images.accept(payload, owner_id=admission.owner_id,
        source_ref=admission.source_ref).model_dump(mode='json')


def temporary_image_release(args: dict, db_path: str) -> dict:
    release = TemporaryImageRelease.model_validate(args)
    workbench(db_path).temporary_images.release(release.image_ref, owner_id=release.owner_id)
    return {'released': True}


def temporary_image_release_owner(args: dict, db_path: str) -> dict:
    owner = TemporaryImageOwner.model_validate(args)
    workbench(db_path).temporary_images.release_owner(owner.owner_id)
    return {'released': True}


def consistency_gallery(args: dict, db_path: str) -> dict:
    return GalleryQueries(workbench(db_path).db).query(GalleryQuery.model_validate(args)).model_dump(mode='json')


def consistency_gallery_members(args: dict, db_path: str) -> dict:
    return GalleryQueries(workbench(db_path).db).members(GalleryMemberQuery.model_validate(args)).model_dump(mode='json')


def consistency_report_saved(args: dict, db_path: str) -> dict:
    return ConsistencyReports(workbench(db_path).db).saved(args['query_id']).model_dump(mode='json')


def consistency_group_analysis(args: dict, db_path: str) -> dict:
    from iad_core.consistency.gallery import GalleryReference
    from iad_core.consistency.group_analysis import GroupAnalyses
    return GroupAnalyses(workbench(db_path)).read(GalleryReference.model_validate(args)).model_dump(mode='json')


def consistency_group_analyze(args: dict, db_path: str) -> dict:
    from iad_core.consistency.group_analysis import GroupAnalyses
    from iad_core.consistency.group_analysis_models import GroupAnalysisStart
    runtime=workbench(db_path)
    return runtime.invoke_model(args.get('_model_execution'), lambda services:
        GroupAnalyses(runtime,services.client).start(GroupAnalysisStart.model_validate(args['request']),args.get('origin_session_id')).model_dump(mode='json'))
