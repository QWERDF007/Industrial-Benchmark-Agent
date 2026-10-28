import hashlib
import json
import os
import sys
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict

from iad_core.storage.database import Database
from iad_core.storage.repositories import (
    AnnotationRepository,
    ImportIssueRepository,
    SampleRepository,
)
from iad_core.storage.review_repository import ReviewRepository
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.dataset.path_safety import PathSafetyError, validate_sample_image_path
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.workbench.projection import suggestion_meta as extract_suggestion_meta
from iad_core.workbench.query import SampleQuery, WorkbenchQuery
from iad_core.workbench.review import HumanReview, ReviewSubmission, ReviewHistoryQuery
from iad_core.workbench.runtime import workbench, close_workbenches
from iad_core.exploration.operations import (direction_exploration_start, direction_exploration_status, direction_exploration_list,
    direction_exploration_cancel, direction_exploration_retry, direction_exploration_get, direction_exploration_evidence,
    direction_exploration_presets, direction_exploration_preset_save)

from iad_core.workbench.model_operations import (model_settings_get, model_settings_save, model_settings_view,
    model_settings_validate, model_environment_get, model_connection_check, model_provider_validate)
from iad_core.feature.operations import feature_settings_view, feature_settings_save, feature_profile_create, feature_connection_check
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.operations import (consistency_review_context, consistency_review_submit, consistency_correction_verify, image_retrieve, temporary_image_accept,
    temporary_image_release, temporary_image_release_owner,consistency_compare,consistency_evidence,
    consistency_evidence_media,consistency_evidence_export,image_index_prepare,consistency_start,consistency_status,
    consistency_list,consistency_cancel,consistency_retry,consistency_query,consistency_report,consistency_report_saved,consistency_group_analysis,consistency_group_analyze,consistency_gallery,consistency_gallery_members,consistency_groups,consistency_group_members,consistency_context)

DEFAULT_DB_PATH = os.environ.get("IAD_DB_PATH", "data/benchmark.db")
_output_lock = threading.Lock()


def emit(payload: Dict[str, Any]) -> None:
    with _output_lock:
        sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
        sys.stdout.flush()


def tool_call(args, db_path):
    from iad_core.tools import execute_internal_tool
    return execute_internal_tool(args["tool_name"], args.get("arguments", {}), db_path=db_path)


def dataset_list(args, db_path):
    return WorkbenchQuery(Database(db_path)).datasets()


def dataset_get(args, db_path):
    registry = DatasetRegistry(Database(db_path))
    config = registry.resolve(**args)
    return next(item for item in WorkbenchQuery(registry.db).datasets()["datasets"] if item["dataset_id"] == config.dataset.id)


def dataset_import(args, db_path):
    registry = DatasetRegistry(Database(db_path))
    req = DatasetImport.model_validate(args).root
    config = registry.import_dataset(req)
    return dataset_get({"dataset_id": config.dataset.id}, db_path)


def dataset_preview(args, db_path):
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.task.config import FolderRule
    rules = [FolderRule.model_validate(r) for r in args.get("rules", [])] if "rules" in args else None
    return preview_folder_dataset(args["root_dir"], rules=rules).model_dump()


def dataset_delete(args, db_path):
    DatasetRegistry(Database(db_path)).delete(args['dataset_id'])
    return {'deleted_dataset_id': args['dataset_id']}


def dataset_archive_inspect(args, db_path):
    from iad_core.dataset.archive import DatasetArchive
    return DatasetArchive(args['archive_path']).inspect().model_dump()


