"""Verify learned normal patterns and joint inspection against the live VLM in a database snapshot."""
import argparse
import json
import sqlite3
import time
from pathlib import Path

from iad_core.advisory.repository import AuditSuggestionRepository
from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.audit import AuditService
from iad_core.workbench.query import SampleQuery, WorkbenchQuery


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="data/benchmark.db")
    parser.add_argument("--output", default="runs/verification/workbench-live")
    parser.add_argument("--failed-run", help="Verify the first two failures from a persisted audit job")
    options = parser.parse_args()
    output = Path(options.output)
    output.mkdir(parents=True, exist_ok=True)
    snapshot = output / "snapshot.db"
    if snapshot.exists():
        raise ValueError("Choose a fresh output directory for each verification")
    with sqlite3.connect(f"file:{Path(options.db).resolve()}?mode=ro", uri=True) as source, sqlite3.connect(snapshot) as dest:
        source.backup(dest)
    db = Database(str(snapshot))
    registry, query = DatasetRegistry(db), WorkbenchQuery(db)
    dataset = registry.list()[0]
    if options.failed_run:
        with db.connection() as conn:
            row = conn.execute("SELECT payload_json FROM job_runs WHERE job_id=? AND job_type='MODEL_AUDIT'", (options.failed_run,)).fetchone()
        payload = json.loads(row[0])
        dataset = registry.get(payload['dataset_id'])
        targets = payload['errors'][:2]
    else:
        targets = query.samples(SampleQuery(dataset_id=dataset.dataset.id, annotation_filters=["present"], page_size=2))["items"]
    assert len(targets) == 2 and registry.references(dataset.dataset.id)
    requests = []
    class RecordingVlm(VlmClient):
        def generate(self, response_type, instruction, images, model_name, max_tokens=2048):
            requests.append({"stage": response_type.__name__, "model": model_name,
                             "images": [image.evidence.model_dump(mode="json") for image in images]})
            return super().generate(response_type, instruction, images, model_name, max_tokens)
    service = AuditService(db, RecordingVlm())
    started = time.monotonic()
    latencies, progress = [], []
    try:
        job = service.start(dataset_id=dataset.dataset.id, sample_ids=[item["sample_id"] for item in targets])
        while job["status"] in ("RUNNING", "PENDING"):
            before = time.monotonic()
            query.samples(SampleQuery(dataset_id=dataset.dataset.id, page_size=24))
            latencies.append(time.monotonic() - before)
            progress.append({key: job[key] for key in ("status", "completed", "failed", "progress", "message")})
            print(json.dumps(progress[-1]), flush=True)
            if time.monotonic() - started > 240:
                service.cancel(job["run_id"])
                raise TimeoutError("Live verification exceeded 240 seconds")
            time.sleep(1)
            job = service.status(job["run_id"])
        suggestions = [suggestion for item in targets
                       for suggestion in AuditSuggestionRepository(db).list_by_sample(item["sample_id"])
                       if suggestion.audit_run_id == job["run_id"]]
        result = {"job": job, "elapsed_seconds": round(time.monotonic() - started, 2),
                  "max_list_latency_seconds": round(max(latencies), 3), "progress_samples": progress,
                  "requests": requests, "suggestions": [item.model_dump(mode="json") for item in suggestions]}
        (output / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
        assert job["status"] == "COMPLETED", job
        assert len(suggestions) == len(targets)
        assert all(item.reference_sample_ids and item.confidence is not None and item.analysis for item in suggestions)
        assert len({item.analysis.profile_id for item in suggestions}) == 1
        assert all(item.analysis.regions and item.analysis.global_view.illumination_analysis for item in suggestions)
        assert all(region.observation.position_analysis for item in suggestions for region in item.analysis.regions)
        assert all(item.analysis.coverage.complete for item in suggestions)
        for item in suggestions:
            ids = {item.analysis.overview.evidence_id, *[r.image.evidence_id for r in item.analysis.regions]}
            assert set(item.analysis.conclusion.evidence_ids) <= ids
        finals = [request for request in requests if request["stage"] == "JointAnalysis"]
        assert len(finals) == sum(len(item.analysis.joint_steps) for item in suggestions)
        assert all(request["images"][0]["role"] == "overview" and any(i["role"] == "roi" for i in request["images"]) for request in finals)
        print(json.dumps({key: result[key] for key in ("elapsed_seconds", "max_list_latency_seconds")}), flush=True)
    finally:
        service.close()


if __name__ == "__main__":
    main()
