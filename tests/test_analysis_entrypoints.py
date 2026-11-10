import pytest
import json

from iad_core.entry import analysis_list, analysis_start


def test_python_bridge_requires_the_native_host_without_allocating_an_old_workflow(dataset):
    db, _, config = dataset
    with pytest.raises(ValueError, match='原生宿主'):
        analysis_start(dict(request=dict(analysis_kind='exploration')), db.db_path)
    assert analysis_list(dict(dataset_id=config.dataset.id, analysis_kind='exploration'), db.db_path)['jobs'] == []


@pytest.mark.parametrize("operation", ["dataset_report_start", "dataset_report_get", "dataset_report_list", "dataset_report_status", "dataset_report_export", "knowledge_prompt_get", "knowledge_sources", "knowledge_scope_get", "knowledge_scope_stop", "knowledge_observations",
    "knowledge_status", "knowledge_cancel", "knowledge_retry_options", "knowledge_list", "knowledge_job_delete",
    "direction_exploration_status", "direction_exploration_list", "direction_exploration_cancel", "direction_exploration_delete", "direction_exploration_get"])
def test_retired_analysis_operations_are_absent(dataset,capsys,operation):
    from iad_core.entry import dispatch_request
    db, _, _ = dataset
    dispatch_request(dict(operation=operation,arguments={'request':{}}),db.db_path)
    response=json.loads(capsys.readouterr().out)
    assert response['event']=='error'
    assert response['error']['code']=='UNKNOWN_OPERATION'
