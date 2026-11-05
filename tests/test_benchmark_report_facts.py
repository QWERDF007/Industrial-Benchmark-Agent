import shutil
import json
import os
from pathlib import Path
import subprocess
import sys

from iad_core.dataset.registry import DatasetImport
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.audit_protocol import AUDIT_GENERATION_VERSION


def test_report_freezes_the_selected_datasets_deduplicates_audits_and_keeps_missing_metric_evidence_explicit(dataset, mllm_api, tmp_path):
    from iad_core.workbench.benchmark_report import BenchmarkReportFacts

    db, registry, first = dataset
    client, _, _ = mllm_api
    shutil.copytree(tmp_path/'images', tmp_path/'other-images')
    shutil.copytree(tmp_path/'labels', tmp_path/'other-labels')
    second = registry.import_labelme(DatasetImport(format='labelme', name='未审计子集',
        image_dir=str(tmp_path/'other-images'), annotation_dir=str(tmp_path/'other-labels')))
    runtime = WorkbenchRuntime(db, VlmClient(client))
    first_target = first.dataset.id+':dent.png'
    second_target = first.dataset.id+':scratch.png'
    try:
        earlier = runtime.audit.start(dataset_id=first.dataset.id, sample_ids=[first_target])
        runtime.audit.wait(earlier['run_id'], 5)
        later = runtime.audit.start(dataset_id=first.dataset.id, sample_ids=[first_target, second_target])
        runtime.audit.wait(later['run_id'], 5)
        assert runtime.audit.status(later['run_id'])['status'] == 'COMPLETED'
        facts = BenchmarkReportFacts(db).capture([first.dataset.id, second.dataset.id, first.dataset.id])
        assert facts.registered_samples == 8
        assert facts.audited_samples == 2
        assert facts.coverage.numerator == 2 and facts.coverage.denominator == 8
        assert facts.included_run_ids == [later['run_id']]
        assert facts.excluded_audit_records['superseded'] == 1
        assert facts.outcomes == {'normal_candidate': 2, 'anomaly_candidate': 0, 'insufficient': 0, 'not_processed': 6}
        assert {case.sample_id for case in facts.cases} == {first_target, second_target}
        assert facts.annotation_coverage.annotated_samples == 4
        assert facts.annotation_coverage.unannotated_samples == 4
        assert facts.annotation_coverage.bbox_samples == 4
        assert facts.annotation_coverage.mask_samples == 0
        assert facts.annotation_coverage.completeness_unknown_samples == 8
        assert facts.label_comparison.numerator == 0 and facts.label_comparison.denominator == 0
        assert facts.label_comparison.percent is None, '没有明确原标时不伪造标签比较结果'
        assert facts.gold_by_policy == []
        assert facts.evaluation_evidence == []
        assert facts.independence['physical_sample_id'].missing_samples == 8
        assert facts.knowledge_versions and facts.consistency_records
        assert len(facts.signature) == 64
        saved = facts.model_dump_json(round_trip=True)
        assert type(facts).model_validate_json(saved).model_dump_json(round_trip=True) == saved
        next_job = runtime.audit.start(dataset_id=first.dataset.id, sample_ids=[first_target])
        runtime.audit.wait(next_job['run_id'], 5)
        refreshed = BenchmarkReportFacts(db).capture([first.dataset.id, second.dataset.id])
        assert next_job['run_id'] in refreshed.included_run_ids
        assert facts.model_dump_json(round_trip=True) == saved, '冻结报告不能随新审计记录变化'
    finally:
        runtime.close()


def test_new_reports_exclude_audits_from_a_changed_protocol_without_rewriting_frozen_facts(dataset, mllm_api, tmp_path):
    from iad_core.workbench.benchmark_report import BenchmarkReportFacts

    db, _, config = dataset
    client, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(client))
    try:
        audit = runtime.audit.start(dataset_id=config.dataset.id,
            sample_ids=[config.dataset.id+':dent.png', config.dataset.id+':scratch.png'])
        runtime.audit.wait(audit['run_id'], 5)
        assert runtime.audit.status(audit['run_id'])['status'] == 'COMPLETED'
        original = BenchmarkReportFacts(db).capture([config.dataset.id])
        assert original.audited_samples == 2
        frozen = original.model_dump_json(round_trip=True)
    finally:
        runtime.close()

    installed = tmp_path/'updated-build'
    package = installed/'iad_core'
    shutil.copytree(Path(__file__).resolve().parents[1]/'python/iad_core', package,
        ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    old = f"AUDIT_GENERATION_VERSION = {AUDIT_GENERATION_VERSION!r}"
    matching = [path for path in package.rglob('*.py') if old in path.read_text()]
    assert len(matching) == 1
    source = matching[0]
    source.write_text(source.read_text().replace(old, "AUDIT_GENERATION_VERSION = 'updated-audit-protocol'"))
    process = subprocess.run([sys.executable, '-c', '''
import json,sys
from iad_core.storage.database import Database
from iad_core.workbench.benchmark_report import BenchmarkFacts,BenchmarkReportFacts
from iad_core.workbench.runtime import WorkbenchRuntime
runtime=WorkbenchRuntime(Database(sys.argv[1]))
try:
    facts=BenchmarkReportFacts(runtime.db).capture([sys.argv[2]])
    restored=BenchmarkFacts.model_validate_json(sys.argv[3])
    print(json.dumps({'audited':facts.audited_samples,'coverage':facts.coverage.numerator,
        'excluded':facts.excluded_audit_records,'runs':facts.included_run_ids,
        'frozen_audited':restored.audited_samples,'frozen_signature':restored.signature,
        'old_job_status':runtime.audit.status(sys.argv[4])['status']}))
finally:
    runtime.close()
''', db.db_path, config.dataset.id, frozen, audit['run_id']],
        env={**os.environ, 'PYTHONPATH':str(installed)}, capture_output=True, text=True, timeout=15, check=True)
    result = json.loads(process.stdout)
    assert result['audited'] == result['coverage'] == 0, '新报告不能用已失效协议的旧结果填补覆盖率'
    assert result['excluded'] == {'protocol_changed_or_unverified':2}
    assert result['runs'] == []
    assert result['frozen_audited'] == 2 and result['frozen_signature'] == original.signature
    assert result['old_job_status'] == 'COMPLETED', '排除旧结果不篡改原始作业和模型输出'
