import json
from uuid import uuid4

import pytest

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.dataset.registry import DatasetRegistry


@pytest.fixture
def distribution_audit(native_audit, tmp_path):
    jobs, dataset_id, _, role = native_audit
    shapes = [
        [('edge', [0, 0, 32, 24]), ('edge', [32, 24, 96, 72]), ('hole', [120, 90, 136, 114])],
        [('edge', [0, 0, 32, 48])],
    ]
    for index, annotations in enumerate(shapes):
        (tmp_path / 'labels' / f'part-{index}.json').write_text(json.dumps(dict(
            imageWidth=320, imageHeight=240, shapes=[dict(shape_type='rectangle', label=label,
                points=[box[:2], box[2:]]) for label, box in annotations])))
    DatasetRegistry(jobs.db).rescan(dataset_id)
    checks = ConsistencyAgentJobs(jobs.runtime)
    upstream = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[dataset_id], mode='exact'))['run_id']
    for anchor in checks.anchors(upstream):
        checks.session_created(upstream, anchor.anchor_id)
        assert checks.retrieve(upstream, anchor.anchor_id).candidates == []
        checks.submit_empty(upstream, anchor.anchor_id)
    jobs.runtime.jobs.finish_external(upstream)
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id],
        consistency_job_id=upstream), agent=role)['run_id']
    return jobs, dataset_id, run_id


def test_distribution_tool_counts_original_boxes_and_unique_images_from_frozen_inputs(distribution_audit, tmp_path):
    from iad_core.audit.operations import audit_agent_distribution

    jobs, dataset_id, run_id = distribution_audit
    result = audit_agent_distribution(dict(run_id=run_id), jobs.db.db_path)
    assert result['image_count'] == 6
    assert result['box_count'] == 4
    assert result['invalid_box_count'] == 0
    assert result['classes'] == [dict(category='edge', image_count=2, box_count=3),
        dict(category='hole', image_count=1, box_count=1)]
    assert sum(cell[2] for cell in result['heatmaps']['image_dimensions']['cells']) == 6
    assert sum(cell[2] for cell in result['heatmaps']['box_dimensions']['cells']) == 4
    assert sum(cell[2] for cell in result['heatmaps']['relative_box_dimensions']['cells']) == 4
    assert result['instance_counts'] == {'0': 4, '1': 1, '3': 1}
    filtered = audit_agent_distribution(dict(run_id=run_id, query=dict(dataset_id=dataset_id, category='edge')), jobs.db.db_path)
    assert (filtered['image_count'], filtered['box_count']) == (2, 3)
    assert filtered['classes'] == [dict(category='edge', image_count=2, box_count=3)]
    assert filtered['heatmaps']['box_dimensions']['x_edges'] == result['heatmaps']['box_dimensions']['x_edges']

    (tmp_path / 'labels' / 'part-0.json').write_text(json.dumps(dict(shapes=[])))
    DatasetRegistry(jobs.db).rescan(dataset_id)
    assert audit_agent_distribution(dict(run_id=run_id), jobs.db.db_path) == result


def test_distribution_tool_computes_quantiles_density_and_full_frequency_counts(distribution_audit):
    from iad_core.audit.operations import audit_agent_distribution

    jobs, _, run_id = distribution_audit
    result = audit_agent_distribution(dict(run_id=run_id), jobs.db.db_path)
    area = result['summaries']['relative_area']
    assert area['minimum'] == pytest.approx(.005)
    assert area['q25'] == pytest.approx(.00875)
    assert area['median'] == pytest.approx(.015)
    assert area['q75'] == pytest.approx(.025)
    assert area['lower_whisker'] == pytest.approx(.005)
    assert area['upper_whisker'] == pytest.approx(.04)
    assert area['outliers'] == []
    assert sum(result['histograms']['relative_area']['counts']) == 4
    assert len(result['histograms']['relative_area']['density']) == 128
    assert all(value >= 0 for _, value in result['histograms']['relative_area']['density'])
    assert result['histograms']['image_aspect_ratio']['density'] == []
    assert result['summaries']['image_aspect_ratio']['median'] == pytest.approx(4 / 3)
    assert result['area_by_category'][0]['category'] == 'edge'
    assert result['area_by_category'][0]['statistics']['median'] == pytest.approx(.02)


