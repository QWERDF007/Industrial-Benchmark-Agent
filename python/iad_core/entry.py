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
from iad_core.storage.repositories import AnnotationRepository, ImportIssueRepository, ReviewRepository, SampleRepository
from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.dataset.path_safety import PathSafetyError, validate_sample_image_path
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.workbench.projection import suggestion_meta as extract_suggestion_meta
from iad_core.workbench.query import SampleQuery, WorkbenchQuery
from iad_core.workbench.review import HumanReview, ReviewSubmission

DEFAULT_DB_PATH = os.environ.get("IAD_DB_PATH", "data/benchmark.db")
_output_lock = threading.Lock()
_service_lock = threading.Lock()
_workbenches = {}


def emit(payload: Dict[str, Any]) -> None:
    with _output_lock:
        sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
        sys.stdout.flush()


def workbench(db_path):
    from iad_core.workbench.runtime import WorkbenchRuntime
    key = os.path.abspath(db_path)
    with _service_lock:
        if key not in _workbenches:
            _workbenches[key] = WorkbenchRuntime(Database(key))
        return _workbenches[key]


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
    config = registry.import_labelme(DatasetImport.model_validate(args))
    return dataset_get({"dataset_id": config.dataset.id}, db_path)


def dataset_update(args, db_path):
    registry = DatasetRegistry(Database(db_path))
    if "name" in args:
        registry.rename(args["dataset_id"], args["name"])
    if "reference_sample_ids" in args:
        registry.set_references(args["dataset_id"], args["reference_sample_ids"])
    if "unannotated_is_normal" in args:
        config = registry.get(args["dataset_id"])
        if not isinstance(args["unannotated_is_normal"], bool):
            raise ValueError("unannotated_is_normal must be a boolean")
        config.dataset.unannotated_is_normal = args["unannotated_is_normal"]
        registry.save(config)
    return dataset_get({"dataset_id": args["dataset_id"]}, db_path)


def dataset_scan(args, db_path):
    from iad_core.dataset.scanner import scan_dataset
    if args.get("config_path"):
        return scan_dataset(config_path=args["config_path"], db_path=db_path).model_dump()
    config = DatasetRegistry(Database(db_path)).resolve(dataset_id=args.get("dataset_id"), task_id=args.get("task_id"))
    return scan_dataset(config=config, db_path=db_path).model_dump()


def sample_list(args, db_path):
    return WorkbenchQuery(Database(db_path)).samples(SampleQuery.model_validate(args))


def sample_get(args, db_path):
    db = Database(db_path)
    sample = SampleRepository(db).get(args["sample_id"])
    if not sample:
        raise LookupError("Sample not found")
    suggestions = AuditSuggestionRepository(db).list_by_sample(sample.sample_id)
    meta = extract_suggestion_meta(suggestions[0]) if suggestions else None
    issues = ImportIssueRepository(db).list_by_sample(sample.sample_id)
    decision = ReviewRepository(db).get_decision(sample.sample_id)
    from iad_core.workbench.normal import NormalProfiles
    profile = NormalProfiles(db).get(meta["analysis"]["profile_id"]) if meta and meta.get("analysis") else None
    return {"sample": sample.model_dump(), "normal_profile": profile.model_dump() if profile else None, "suggestion": meta, **WorkbenchQuery(db).sample_scores(sample.sample_id),
            "annotations": [a.model_dump() for a in AnnotationRepository(db).list_by_sample(sample.sample_id)],
            "technical_issues": [i.model_dump() for i in issues], "review_decision": decision.model_dump() if decision else None}


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


def review_queue(args, db_path):
    from iad_core.review.service import ReviewQueueService
    service = ReviewQueueService(task_id=args["task_id"], db_path=db_path)
    page, size = int(args.get("page", 1)), int(args.get("page_size", 20))
    return {"task_id": args["task_id"], "total_candidates": len(service.candidates), "page": page,
            "page_size": size, "items": service.get_queue(limit=size, offset=(page - 1) * size)}


def review_evidence(args, db_path):
    from iad_core.evidence.builder import EvidenceBuilder
    return EvidenceBuilder(task_id=args["task_id"], db_path=db_path).build(args["sample_id"]).model_dump()


def review_start_session(args, db_path):
    return HumanReview(Database(db_path)).start(**args)