def dataset_update(args, db_path):
    registry = DatasetRegistry(Database(db_path))
    if args.get("reset_references") is not None:
        if not isinstance(args["reset_references"], bool) or "reference_sample_ids" in args:
            raise ValueError("reset_references must be a boolean and cannot be combined with reference_sample_ids")
        if args["reset_references"]:
            registry.reset_references(args["dataset_id"])
    if "name" in args:
        registry.rename(args["dataset_id"], args["name"])
    if "reference_sample_ids" in args:
        registry.set_references(args["dataset_id"], args["reference_sample_ids"])
    if "unannotated_is_normal" in args:
        config = registry.get(args["dataset_id"])
        if not isinstance(args["unannotated_is_normal"], bool):
            raise ValueError("unannotated_is_normal must be a boolean")
        config.dataset.unannotated_is_normal = args["unannotated_is_normal"]
        registry.save(config, require_existing=True)
    return dataset_get({"dataset_id": args["dataset_id"]}, db_path)


def dataset_scan(args, db_path):
    from iad_core.dataset.scanner import scan_dataset
    from iad_core.task.config import FolderRule
    if args.get("config_path"):
        return scan_dataset(config_path=args["config_path"], db_path=db_path, force_pixels=args.get('force_pixels', False)).model_dump()
    registry = DatasetRegistry(Database(db_path))
    config = registry.resolve(dataset_id=args.get("dataset_id"), task_id=args.get("task_id"))
    rules = args.get("folder_rules", args.get("rules"))
    return registry.rescan(
        config.dataset.id,
        image_dir=args.get("image_dir") or args.get("root_dir"),
        annotation_dir=args.get("annotation_dir"),
        folder_rules=[FolderRule.model_validate(rule) for rule in rules] if rules is not None else None,
        preview_fingerprint=args.get("preview_fingerprint"),
        force_pixels=args.get('force_pixels', False),
    ).model_dump()


def sample_list(args, db_path):
    return WorkbenchQuery(Database(db_path)).samples(SampleQuery.model_validate(args))


def sample_get(args, db_path):
    from iad_core.consistency.audit_repository import AuditConsistencyRepository
    db = Database(db_path)
    sample = SampleRepository(db).get(args["sample_id"])
    if not sample:
        raise LookupError("Sample not found")
    suggestion = AuditSuggestionRepository(db).latest_by_sample(sample.sample_id)
    meta = extract_suggestion_meta(suggestion) if suggestion else None
    issues = ImportIssueRepository(db).list_by_sample(sample.sample_id)
    decision = ReviewRepository(db).get_decision(sample.sample_id)
    from iad_core.knowledge.repository import KnowledgeRepository
    repository = KnowledgeRepository(db)
    analysis = suggestion.analysis if suggestion else None
    consistency = AuditConsistencyRepository(db).latest(sample.sample_id)
    knowledge = {kind + '_knowledge': repository.get(version_id).model_dump(exclude={'mining_steps', 'verification_steps'}) if version_id else None
        for kind, version_id in [('normal', analysis.normal_version_id if analysis else None),
                                 ('defect', analysis.defect_version_id if analysis else None)]}
    return {"sample": sample.model_dump(), **knowledge, "suggestion": meta,
            "consistency": consistency.model_dump(mode='json') if consistency else None,
            **WorkbenchQuery(db).sample_scores(sample.sample_id),
            "annotations": [a.model_dump() for a in AnnotationRepository(db).list_by_sample(sample.sample_id)],
            "technical_issues": [i.model_dump() for i in issues], "review_decision": decision.model_dump() if decision else None,
            "review_history": [record.model_dump() for record in ReviewRepository(db).list_history(sample.sample_id)]}


def sample_image_path(args, db_path):
    sample = SampleRepository(Database(db_path)).get(args["sample_id"])
    if not sample:
        raise LookupError("Sample not found")
    image_path = validate_sample_image_path(sample, db_path)
    media_type = {".png": "image/png", ".webp": "image/webp", ".bmp": "image/bmp"}.get(Path(image_path).suffix.lower(), "image/jpeg")
    return {"sample_id": sample.sample_id, "path": image_path, "media_type": media_type, "exists": True}


