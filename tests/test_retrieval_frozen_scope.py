from contextlib import closing

import pytest
from PIL import Image
from pathlib import Path

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ImageRetrieve
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.workbench.runtime import WorkbenchRuntime


def test_a_supplied_frozen_corpus_is_validated_once_for_a_zero_candidate_query(dataset, monkeypatch):
    db, _, config = dataset
    scope = ConsistencyScopes(db).resolve({'kind': 'datasets', 'dataset_ids': [config.dataset.id]})
    resolve = ConsistencyScopes.resolve
    scans = []

    def capture(self, selector, connection=None):
        scans.append(selector)
        return resolve(self, selector, connection)

    monkeypatch.setattr(ConsistencyScopes, 'resolve', capture)
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':normal.png'},
        corpus_scope=scope.selector, mode='exact')
    with closing(WorkbenchRuntime(db)) as runtime:
        page = runtime.consistency_service.retrieve_full(request, frozen_scope=scope)
        assert page.scope_id == scope.scope_id
        assert page.member_count == 0
        assert page.exact.status == 'READY'
        assert len(scans) == 1, 'Reuse the frozen manifest; construct current membership once to validate it'


def test_a_supplied_frozen_corpus_still_rejects_a_scan_changed_before_retrieval(dataset):
    db, registry, config = dataset
    scope = ConsistencyScopes(db).resolve({'kind': 'datasets', 'dataset_ids': [config.dataset.id]})
    Image.new('RGB', (320, 240), 'green').save(Path(config.root) / 'normal.png')
    registry.rescan(config.dataset.id)
    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': config.dataset.id + ':normal.png'},
        corpus_scope=scope.selector, mode='exact')
    with closing(WorkbenchRuntime(db)) as runtime, pytest.raises(ConsistencyError, match='Frozen retrieval corpus changed'):
        runtime.consistency_service.retrieve_full(request, frozen_scope=scope)