def review_submit_decision(args, db_path):
    return HumanReview(Database(db_path)).submit(ReviewSubmission.model_validate(args))


def review_finish_session(args, db_path):
    return HumanReview(Database(db_path)).finish(**args)


def review_stats(args, db_path):
    return WorkbenchQuery(Database(db_path)).report(**args)


def report_get(args, db_path):
    return WorkbenchQuery(Database(db_path)).report(**args)


def audit_start(args, db_path):
    return workbench(db_path).audit.start(**args)


def audit_status(args, db_path):
    return workbench(db_path).audit.status(args["run_id"])


def audit_cancel(args, db_path):
    return workbench(db_path).audit.cancel(args["run_id"])


def audit_list(args, db_path):
    return {"jobs": workbench(db_path).audit.list(args["dataset_id"])}


def audit_evidence(args, db_path):
    from iad_core.evidence.images import EvidenceImages
    suggestion = AuditSuggestionRepository(Database(db_path)).get(args["suggestion_id"])
    if not suggestion or not suggestion.analysis:
        raise LookupError("Audit evidence not found")
    for image in [suggestion.analysis.overview, *[region.image for region in suggestion.analysis.regions]]:
        if image.evidence_id == args["evidence_id"]:
            return {"path": EvidenceImages(db_path).path(image), "media_type": image.media_type}
    raise LookupError("Audit evidence not found")


def audit_profile(args, db_path):
    from iad_core.workbench.normal import NormalProfiles
    from iad_core.workbench.audit import DEFAULT_MODEL
    profiles = NormalProfiles(Database(db_path))
    profile = profiles.get(args["profile_id"]) if args.get("profile_id") else profiles.current(args["dataset_id"], args.get("model_name", DEFAULT_MODEL))
    return {"profile": profile.model_dump() if profile else None}


def knowledge_get(args, db_path):
    from iad_core.knowledge.repository import KnowledgeRepository
    repository = KnowledgeRepository(Database(db_path))
    if args.get("version_id"):
        snapshot = repository.get(args["version_id"])
        if args.get("dataset_id") and snapshot.dataset_id != args["dataset_id"]:
            raise ValueError("Knowledge version belongs to another dataset")
        if args.get("kind") and snapshot.kind != args["kind"]:
            raise ValueError("Knowledge version has a different kind")
    else:
        if args.get("kind") not in ("normal", "defect"):
            raise ValueError("Knowledge kind must be normal or defect")
        DatasetRegistry(repository.db).get(args["dataset_id"])
        snapshot = repository.current(args["dataset_id"], args["kind"])
    return {"knowledge": snapshot.model_dump() if snapshot else None}


def knowledge_start(args, db_path):
    return workbench(db_path).knowledge.start(**args)


def knowledge_status(args, db_path):
    return workbench(db_path).knowledge.status(args["run_id"])


def knowledge_cancel(args, db_path):
    return workbench(db_path).knowledge.cancel(args["run_id"])


def knowledge_list(args, db_path):
    return {"jobs": workbench(db_path).knowledge.list(args["dataset_id"])}


def knowledge_evidence(args, db_path):
    from iad_core.evidence.images import EvidenceImages
    from iad_core.knowledge.repository import KnowledgeRepository
    snapshot = KnowledgeRepository(Database(db_path)).get(args["version_id"])
    for evidence in snapshot.evidence:
        if evidence.image.evidence_id == args["evidence_id"]:
            return {"path": EvidenceImages(db_path).path(evidence.image), "media_type": evidence.image.media_type}
    raise LookupError("Knowledge evidence not found")


def directory_list(args, db_path):
    return DatasetRegistry.directories(args.get("path", "/data1"))


OPERATIONS = {handler.__name__: handler for handler in (
    tool_call, dataset_list, dataset_get, dataset_import, dataset_update, dataset_scan,
    sample_list, sample_get, sample_image_path, sample_thumbnail,
    review_queue, review_evidence, review_start_session, review_submit_decision, review_finish_session,
    review_stats, report_get, audit_start, audit_status, audit_cancel, audit_list, audit_profile, audit_evidence, directory_list,
    knowledge_get, knowledge_evidence, knowledge_start, knowledge_status, knowledge_cancel, knowledge_list,
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
        for service in _workbenches.values():
            service.close()


if __name__ == "__main__":
    main()