def sample_thumbnail(args, db_path):
    from PIL import Image
    size = int(args.get("size", 240))
    if not 32 <= size <= 1024:
        raise ValueError("Thumbnail size must be between 32 and 1024")
    info = sample_image_path(args, db_path)
    source = Path(info["path"])
    stat = source.stat()
    fingerprint = f"{args['sample_id']}:{stat.st_size}:{stat.st_mtime_ns}:{size}"
    cache = Path(db_path).resolve().parent / "cache" / "thumbnails"
    cache.mkdir(parents=True, exist_ok=True)
    thumb = cache / (hashlib.sha256(fingerprint.encode()).hexdigest() + ".jpg")
    cached = thumb.is_file()
    if not cached:
        with Image.open(source) as image:
            image = image.convert("RGB")
            image.thumbnail((size, size), Image.Resampling.LANCZOS)
            output = thumb.with_suffix(f".{threading.get_ident()}.tmp")
            image.save(output, "JPEG", quality=85)
            output.replace(thumb)
    return {"sample_id": args["sample_id"], "path": str(thumb), "media_type": "image/jpeg", "cached": cached}


def sample_mask_path(args, db_path):
    from iad_core.evidence.masks import MaskImages
    db = Database(db_path)
    sample = SampleRepository(db).get(args["sample_id"])
    if not sample:
        raise LookupError("Sample not found")
    annotation = next((item for item in AnnotationRepository(db).list_by_sample(sample.sample_id)
                       if item.annotation_id == args["annotation_id"]), None)
    if not annotation:
        raise LookupError("Annotation not found in this sample")
    if annotation.annotation_type != "mask" or annotation.geometry_status == "INVALID":
        raise ValueError("Annotation is not a valid pixel mask")
    if args.get("sha256") != annotation.mask_sha256:
        raise ValueError("Mask version changed; refresh the sample")
    MaskImages.load(annotation, sample)
    return {"path": annotation.mask_path, "media_type": "image/png"}


def review_queue(args, db_path):
    from iad_core.review.service import ReviewQueueService
    service = ReviewQueueService(task_id=args["task_id"], db_path=db_path)
    page, size = int(args.get("page", 1)), int(args.get("page_size", 20))
    return {"task_id": args["task_id"], "total_candidates": len(service.candidates), "page": page,
            "page_size": size, "items": service.get_queue(limit=size, offset=(page - 1) * size)}


def review_evidence(args, db_path):
    from iad_core.evidence.builder import EvidenceBuilder
    return EvidenceBuilder(task_id=args["task_id"], db_path=db_path).build(args["sample_id"]).model_dump()


def knowledge_review_context(args, db_path):
    from iad_core.workbench.knowledge_review import KnowledgeReview, KnowledgeReviewReference
    return KnowledgeReview(Database(db_path)).context(KnowledgeReviewReference.model_validate(args)).model_dump(mode='json')


def knowledge_review_queue(args, db_path):
    from iad_core.workbench.knowledge_review import KnowledgeReview
    return {'items': [item.model_dump() for item in KnowledgeReview(Database(db_path)).queue(args['dataset_id'])]}


def knowledge_review_submit(args, db_path):
    from iad_core.workbench.knowledge_review import KnowledgeReview, KnowledgeReviewSubmission
    return KnowledgeReview(Database(db_path)).submit(KnowledgeReviewSubmission.model_validate(args)).model_dump(mode='json')


def review_submit_decision(args, db_path):
    return HumanReview(Database(db_path)).submit(ReviewSubmission.model_validate(args))


def review_history(args, db_path):
    return HumanReview(Database(db_path)).history(ReviewHistoryQuery.model_validate(args)).model_dump()


def review_stats(args, db_path):
    return WorkbenchQuery(Database(db_path)).report(**args)


def report_get(args, db_path):
    return WorkbenchQuery(Database(db_path)).report(**args)


def audit_start(args, db_path):
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.audit.start(**{key: value for key, value in args.items() if key != '_model_execution'}))


def audit_status(args, db_path):
    return workbench(db_path).audit.status(args["run_id"])


