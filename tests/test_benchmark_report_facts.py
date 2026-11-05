import shutil

from iad_core.dataset.registry import DatasetImport
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


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
