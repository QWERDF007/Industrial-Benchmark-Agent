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
from iad_core.workbench.job_models import JobExecutionError
from iad_core.workbench.completion import ModelOutputError
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
from iad_core.workbench.analysis_operations import analysis_start, analysis_list, analysis_status, analysis_node, analysis_results, analysis_cancel, analysis_retry, analysis_delete
from iad_core.consistency.agent_operations import (consistency_agent_start, consistency_agent_snapshot,
    consistency_agent_anchors, consistency_agent_anchor, consistency_agent_session_created, consistency_agent_retrieve,
    consistency_agent_submit_empty, consistency_agent_failure, consistency_agent_finish,
    consistency_agent_context, consistency_agent_observe, consistency_agent_assess, consistency_agent_submit, consistency_agent_configuration, consistency_agent_verify,
    consistency_agent_trace_event, consistency_agent_trace_status, consistency_agent_cancel, consistency_agent_resume,
    consistency_agent_interrupt, consistency_agent_detail, consistency_agent_results, consistency_agent_report,
    consistency_agent_export, consistency_agent_gallery, consistency_agent_images, consistency_agent_members, consistency_agent_candidates,
    consistency_agent_review, consistency_agent_review_submit, consistency_agent_analysis, consistency_agent_plan, consistency_agent_capacity,
    consistency_agent_model_call_start, consistency_agent_model_call_end, consistency_agent_diagnostics, consistency_agent_prepare,
    consistency_agent_session_location, consistency_agent_media)
from iad_core.exploration.operations import (direction_exploration_evidence, direction_exploration_remove_direction,
    direction_exploration_presets, direction_exploration_preset_save)

from iad_core.workbench.module_settings import module_settings_get, module_settings_save, module_settings_validate
from iad_core.analysis.operations import ANALYSIS_AGENT_OPERATIONS
from iad_core.audit.operations import AUDIT_AGENT_OPERATIONS
from iad_core.workbench.model_operations import model_provider_validate
from iad_core.feature.operations import feature_settings_view, feature_settings_save, feature_profile_create, feature_connection_check
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.operations import (consistency_review_context, consistency_review_submit, consistency_correction_verify, image_retrieve, temporary_image_accept,
    consistency_model_status, consistency_model_cancel,
    temporary_image_release, temporary_image_release_owner,consistency_compare,consistency_evidence,
    consistency_evidence_media,consistency_evidence_export,image_index_prepare,consistency_start,consistency_status,
    consistency_list,consistency_cancel,consistency_delete,consistency_retry,consistency_query,consistency_report,consistency_report_saved,consistency_group_analysis,consistency_gallery,consistency_gallery_members,consistency_groups,consistency_group_members,consistency_context)

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
    group_id = args.get("group_id") or getattr(req, "group_id", None)
    if group_id:
        with registry.db.connection() as conn:
            conn.execute("UPDATE datasets SET group_id=? WHERE dataset_id=?", (group_id, config.dataset.id))
    return dataset_get({"dataset_id": config.dataset.id}, db_path)


def dataset_group_list(args, db_path):
    return {"groups": DatasetRegistry(Database(db_path)).list_groups()}


def dataset_group_create(args, db_path):
    return DatasetRegistry(Database(db_path)).create_group(name=args["name"], group_id=args.get("group_id"))


def dataset_group_update(args, db_path):
    return DatasetRegistry(Database(db_path)).update_group(group_id=args["group_id"], name=args["name"])