def audit_cancel(args, db_path):
    return workbench(db_path).audit.cancel(args["run_id"])


def audit_retry(args, db_path):
    from iad_core.workbench.job_models import JobRetry
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.audit.retry(**JobRetry.model_validate({key: value for key, value in args.items() if key != '_model_execution'}).model_dump()), args['run_id'])


def audit_retry_options(args, db_path):
    return workbench(db_path).jobs.retry_options(args['run_id'], ('MODEL_AUDIT',))


def audit_list(args, db_path):
    return {"jobs": workbench(db_path).audit.list(args["dataset_id"])}


def audit_evidence(args, db_path):
    from iad_core.evidence.images import EvidenceImages
    suggestion = AuditSuggestionRepository(Database(db_path)).get(args["suggestion_id"])
    if not suggestion or not suggestion.analysis:
        raise LookupError("Audit evidence not found")
    for image in [suggestion.analysis.overview, *[region.image for region in suggestion.analysis.regions], *suggestion.analysis.auxiliary_evidence]:
        if image.evidence_id == args["evidence_id"]:
            return {"path": EvidenceImages(db_path).path(image), "media_type": image.media_type}
    raise LookupError("Audit evidence not found")


def inspection_context(args, db_path):
    from iad_core.workbench.inspection_context import InspectionContext, InspectionReference
    return InspectionContext(Database(db_path)).resolve(InspectionReference.model_validate(args)).model_dump()


def knowledge_get(args, db_path):
    from iad_core.knowledge.query import KnowledgeReader
    return KnowledgeReader(Database(db_path)).read(**args).model_dump()


def knowledge_prompt_get(args, db_path):
    from iad_core.knowledge.prompts import KnowledgePrompts, MiningPromptQuery
    return KnowledgePrompts(Database(db_path)).read(MiningPromptQuery.model_validate(args)).model_dump()


def knowledge_prompt_save(args, db_path):
    from iad_core.knowledge.prompts import KnowledgePrompts, MiningPromptEdit
    return KnowledgePrompts(Database(db_path)).save(MiningPromptEdit.model_validate(args)).model_dump()


def knowledge_directions_adopt(args, db_path):
    from iad_core.knowledge.prompts import KnowledgePrompts
    return KnowledgePrompts(Database(db_path)).adopt(args).model_dump()


def knowledge_scope_open(args, db_path):
    from iad_core.knowledge.scopes import KnowledgeScopeOpen, KnowledgeScopes
    return KnowledgeScopes(Database(db_path)).open(KnowledgeScopeOpen.model_validate(args['request']), args.get('origin_session_id')).model_dump()


def knowledge_scope_get(args, db_path):
    from iad_core.knowledge.scopes import KnowledgeScopes
    scopes = KnowledgeScopes(Database(db_path))
    scope_run_id = args.get('scope_run_id') or scopes.active(args.get('origin_session_id'), args.get('dataset_id'), args.get('kind'))
    if not scope_run_id:
        raise LookupError('该会话没有匹配的活动连续范围，请提供原范围引用')
    return scopes.read(scope_run_id).model_dump()


def knowledge_scope_stop(args, db_path):
    return workbench(db_path).knowledge.stop_scope(args['scope_run_id'])


def knowledge_scope_resume(args, db_path):
    from iad_core.knowledge.scopes import KnowledgeScopes
    return KnowledgeScopes(Database(db_path)).set_active(args['scope_run_id'], True, args.get('origin_session_id')).model_dump()


def knowledge_details(args, db_path):
    from iad_core.knowledge.models import KnowledgeDetailQuery
    from iad_core.knowledge.query import KnowledgeReader
    return KnowledgeReader(Database(db_path)).details(KnowledgeDetailQuery.model_validate(args)).model_dump()


def knowledge_sources(args, db_path):
    from iad_core.knowledge.models import KnowledgeSourceQuery
    from iad_core.knowledge.query import KnowledgeReader
    return KnowledgeReader(Database(db_path)).source_page(KnowledgeSourceQuery.model_validate(args)).model_dump()


