import pytest
import json

from iad_core import entry
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.runtime import workbench


@pytest.mark.parametrize('operation', ['consistency_agent_capacity', 'consistency_agent_model_call_start',
    'consistency_agent_model_call_end'])
def test_retired_orchestrator_writes_are_unavailable(operation, tmp_path, capsys):
    entry.dispatch_request({'operation': operation}, str(tmp_path / 'unused.db'))
    assert json.loads(capsys.readouterr().out)['error']['code'] == 'UNKNOWN_OPERATION'


def test_direct_python_analysis_cannot_launch_a_second_consistency_model_engine(dataset):
    db, _, config = dataset
    try:
        with pytest.raises(ValueError, match='原生宿主'):
            entry.analysis_start({'request': {'analysis_kind': 'consistency', 'dataset_ids': [config.dataset.id], 'mode': 'exact'}}, db.db_path)
        assert AnalysisJobViews(db).list(config.dataset.id, 'consistency') == []
    finally:
        workbench(db.db_path).close()