def dataset_group_delete(args, db_path):
    return DatasetRegistry(Database(db_path)).delete_group(group_id=args["group_id"], cascade=args.get("cascade", True))


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
    if "group_id" in args:
        with registry.db.connection() as conn:
            conn.execute("UPDATE datasets SET group_id=? WHERE dataset_id=?", (args["group_id"], args["dataset_id"]))
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
    from iad_core.analysis.queries import AnalysisQueries
    analysis = suggestion.analysis if suggestion else None
    consistency = AuditConsistencyRepository(db).latest(sample.sample_id)
    version_id = analysis.knowledge_version_id if analysis else None
    knowledge = AnalysisQueries(db).knowledge(version_id).model_dump(mode='json') if version_id else None
    return {"sample": sample.model_dump(), "knowledge": knowledge, "suggestion": meta,
            "consistency": consistency.model_dump(mode='json') if consistency else None,
            **WorkbenchQuery(db).sample_scores(sample.sample_id),
            "annotations": [a.model_dump() for a in AnnotationRepository(db).list_by_sample(sample.sample_id)],
            "technical_issues": [i.model_dump() for i in issues], "review_decision": decision.model_dump() if decision else None,
            "review_history": [record.model_dump() for record in ReviewRepository(db).list_history(sample.sample_id)]}


def sample_image_path(args, db_path):
    repo = SampleRepository(Database(db_path))
    sample = repo.get(args["sample_id"])
    if not sample and args.get("dataset_id"):
        sample = repo.get_by_dataset_and_relative_path(args["dataset_id"], args["sample_id"])
    if not sample and args.get("dataset_id") and not args["sample_id"].startswith(args["dataset_id"] + ":"):
        sample = repo.get(f"{args['dataset_id']}:{args['sample_id']}")
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
    repo = SampleRepository(db)
    sample = repo.get(args["sample_id"])
    if not sample and args.get("dataset_id"):
        sample = repo.get_by_dataset_and_relative_path(args["dataset_id"], args["sample_id"])
    if not sample and args.get("dataset_id") and not args["sample_id"].startswith(args["dataset_id"] + ":"):
        sample = repo.get(f"{args['dataset_id']}:{args['sample_id']}")
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


def workbench_initialize(args, db_path):
    workbench(db_path)
    return {}


def audit_sources(args, db_path):
    from iad_core.workbench.audit_sources import AuditSources
    return AuditSources(Database(db_path)).catalog(args['dataset_ids']).model_dump(mode='json')


def audit_start(args, db_path):
    raise ValueError('审计需要原生宿主，请通过 /api/iad/audit/start 提交')


def audit_status(args, db_path):
    from iad_core.workbench.job_families import JobFamilies
    from iad_core.workbench.job_models import JobView
    return JobView.from_snapshot(JobFamilies(Database(db_path)).snapshot(args['run_id'], ('MODEL_AUDIT',))).model_dump(mode='json')


def audit_cancel(args, db_path):
    raise ValueError('审计作业须由原生宿主停止，请通过 /api/iad/audit/cancel 提交')


def audit_retry(args, db_path):
    raise ValueError('审计作业须由原生宿主继续，请通过 /api/iad/audit/retry 提交')


def audit_retry_options(args, db_path):
    return workbench(db_path).jobs.retry_options(args['run_id'], ('MODEL_AUDIT',))


def audit_list(args, db_path):
    from iad_core.workbench.job_families import JobFamilies
    from iad_core.workbench.job_models import JobView
    return {'jobs':[JobView.from_snapshot(job).model_dump(mode='json')
        for job in JobFamilies(Database(db_path)).list(args['dataset_id'], ('MODEL_AUDIT',))]}


def audit_job_samples(args, db_path):
    from iad_core.audit.queries import AuditQueries
    from iad_core.workbench.audit_result_models import AuditSampleQuery
    return AuditQueries(Database(db_path)).samples(AuditSampleQuery.model_validate(args)).model_dump(mode='json')


def audit_job_sample(args, db_path):
    from iad_core.audit.queries import AuditQueries
    return AuditQueries(Database(db_path)).sample(args['run_id'], args['sample_id']).model_dump(mode='json')


def audit_job_report(args, db_path):
    from iad_core.audit.queries import AuditQueries
    return AuditQueries(Database(db_path)).report(args['run_id']).model_dump(mode='json')


def audit_job_export(args, db_path):
    from iad_core.audit.queries import AuditQueries
    return AuditQueries(Database(db_path)).export(args['run_id'])