def knowledge_start(args, db_path):
    from iad_core.knowledge.requests import MiningInvocation, MiningStart
    invocation = MiningInvocation.model_validate({key: value for key, value in args.items() if key != '_model_execution'})
    request = invocation.request
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.knowledge.start(request=MiningStart.model_validate(request.model_dump(exclude={'kind'})),
            kind=request.kind, model_name=invocation.model_name, origin_session_id=invocation.origin_session_id, scope_run_id=invocation.scope_run_id))


def knowledge_status(args, db_path):
    return workbench(db_path).knowledge.status(args["run_id"])


def knowledge_cancel(args, db_path):
    return workbench(db_path).knowledge.cancel(args["run_id"])


def knowledge_retry(args, db_path):
    from iad_core.workbench.job_models import JobRetry
    return workbench(db_path).invoke_model(args.get('_model_execution'), lambda services:
        services.knowledge.retry(**JobRetry.model_validate({key: value for key, value in args.items() if key != '_model_execution'}).model_dump()), args['run_id'])


def knowledge_retry_options(args, db_path):
    from iad_core.knowledge.service import KNOWLEDGE_JOB_TYPES
    return workbench(db_path).jobs.retry_options(args['run_id'], KNOWLEDGE_JOB_TYPES)


def knowledge_list(args, db_path):
    return {"jobs": workbench(db_path).knowledge.list(args["dataset_id"])}


def knowledge_job_delete(args, db_path):
    return workbench(db_path).knowledge.delete(args['run_id'])


def knowledge_check_remove(args, db_path):
    from iad_core.knowledge.maintenance import KnowledgeMaintenance
    from iad_core.knowledge.models import KnowledgeCheckRemoval
    return KnowledgeMaintenance(Database(db_path)).remove_check(args['version_id'],
        KnowledgeCheckRemoval.model_validate(args['request'])).model_dump()


def knowledge_observations(args, db_path):
    from iad_core.knowledge.trace import KnowledgeTrace
    job = workbench(db_path).knowledge.status(args['run_id'])
    return KnowledgeTrace.page(job, int(args.get('page', 1)), int(args.get('page_size', 10))).model_dump()


def knowledge_evidence(args, db_path):
    from iad_core.evidence.images import EvidenceImages
    from iad_core.knowledge.repository import KnowledgeRepository
    if bool(args.get('run_id')) == bool(args.get('version_id')):
        raise ValueError('证据引用须明确选择作业run_id或已发布version_id之一')
    if args.get('run_id'):
        from iad_core.knowledge.trace import KnowledgeTrace
        return KnowledgeTrace.evidence(workbench(db_path).knowledge.status(args['run_id']), args['evidence_id'], db_path)
    snapshot = KnowledgeRepository(Database(db_path)).get(args["version_id"])
    for evidence in snapshot.evidence:
        if evidence.image.evidence_id == args["evidence_id"]:
            return {"path": EvidenceImages(db_path).path(evidence.image), "media_type": evidence.image.media_type}
    raise LookupError("Knowledge evidence not found")


def directory_list(args, db_path):
    return DatasetRegistry.directories(args.get("path", "/data1"))


def model_call_get(args, db_path):
    from iad_core.workbench.calls import ModelCalls
    return ModelCalls(Database(db_path)).get(args['run_id'], args['call_id']).model_dump()