def test_report_and_export_share_the_tools_precomputed_filter_results(distribution_audit):
    from iad_core.audit.operations import audit_agent_distribution
    from iad_core.audit.queries import AuditQueries
    from iad_core.audit.reports import AuditReports

    jobs, dataset_id, run_id = distribution_audit
    queries = AuditQueries(jobs.db)
    report = queries.report(run_id)
    assert report.data_distribution.datasets == [dataset_id]
    assert report.data_distribution.categories == ['edge', 'hole']
    for view in report.data_distribution.slices:
        assert view.model_dump(mode='json') == audit_agent_distribution(dict(run_id=run_id,
            query=dict(dataset_id=view.dataset_id, category=view.category)), jobs.db.db_path)
    jobs.cancel(run_id)
    AuditReports(jobs.db).finalize(run_id)
    exported = queries.export(run_id)
    payload = json.loads(exported['html'].split('<script id="audit-report-data" type="application/json">')[1].split('</script>')[0])
    assert payload['report']['data_distribution'] == report.data_distribution.model_dump(mode='json')

    with jobs.db.connection() as connection:
        connection.execute("UPDATE audit_workflow_runs SET summary_json=json_remove(summary_json,'$.data_distribution') WHERE job_id=?", (run_id,))
    assert queries.report(run_id).data_distribution == report.data_distribution
    assert queries.export(run_id)['html'] == exported['html']


def test_distribution_service_handles_empty_cross_filters_and_invalid_geometry(distribution_audit):
    from iad_core.audit.distribution import AuditDistributions
    from iad_core.audit.distribution_models import AuditDistributionQuery
    from iad_core.storage.models import Annotation

    jobs, dataset_id, run_id = distribution_audit
    manifest = jobs.snapshot(run_id).manifest
    first, second, *remaining = manifest.records
    invalid = Annotation(annotation_id='invalid', sample_id=first.sample.sample_id, raw_label='edge',
        annotation_type='bbox', bbox=[5, 0, 5, 10], geometry_status='INVALID')
    first = first.model_copy(update={'annotations': [*first.annotations, invalid]})
    second = second.model_copy(update={'sample': second.sample.model_copy(update={'dataset_id': 'other'})})
    source = AuditDistributions(manifest.model_copy(update={'dataset_ids': [dataset_id, 'other'], 'records': [first, second, *remaining]}))
    whole = source.view()
    assert (whole.image_count, whole.box_count, whole.invalid_box_count) == (6, 5, 1)
    assert sum(whole.histograms['relative_area'].counts) == 4
    assert source.geometry().box_count == 4
    empty = source.view(AuditDistributionQuery(dataset_id='other', category='hole'))
    assert (empty.image_count, empty.box_count) == (0, 0)
    assert empty.classes == []
    assert empty.histograms['relative_area'].density == []
    assert empty.heatmaps['box_dimensions'].cells == []
    assert empty.heatmaps['box_dimensions'].x_edges == whole.heatmaps['box_dimensions'].x_edges
    with pytest.raises(ValueError, match='冻结范围'):
        source.view(AuditDistributionQuery(dataset_id='unselected'))


def test_folder_distribution_counts_image_labels_without_inventing_boxes(distribution_audit):
    from iad_core.audit.distribution import AuditDistributions
    from iad_core.audit.distribution_models import AuditDistributionQuery
    from iad_core.storage.models import QualityStatus

    jobs, _, run_id = distribution_audit
    manifest = jobs.snapshot(run_id).manifest
    records = [record.model_copy(update={'dataset_format': 'folder_classification', 'annotations': [],
        'sample': record.sample.model_copy(update={'quality_status': QualityStatus.PASS if index < 4 else QualityStatus.FAIL})})
        for index, record in enumerate(manifest.records)]
    source = AuditDistributions(manifest.model_copy(update={'records': records}))
    result = source.view()
    assert result.box_count is None
    assert [(item.category, item.image_count, item.box_count) for item in result.classes] == [('FAIL', 2, None), ('PASS', 4, None)]
    assert list(result.heatmaps) == ['image_dimensions']
    assert list(result.histograms) == ['image_aspect_ratio']
    assert result.instance_counts == {} and result.area_by_category == []
    assert source.view(AuditDistributionQuery(category='FAIL')).image_count == 2


def test_boxplot_whiskers_outliers_and_normalized_upper_boundary_use_all_original_values(distribution_audit):
    from iad_core.audit.distribution import AuditDistributions
    from iad_core.storage.models import Annotation

    jobs, _, run_id = distribution_audit
    manifest = jobs.snapshot(run_id).manifest
    original = manifest.records[0]
    record = original.model_copy(update={'sample': original.sample.model_copy(update={'width': 100, 'height': 100}),
        'annotations': [Annotation(annotation_id=f'box-{height}', sample_id=original.sample.sample_id,
            annotation_type='bbox', raw_label='edge', bbox=[0, 0, 10, height]) for height in [1, 2, 3, 4, 100]]})
    view = AuditDistributions(manifest.model_copy(update={'records': [record]})).view()
    summary = view.summaries['relative_area']
    assert (summary.q25, summary.median, summary.q75) == pytest.approx((.002, .003, .004))
    assert (summary.lower_whisker, summary.upper_whisker) == pytest.approx((.001, .004))
    assert summary.outliers == [(pytest.approx(.1), 1)]
    heatmap = view.heatmaps['relative_box_dimensions']
    assert sum(count for _, _, count in heatmap.cells) == 5
    assert sum(count for _, y, count in heatmap.cells if y == len(heatmap.y_edges) - 2) == 1