def audit_evidence(args, db_path):
    from iad_core.evidence.images import EvidenceImages
    from iad_core.audit.models import AuditEvidenceQuery, NativeAuditEvidenceReference
    from iad_core.audit.queries import AuditQueries
    reference = AuditEvidenceQuery.model_validate(args).root
    if isinstance(reference, NativeAuditEvidenceReference):
        return AuditQueries(Database(db_path)).evidence(reference.run_id,reference.sample_id,reference.evidence_id)
    suggestion = AuditSuggestionRepository(Database(db_path)).get(args["suggestion_id"])
    if not suggestion or not suggestion.analysis:
        raise LookupError("Audit evidence not found")
    for image in [suggestion.analysis.overview, *[region.image for region in suggestion.analysis.regions],
                  *suggestion.analysis.auxiliary_evidence, *suggestion.analysis.reference_evidence]:
        if image.evidence_id == args["evidence_id"]:
            return {"path": EvidenceImages(db_path).path(image), "media_type": image.media_type}
    raise LookupError("Audit evidence not found")


def inspection_context(args, db_path):
    from iad_core.workbench.inspection_context import InspectionContext, InspectionReference
    return InspectionContext(Database(db_path)).resolve(InspectionReference.model_validate(args)).model_dump()


def knowledge_get(args, db_path):
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.workbench.job_snapshots import JobSnapshots
    if bool(args.get('run_id')) == bool(args.get('version_id')):
        raise ValueError('请选择作业run_id或发布version_id之一')
    db = Database(db_path)
    if args.get('run_id'):
        if JobSnapshots(db).snapshot(args['run_id'],('ANALYSIS_WORKFLOW',)).analysis_kind != 'knowledge':
            raise ValueError('所选作业不是知识挖掘')
        return analysis_results({'run_id':args['run_id']},db_path)
    return AnalysisQueries(db).knowledge(args['version_id']).model_dump(mode='json')


def knowledge_presets(args, db_path):
    from iad_core.knowledge.instructions import default_directions, DEFAULT_OBJECTIVE
    from iad_core.analysis.prompt_text import DEFAULT_KNOWLEDGE_USER_PROMPT
    return {'directions': [direction.model_dump() for direction in default_directions()],
        'objective': DEFAULT_OBJECTIVE, 'instruction': DEFAULT_KNOWLEDGE_USER_PROMPT}


def knowledge_details(args, db_path):
    from iad_core.knowledge.models import KnowledgeDetailQuery
    from iad_core.analysis.queries import AnalysisQueries
    return AnalysisQueries(Database(db_path)).details(KnowledgeDetailQuery.model_validate(args)).model_dump(mode='json')


def knowledge_versions(args, db_path):
    from iad_core.knowledge.models import KnowledgeVersionQuery, KnowledgeVersionCatalog
    from iad_core.analysis.queries import AnalysisQueries
    query = KnowledgeVersionQuery.model_validate(args)
    db = Database(db_path)
    DatasetRegistry(db).get(query.dataset_id)
    versions = AnalysisQueries(db).versions(query.dataset_id, 'knowledge')
    return KnowledgeVersionCatalog(dataset_id=query.dataset_id,
        current_version_id=versions[0].version_id if versions else None, versions=versions).model_dump(mode='json')


def knowledge_check_review(args, db_path):
    from iad_core.knowledge.check_reviews import KnowledgeCheckReviews
    from iad_core.knowledge.models import KnowledgeCheckReviewSubmission
    return KnowledgeCheckReviews(Database(db_path)).submit(KnowledgeCheckReviewSubmission.model_validate(args)).model_dump()


def knowledge_check_remove(args, db_path):
    from iad_core.knowledge.models import KnowledgeCheckRemoval
    from iad_core.analysis.maintenance import AnalysisMaintenance
    return AnalysisMaintenance(Database(db_path)).remove_check(args['version_id'],
        KnowledgeCheckRemoval.model_validate(args['request'])).model_dump(mode='json')


