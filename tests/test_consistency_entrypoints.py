import pytest

from iad_core import entry
from iad_core.workbench.analysis_job_views import AnalysisJobViews
from iad_core.workbench.runtime import workbench


def test_direct_python_analysis_cannot_launch_a_second_consistency_model_engine(dataset):
    db, _, config = dataset
    try:
        with pytest.raises(ValueError, match='原生宿主'):
            entry.analysis_start({'request': {'analysis_kind': 'consistency', 'dataset_ids': [config.dataset.id], 'mode': 'exact'}}, db.db_path)
        assert AnalysisJobViews(db).list(config.dataset.id, 'consistency') == []
    finally:
        workbench(db.db_path).close()