OPERATIONS = {handler.__name__: handler for handler in (
    consistency_review_context, consistency_review_submit, consistency_correction_verify,
    image_retrieve, temporary_image_accept, temporary_image_release, temporary_image_release_owner,
    consistency_compare,consistency_evidence,consistency_evidence_media,consistency_evidence_export,
    image_index_prepare,consistency_start,consistency_status,consistency_list,consistency_cancel,consistency_retry,consistency_query,consistency_report,consistency_report_saved,consistency_group_analysis,consistency_group_analyze,consistency_gallery,consistency_gallery_members,consistency_groups,consistency_group_members,consistency_context,
    feature_settings_view, feature_settings_save, feature_profile_create, feature_connection_check,
    model_settings_get, model_settings_save, model_settings_view, model_settings_validate, model_environment_get, model_connection_check, model_provider_validate,
    direction_exploration_presets, direction_exploration_preset_save,
    knowledge_directions_adopt, direction_exploration_start, direction_exploration_status, direction_exploration_list, direction_exploration_cancel,
    direction_exploration_retry, direction_exploration_get, direction_exploration_evidence,
    tool_call, dataset_list, dataset_get, dataset_import, dataset_preview, dataset_archive_inspect, dataset_update, dataset_scan, dataset_delete,
    sample_list, sample_get, sample_image_path, sample_thumbnail, sample_mask_path,
    review_queue, review_evidence, review_submit_decision, review_history,
    knowledge_review_context, knowledge_review_submit, knowledge_review_queue,
    review_stats, report_get, audit_start, audit_status, audit_cancel, audit_retry, audit_retry_options, audit_list, audit_evidence, inspection_context, directory_list,
    knowledge_scope_open, knowledge_scope_get, knowledge_scope_stop, knowledge_scope_resume,
    knowledge_get, knowledge_prompt_get, knowledge_prompt_save, knowledge_details, knowledge_sources, knowledge_observations, knowledge_evidence, knowledge_start, knowledge_status, knowledge_cancel, knowledge_retry, knowledge_retry_options, knowledge_list, knowledge_job_delete, knowledge_check_remove, model_call_get,
)}


def dispatch_request(req_data: Dict[str, Any], default_db_path: str = DEFAULT_DB_PATH):
    req_id = req_data.get("request_id", "request")
    try:
        operation = req_data.get("operation")
        if operation not in OPERATIONS:
            emit({"event": "error", "request_id": req_id, "error": {"code": "UNKNOWN_OPERATION", "message": "Unknown operation", "details": {"status_code": 400}}})
            return
        data = OPERATIONS[operation](req_data.get("arguments", {}), req_data.get("db_path", default_db_path))
        result = {"event": "result", "request_id": req_id, "status": data.get("status", "OK") if isinstance(data, dict) else "OK", "data": data}
        if operation == "tool_call":
            result.update(metrics=data.get("metrics"), artifacts=data.get("artifacts"))
        emit(result)
    except Exception as error:
        status = 422 if isinstance(error, (ValueError, KeyError, TypeError)) else 404 if isinstance(error, (LookupError, FileNotFoundError)) else 500
        if isinstance(error, PathSafetyError):
            status = error.status_code
        code = "INVALID_ARGUMENT" if status == 422 else "NOT_FOUND" if status == 404 else "EXECUTION_ERROR"
        if isinstance(error, ConsistencyError):
            code, status = error.code, error.status_code
        if error.__class__.__name__ == "ToolContractError":
            code, status = "CONTRACT_ERROR", error.status_code
        if status == 500:
            traceback.print_exc(file=sys.stderr)
        emit({"event": "error", "request_id": req_id, "status": "ERROR", "error": {"code": code, "message": str(error), "details": {"status_code": status}}})


def main():
    if len(sys.argv) > 1:
        dispatch_request(json.loads(sys.argv[1]))
        return
    try:
        with ThreadPoolExecutor(max_workers=4) as executor:
            for line in sys.stdin:
                if not line.strip():
                    continue
                try:
                    request = json.loads(line)
                    if not isinstance(request, dict):
                        raise ValueError("Expected a JSON object")
                    executor.submit(dispatch_request, request)
                except (ValueError, TypeError) as error:
                    emit({"event": "error", "request_id": "decode", "error": {"code": "JSON_DECODE_ERROR", "message": str(error)}})
    finally:
        close_workbenches()


if __name__ == "__main__":
    main()