def knowledge_evidence(args, db_path):
    from iad_core.analysis.queries import AnalysisQueries
    if not args.get('version_id') or args.get('run_id'):
        raise ValueError('证据须引用固定的知识发布版本')
    return AnalysisQueries(Database(db_path)).evidence(args['version_id'], args['evidence_id'])


def directory_list(args, db_path):
    return DatasetRegistry.directories(args.get("path", "/data1"), file_offset=args.get("file_offset", 0), file_limit=args.get("file_limit", 40))


def model_call_get(args, db_path):
    from iad_core.workbench.calls import ModelCalls
    return ModelCalls(Database(db_path)).get(args['run_id'], args['call_id']).model_dump()


OPERATIONS = {handler.__name__: handler for handler in (
    consistency_agent_start, consistency_agent_snapshot, consistency_agent_anchors, consistency_agent_anchor,
    consistency_agent_session_created, consistency_agent_retrieve, consistency_agent_submit_empty,
    consistency_agent_failure, consistency_agent_finish,
    consistency_agent_context, consistency_agent_observe, consistency_agent_assess, consistency_agent_submit,
    consistency_agent_configuration, consistency_agent_verify,
    consistency_agent_trace_event, consistency_agent_trace_status,
    consistency_agent_cancel, consistency_agent_resume,
    consistency_agent_interrupt,
    consistency_agent_detail, consistency_agent_results, consistency_agent_report, consistency_agent_export,
    consistency_agent_gallery, consistency_agent_images, consistency_agent_members, consistency_agent_candidates,
    consistency_agent_review, consistency_agent_review_submit, consistency_agent_analysis,
    consistency_agent_plan, consistency_agent_capacity,
    consistency_agent_model_call_start, consistency_agent_model_call_end,
    consistency_agent_diagnostics,
    consistency_agent_prepare,
    consistency_agent_session_location,
    consistency_agent_media,
    consistency_review_context, consistency_review_submit, consistency_correction_verify,
    analysis_start, analysis_list, analysis_status, analysis_node, analysis_results, analysis_cancel, analysis_retry, analysis_delete,
    image_retrieve, temporary_image_accept, temporary_image_release, temporary_image_release_owner,
    consistency_compare,consistency_evidence,consistency_evidence_media,consistency_evidence_export,
    image_index_prepare,consistency_start,consistency_status,consistency_list,consistency_cancel,consistency_delete,consistency_retry,consistency_query,consistency_report,consistency_report_saved,consistency_group_analysis,consistency_gallery,consistency_gallery_members,consistency_groups,consistency_group_members,consistency_context,
    consistency_model_status, consistency_model_cancel,
    feature_settings_view, feature_settings_save, feature_profile_create, feature_connection_check,
    module_settings_get, module_settings_save, module_settings_validate,
    model_provider_validate,
    direction_exploration_presets, direction_exploration_preset_save,
    direction_exploration_evidence, direction_exploration_remove_direction,
    tool_call, dataset_list, dataset_get, dataset_import, dataset_preview, dataset_archive_inspect, dataset_update, dataset_scan, dataset_delete,
    dataset_group_list, dataset_group_create, dataset_group_update, dataset_group_delete,
    sample_list, sample_get, sample_image_path, sample_thumbnail, sample_mask_path,
    review_queue, review_evidence, review_submit_decision, review_history,
    knowledge_review_context, knowledge_review_submit, knowledge_review_queue,
    review_stats, report_get,
    workbench_initialize, audit_sources, audit_start, audit_status, audit_cancel, audit_retry, audit_retry_options, audit_list, audit_job_samples, audit_job_sample, audit_job_report, audit_job_export, audit_evidence, inspection_context, directory_list,
    knowledge_get, knowledge_versions, knowledge_check_review, knowledge_presets, knowledge_details, knowledge_evidence, knowledge_check_remove, model_call_get,
)}


