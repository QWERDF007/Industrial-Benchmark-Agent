from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery, GalleryReference
from iad_core.consistency.group_analysis import GroupAnalysisQueries
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.workbench.runtime import WorkbenchRuntime
from tests.consistency_history import save_group_history


def test_historical_gallery_results_are_readable_without_a_model_service_or_native_session(dataset):
    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    try:
        runtime.consistency_service.compare(ConsistencyCompare(sample_a=config.dataset.id + ':dent.png', sample_b=config.dataset.id + ':scratch.png'))
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        gallery = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id, kind='conflicts'))
        reference = {'query_id': page.query_id, 'kind': 'conflicts', 'group_id': gallery.items[0].group_id}
        run = save_group_history(db, reference, {'scratch.png': '类别不一致'})
        reader = GroupAnalysisQueries(db)
        value = reader.read(GalleryReference.model_validate(reference))
        assert value.status == 'COMPLETED'
        assert value.run_id == run
        assert value.result.overall.text == '类别不一致'
        assert value.result.assessments[0].candidate_id == config.dataset.id + ':scratch.png'
        assert reader.read(GalleryReference.model_validate(reference)) == value
        assert not hasattr(value, 'session_id')
    finally:
        runtime.close()