OPERATIONS.update({operation.__name__: operation for operation in ANALYSIS_AGENT_OPERATIONS})
OPERATIONS.update({operation.__name__: operation for operation in AUDIT_AGENT_OPERATIONS})

QUERY_OPERATIONS = frozenset({
    'audit_agent_snapshot','audit_agent_samples','audit_agent_sample','audit_agent_context','audit_agent_session_location', 'audit_evidence',
    'analysis_publication', 'analysis_sample_evidence', 'analysis_observations', 'analysis_direction_choices', 'analysis_sources', 'analysis_agent_catalog', 'analysis_agent_history',
    'analysis_agent_arguments', 'analysis_agent_claims',
    'consistency_agent_snapshot', 'consistency_agent_anchors', 'consistency_agent_anchor',
    'consistency_agent_detail', 'consistency_agent_results', 'consistency_agent_report', 'consistency_agent_export',
    'consistency_agent_gallery', 'consistency_agent_images', 'consistency_agent_members', 'consistency_agent_candidates', 'consistency_agent_review', 'consistency_agent_analysis',
    'consistency_agent_diagnostics',
    'consistency_agent_session_location',
    'consistency_agent_media',
    'module_settings_get',
    'knowledge_evidence',
    'knowledge_get', 'knowledge_details', 'knowledge_versions', 'knowledge_presets', 'direction_exploration_evidence', 'direction_exploration_presets',
    'analysis_list', 'analysis_status', 'analysis_node', 'analysis_results',
    'consistency_model_status',
    'audit_sources', 'audit_status', 'audit_list', 'audit_job_samples', 'audit_job_sample', 'audit_job_report', 'audit_job_export',
    'dataset_list', 'dataset_get', 'dataset_group_list', 'sample_list', 'sample_get',
    'sample_image_path', 'sample_thumbnail', 'sample_mask_path', 'report_get',
    'review_history', 'review_stats',
    'consistency_query', 'consistency_report', 'consistency_report_saved',
    'consistency_groups', 'consistency_group_members', 'consistency_gallery', 'consistency_gallery_members',
    'consistency_evidence', 'consistency_evidence_media', 'consistency_evidence_export',
    'consistency_context', 'consistency_review_context', 'consistency_group_analysis',
})
assert QUERY_OPERATIONS <= OPERATIONS.keys()


def dispatch_request(req_data: Dict[str, Any], default_db_path: str = DEFAULT_DB_PATH, query_only: bool = False):
    req_id = req_data.get("request_id", "request")
    try:
        operation = req_data.get("operation")
        if operation not in OPERATIONS:
            emit({"event": "error", "request_id": req_id, "error": {"code": "UNKNOWN_OPERATION", "message": "Unknown operation", "details": {"status_code": 400}}})
            return
        if query_only and operation not in QUERY_OPERATIONS:
            raise ValueError('作业操作不能在查询进程执行')
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
        if isinstance(error, JobExecutionError):
            code, status = error.code or 'EXECUTION_ERROR', 500
        if isinstance(error, ModelOutputError):
            code, status = 'EXECUTION_ERROR', 500
        if error.__class__.__name__ == "ToolContractError":
            code, status = "CONTRACT_ERROR", error.status_code
        if status == 500:
            traceback.print_exc(file=sys.stderr)
        details = {'status_code': status}
        if isinstance(error, JobExecutionError):
            details.update(source_run_id=error.source_run_id, source_phase=error.source_phase)
        emit({"event": "error", "request_id": req_id, "status": "ERROR", "error": {"code": code, "message": str(error), "details": details}})


def main():
    query_only = len(sys.argv) > 1 and sys.argv[1] == '--query-worker'
    if len(sys.argv) > 1 and not query_only:
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
                    executor.submit(dispatch_request, request, DEFAULT_DB_PATH, query_only)
                except (ValueError, TypeError) as error:
                    emit({"event": "error", "request_id": "decode", "error": {"code": "JSON_DECODE_ERROR", "message": str(error)}})
    finally:
        close_workbenches()


if __name__ == "__main__":
    main()
